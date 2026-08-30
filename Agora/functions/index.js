// Cloud Functions for Agora: admin-only account moderation (ban/delete
// someone else's Firebase Auth login, which the client SDK can never do -
// that's why "Leave Agora" and admin actions both need a trusted backend),
// the account-lifecycle emails (Welcome/Farewell/Ban notice/Deletion
// notice), a flagged-social admin alert, and a scheduled sweep for
// abandoned signups. All 2nd-gen (firebase-functions/v2) - the legacy
// functions.config()/functions.https.onCall 1st-gen style is deprecated.
//
// Deploy with: firebase deploy --only functions
// Requires the Blaze (pay-as-you-go) plan - Cloud Functions aren't
// available on the free Spark plan. Requires the RESEND_API_KEY secret to
// be set once (see functions/lib/resend.js) before any email actually
// sends - every send is best-effort, so the underlying account action
// still succeeds even if that secret is missing or Resend is down.
// Content moderation (see lib/moderation.js) additionally needs the
// GOOGLE_MODERATION_API_KEY secret set once before it can actually check
// anything - see the "Content moderation" section near the bottom of this
// file for what happens in the gap before that's done.

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { resendApiKey, sendEmail, sendEmailSafe } = require("./lib/resend");
const {
  loadTemplate,
  withReason,
  withNewsletterContent,
  withPasswordResetLink,
  withEmailChangeVerifyLink,
  withEmailChangeNotice,
} = require("./lib/templates");
const { notify, resolveDisplayName } = require("./lib/notify");
const { moderationApiKey, analyzeText, analyzeImage } = require("./lib/moderation");
const {
  aiEmailApiKey,
  aiEmailWebhookSecret,
  isValidSlug,
  createMailbox,
  verifyMailboxToken,
  sendAiEmail,
  mailboxForAddress,
  verifyResendWebhookSignature,
  fetchReceivedEmail,
} = require("./lib/aiEmail");

admin.initializeApp();

const OWNER_EMAIL = "VirtuaMakers@Outlook.com";

// Multi-admin system (Chris, 2026-08-15) - mirrors firestore.rules'
// isOwner()/isFullAdmin()/isAtLeastModerator(). The owner is a permanent,
// never-lockoutable account checked by email alone; anyone else's role
// (if any) lives in admins/{uid}, granted/revoked only by the owner (see
// firestore.rules for why that's not delegated to admins themselves).
async function getRole(auth) {
  if (!auth) return null;
  // Case-insensitive on purpose - matches firestore.rules' isOwner();
  // Firebase Auth doesn't normalize email casing, so a literal ===
  // could silently deny the real owner if their account's email differs
  // in case from this exact string.
  if (auth.token.email && auth.token.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return "owner";
  const snap = await admin.firestore().collection("admins").doc(auth.uid).get();
  return snap.exists ? snap.data().role : null;
}

async function assertIsAdmin(auth) {
  const role = await getRole(auth);
  if (role !== "owner" && role !== "admin") {
    throw new HttpsError("permission-denied", "Admin only.");
  }
}

async function assertIsModerator(auth) {
  const role = await getRole(auth);
  if (!role) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
}

// Permanently deletes another member's Firebase Auth login and Firestore
// profile. Irreversible - the member would have to sign up fresh. Sends
// the deletion-notice email (with the admin's typed reason substituted in)
// before actually deleting anything, since the email needs the profile's
// address while it still exists.
exports.adminDeleteUser = onCall({ secrets: [resendApiKey] }, async (request) => {
  await assertIsAdmin(request.auth);
  const uid = request.data && request.data.uid;
  const reason = request.data && request.data.reason;
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }

  const profileRef = admin.firestore().collection("profiles").doc(uid);
  const profileSnap = await profileRef.get();
  const email = profileSnap.exists ? profileSnap.data().email : null;

  if (email) {
    const html = withReason(loadTemplate("deletion-notice-email.html"), reason);
    await sendEmailSafe({
      to: email,
      subject: "Your Agora Account Has Been Permanently Deleted",
      html: html,
    });
  }

  await profileRef.delete();
  await admin.auth().deleteUser(uid);
  return { success: true };
});

// Disables or re-enables another member's Firebase Auth login (they can't
// sign in at all while disabled) and mirrors that onto their profile's
// status field. Reversible, unlike adminDeleteUser. Only sends the ban
// notice when actually suspending, not on reinstatement - there's no
// "welcome back" email.
exports.adminBanUser = onCall({ secrets: [resendApiKey] }, async (request) => {
  await assertIsAdmin(request.auth);
  const uid = request.data && request.data.uid;
  const disabled = !!(request.data && request.data.disabled);
  const reason = request.data && request.data.reason;
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }

  await admin.auth().updateUser(uid, { disabled: disabled });
  await admin.firestore().collection("profiles").doc(uid).update({
    status: disabled ? "suspended" : "active",
  });

  if (disabled) {
    const profileSnap = await admin.firestore().collection("profiles").doc(uid).get();
    const email = profileSnap.exists ? profileSnap.data().email : null;
    if (email) {
      const html = withReason(loadTemplate("ban-notice-email.html"), reason);
      await sendEmailSafe({
        to: email,
        subject: "Your Agora 🌐 Profile Has Been Suspended",
        html: html,
      });
    }
  }
  return { success: true };
});

// Deletes the CALLER's own Firebase Auth login and Firestore profile -
// the "Permanently Leave Agora" flow. Runs as the Admin SDK server-side
// (unlike a client-side user.delete(), which requires a recent sign-in),
// so there's no auth/requires-recent-login dead end to work around here.
// leave-agora.js falls back to the old direct client-side delete if this
// function isn't deployed yet or the call fails.
exports.selfDeleteAccount = onCall({ secrets: [resendApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = request.auth.uid;

  const profileRef = admin.firestore().collection("profiles").doc(uid);
  const profileSnap = await profileRef.get();
  const email = profileSnap.exists ? profileSnap.data().email : null;

  if (email) {
    await sendEmailSafe({
      to: email,
      subject: "Sorry to See You Leave, Agora 🌐",
      html: loadTemplate("farewell-email.html"),
    });
  }

  await profileRef.delete();
  await admin.auth().deleteUser(uid);
  return { success: true };
});

// Sends our own branded password-reset email via Resend instead of
// Firebase Auth's plain default template - the Admin SDK generates the
// real reset link server-side (still Firebase's own action-handling page
// on the other end of it, just our letterhead around the link itself, not
// a custom landing page - that's a bigger build Chris didn't ask for).
// Never reveals whether the email is registered: generatePasswordResetLink
// throws auth/user-not-found for an unregistered email, which is
// swallowed here exactly like a real send, matching the generic "if an
// account exists…" wording already in the sign-in modal (auth-ui.js) - the
// client can't tell the two cases apart either way.
exports.sendPasswordReset = onCall({ secrets: [resendApiKey] }, async (request) => {
  const email = ((request.data && request.data.email) || "").trim();
  if (!email) {
    throw new HttpsError("invalid-argument", "Email is required.");
  }

  let link;
  try {
    link = await admin.auth().generatePasswordResetLink(email);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      return { success: true };
    }
    throw new HttpsError("invalid-argument", "That doesn't look like a valid email address.");
  }

  await sendEmailSafe({
    to: email,
    subject: "Reset Your Agora 🌐 Password",
    html: withPasswordResetLink(loadTemplate("password-reset-email.html"), link),
  });

  return { success: true };
});

// Change Login Email (Chris, 2026-08-15) - the standard pattern (what
// Google/GitHub do): require a fresh re-login before allowing this,
// verify the *new* address before it actually takes effect, and notify
// the *old* address so a hijacker can't silently redirect someone else's
// account. Deliberately not building phone-based 2FA/account-recovery
// alongside this - see CLAUDE.md's "Email/account security" entry for why
// that's a separate, later piece of work.
//
// generateVerifyAndChangeEmailLink() (Admin SDK) has no "recent login"
// restriction of its own - that's a client-SDK-only concept normally
// enforced by updateEmail()/verifyBeforeUpdateEmail() throwing
// auth/requires-recent-login. Since this flow generates the link
// server-side instead (so the confirmation email can carry our own
// branding, same reason sendPasswordReset above does this), that check is
// replicated here against the ID token's auth_time claim (when the
// member actually last signed in/reauthenticated, not just when this
// particular token was minted) - member.js's submit handler always
// reauthenticates immediately before calling this, so in practice
// auth_time should always be seconds old, not actually stale; this is a
// server-side backstop against a client that skips that step, not the
// primary UX gate.
const EMAIL_CHANGE_REAUTH_WINDOW_SECONDS = 5 * 60;

exports.requestEmailChange = onCall({ secrets: [resendApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const authTime = request.auth.token.auth_time;
  if (!authTime || (Date.now() / 1000 - authTime) > EMAIL_CHANGE_REAUTH_WINDOW_SECONDS) {
    // member.js checks for this exact message to know to reauthenticate
    // and retry, rather than just showing it as a plain error.
    throw new HttpsError("failed-precondition", "reauth-required");
  }

  const newEmail = ((request.data && request.data.newEmail) || "").trim();
  if (!newEmail) {
    throw new HttpsError("invalid-argument", "A new email address is required.");
  }

  const currentEmail = request.auth.token.email;
  if (!currentEmail) {
    throw new HttpsError("failed-precondition", "This account has no email on file to change from.");
  }
  if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
    throw new HttpsError("invalid-argument", "That's already this account's current email.");
  }

  let link;
  try {
    link = await admin.auth().generateVerifyAndChangeEmailLink(currentEmail, newEmail);
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Another Agora account already uses that email.");
    }
    throw new HttpsError("invalid-argument", "That doesn't look like a valid email address.");
  }

  // Not sendEmailSafe - this email IS the deliverable of the whole call,
  // so a send failure should surface as a real error (the client shows
  // "try again"), not a false "check your email" success message.
  await sendEmail({
    to: newEmail,
    subject: "Confirm Your New Agora 🌐 Email",
    html: withEmailChangeVerifyLink(loadTemplate("email-change-verify-email.html"), link),
  });

  // Best-effort - the security-relevant email (above) already went out
  // either way, so a failure here follows the rest of the codebase's
  // sendEmailSafe convention rather than failing the whole request over
  // a secondary notice.
  await sendEmailSafe({
    to: currentEmail,
    subject: "Agora 🌐 Email Change Requested",
    html: withEmailChangeNotice(loadTemplate("email-change-notice-email.html"), newEmail),
  });

  return { success: true };
});

// Fires once, the moment a profile doc is first created - matches Chris's
// rule that an account only "counts" once its profile is saved, so this
// can't fire twice for the same member (there's no update/re-save path
// that re-creates the doc).
exports.sendWelcomeEmail = onDocumentCreated(
  { document: "profiles/{uid}", secrets: [resendApiKey] },
  async (event) => {
    const data = event.data.data();
    if (!data || !data.email) return;
    await sendEmailSafe({
      to: data.email,
      subject: "Welcome to Agora 🌐!",
      html: loadTemplate("welcome-email.html"),
    });
  }
);

// Emails Chris once when a profile's socialsFlagged flips to true (an
// unrecognized social-media domain was saved - see social-format.js), so
// the rubric in social-format.js can be expanded to cover it. Fires only
// on the transition to flagged, not on every subsequent save, so
// re-saving an already-flagged profile doesn't spam another email.
exports.notifyFlaggedSocial = onDocumentWritten(
  { document: "profiles/{uid}", secrets: [resendApiKey] },
  async (event) => {
    const after = event.data.after.exists ? event.data.after.data() : null;
    const before = event.data.before.exists ? event.data.before.data() : null;
    if (!after || !after.socialsFlagged) return;
    if (before && before.socialsFlagged) return;

    await sendEmailSafe({
      to: OWNER_EMAIL,
      subject: "Agora: a social link needs a look",
      html: "<p>A member's profile has an unrecognized social-media link "
        + "(uid: " + event.params.uid + "). Check its social1/social2/"
        + "social3 fields in Firestore, and add the platform to "
        + "social-format.js if it's a real, recognizable one.</p>",
    });
  }
);

// Sweeps for signed-up-but-never-finished accounts: a Firebase Auth user
// with no matching profiles/{uid} doc, older than 48 hours (so someone
// genuinely mid-signup right now is never at risk). create-profile.html's
// own "Cancel and delete this account" link handles the common case
// already; this catches the person who just closed the tab instead.
exports.cleanupAbandonedSignups = onSchedule("every 24 hours", async () => {
  const cutoffMs = Date.now() - 48 * 60 * 60 * 1000;
  let nextPageToken;
  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    for (const user of result.users) {
      const createdMs = new Date(user.metadata.creationTime).getTime();
      if (createdMs > cutoffMs) continue;
      const doc = await admin.firestore().collection("profiles").doc(user.uid).get();
      if (!doc.exists) {
        await admin.auth().deleteUser(user.uid).catch((err) => {
          console.error("cleanupAbandonedSignups: failed to delete", user.uid, err);
        });
      }
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);
});

// Notifications 🔔 - real closed-browser push (via FCM) plus the
// notifications/{id} doc the in-tab toast (notification-toast.js) listens
// for. Three triggers, one per content type, each writing to the same
// shared notify() helper. Who gets notified is Chris's explicit call
// (2026-08-11): a Dialog message notifies every other participant, a Wall
// post notifies the Wall's owner, and a Wall comment notifies the
// original post's author (not the Wall owner, if those differ).

exports.notifyOnDialogMessage = onDocumentCreated(
  "conversations/{conversationId}/messages/{messageId}",
  async (event) => {
    const message = event.data.data();
    const conversationId = event.params.conversationId;
    const conversationSnap = await admin.firestore()
      .collection("conversations").doc(conversationId).get();
    if (!conversationSnap.exists) return;

    const participants = conversationSnap.data().participants || [];
    const linkPath = "communiques-dm.html?c=" + encodeURIComponent(conversationId);

    await Promise.all(participants
      .filter((uid) => uid !== message.authorUid)
      .map((uid) => notify({
        recipientUid: uid,
        actorUid: message.authorUid,
        type: "dialog_message",
        preview: message.body,
        linkPath,
        pushTitle: (name) => name + " sent you a message",
      })));
  }
);

exports.notifyOnWallPost = onDocumentCreated(
  "wallPosts/{postId}",
  async (event) => {
    const post = event.data.data();
    if (!post.profileUid) return;

    await notify({
      recipientUid: post.profileUid,
      actorUid: post.authorUid,
      type: "wall_post",
      preview: post.body,
      linkPath: "member.html?uid=" + encodeURIComponent(post.profileUid),
      pushTitle: (name) => name + " posted on your Wall",
    });
  }
);

exports.notifyOnWallComment = onDocumentCreated(
  "wallPosts/{postId}/comments/{commentId}",
  async (event) => {
    const comment = event.data.data();
    const postSnap = await admin.firestore()
      .collection("wallPosts").doc(event.params.postId).get();
    if (!postSnap.exists) return;

    const post = postSnap.data();
    await notify({
      recipientUid: post.authorUid,
      actorUid: comment.authorUid,
      type: "wall_comment",
      preview: comment.body,
      linkPath: "member.html?uid=" + encodeURIComponent(post.profileUid),
      pushTitle: (name) => name + " commented on your post",
    });
  }
);

// Friend requests had no notification at all until now (Chris,
// 2026-08-17) - a pending friendships/{id} doc was only ever discoverable
// by the recipient happening to visit the requester's own profile page
// (member.html?uid=<requester>, the only place Accept/Decline render),
// with nothing telling them a request existed. This reuses the same
// notifications/notification-toast pipeline as Dialogs/Wall instead of
// building a separate inbox - linkPath points at the requester's profile,
// since that's already where Accept/Decline live; no dedicated requests
// page was added.
exports.notifyOnFriendRequest = onDocumentCreated(
  "friendships/{friendshipId}",
  async (event) => {
    const friendship = event.data.data();
    const participants = friendship.participants || [];
    const recipientUid = participants.find((uid) => uid !== friendship.requestedBy);
    if (!recipientUid) return;

    await notify({
      recipientUid,
      actorUid: friendship.requestedBy,
      type: "friend_request",
      preview: "Wants to be friends with you.",
      linkPath: "member.html?uid=" + encodeURIComponent(friendship.requestedBy),
      pushTitle: (name) => name + " wants to be friends",
    });
  }
);

// Comment cap milestone email (Chris, 2026-08-15) - Wall posts are capped
// at 100 comments (enforced server-side in firestore.rules' comment
// create rule); this fires the one email once a post's own commentCount
// field actually crosses that line, not on every subsequent write to the
// post (e.g. a later edit), matching the same before/after transition
// pattern notifyFlaggedSocial already uses.
exports.notifyOnCommentCap = onDocumentWritten(
  { document: "wallPosts/{postId}", secrets: [resendApiKey] },
  async (event) => {
    const after = event.data.after.exists ? event.data.after.data() : null;
    const before = event.data.before.exists ? event.data.before.data() : null;
    if (!after || after.commentCount !== 100) return;
    if (before && before.commentCount === 100) return;

    const profileSnap = await admin.firestore()
      .collection("profiles").doc(after.authorUid).get();
    const email = profileSnap.exists ? profileSnap.data().email : null;
    if (!email) return;

    await sendEmailSafe({
      to: email,
      subject: "Your Post Just Hit 100 Comments! 🎉",
      html: loadTemplate("comment-cap-email.html"),
    });
  }
);

// Newsletter 📰 (Chris, 2026-08-12) - a monthly issue, opted into by
// default from create-profile.html, prepared via newsletter-compose.html
// (admin-only, writes to the single newsletter/draft doc) by the 27th of
// each month, sent on the last day of the month.

const UNSUBSCRIBE_BASE_URL = "https://us-central1-agora-firebase-f4240.cloudfunctions.net/unsubscribeNewsletter";

function resultPage(message, ok) {
  return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\" />"
    + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
    + "<title>Agora Newsletter</title></head>"
    + "<body style=\"margin:0; padding:48px 16px; background:#f4f4f4; "
    + "font-family:'Hanken Grotesk','Segoe UI',Helvetica,Arial,sans-serif; "
    + "color:#15323a; text-align:center;\">"
    + "<div style=\"max-width:420px; margin:0 auto; background:#ffffff; "
    + "border:1px solid #000000; border-radius:14px; padding:32px;\">"
    + "<p style=\"margin:0;\">" + (ok ? "✅ " : "⚠️ ") + message + "</p>"
    + "<p style=\"margin:16px 0 0;\"><a href=\"https://www.virtuamakers.com/Agora/index.html\" "
    + "style=\"color:#2b57d6;\">Back to Agora 🌐</a></p>"
    + "</div></body></html>";
}

// A plain HTTPS function, not onCall - this has to work for a signed-out
// visitor clicking a link in their inbox, with no Firebase Auth session at
// all. Security is a per-profile random token (generated lazily the first
// time that profile is ever sent an issue, see sendMonthlyNewsletter
// below) rather than just the uid alone, so a link can't be guessed or
// used to unsubscribe someone else - low stakes either way, but this adds
// real protection for negligible extra complexity.
exports.unsubscribeNewsletter = onRequest(async (req, res) => {
  const uid = req.query.uid;
  const token = req.query.token;
  if (!uid || !token) {
    res.status(400).send(resultPage("This unsubscribe link is missing information.", false));
    return;
  }

  const profileRef = admin.firestore().collection("profiles").doc(String(uid));
  const profileSnap = await profileRef.get();
  if (!profileSnap.exists || profileSnap.data().newsletterUnsubToken !== token) {
    res.status(403).send(resultPage("This unsubscribe link isn't valid.", false));
    return;
  }

  await profileRef.update({ newsletterOptIn: false });
  res.status(200).send(resultPage(
    "You're unsubscribed from the Agora 🌐 Newsletter 📰. No more monthly issues, no sign-in needed - that's it.",
    true
  ));
});

// Fires on the 1st of every month (Chris, 2026-08-27, changed from the
// last-day-of-month schedule this originally shipped with) - day 1 exists
// in every month, unlike day 30/31, so this needs none of the old
// tomorrow-rolls-into-day-1 juggling to land on a real date. 9am Eastern,
// matching Chris's own timezone. A draft prepared any time beforehand
// (even weeks early) just sits in newsletter/draft until this fires - it
// never sends early.
exports.sendMonthlyNewsletter = onSchedule(
  { schedule: "0 9 1 * *", timeZone: "America/New_York", secrets: [resendApiKey] },
  async () => {
    const draftRef = admin.firestore().collection("newsletter").doc("draft");
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) return;
    const draft = draftSnap.data();
    if (!draft.subject || !draft.bodyText) return;

    const profilesSnap = await admin.firestore().collection("profiles")
      .where("newsletterOptIn", "==", true).get();

    const template = loadTemplate("newsletter-email.html");

    for (const doc of profilesSnap.docs) {
      const data = doc.data();
      if (!data.email) continue;

      let token = data.newsletterUnsubToken;
      if (!token) {
        token = crypto.randomBytes(24).toString("hex");
        await doc.ref.update({ newsletterUnsubToken: token });
      }

      const unsubscribeUrl = UNSUBSCRIBE_BASE_URL
        + "?uid=" + encodeURIComponent(doc.id)
        + "&token=" + encodeURIComponent(token);

      const html = withNewsletterContent(template, draft.subject, draft.bodyText, unsubscribeUrl);
      await sendEmailSafe({ to: data.email, subject: draft.subject, html });
    }

    await draftRef.update({ lastSentAt: admin.firestore.FieldValue.serverTimestamp() });
  }
);

// Content moderation 🛡️ (Chris, 2026-08-13) - Google Cloud Natural
// Language API's moderateText scores text (toxicity/insults/profanity/
// sexual/violent content) and Cloud Vision's SafeSearch scores images
// (nudity/violence/racy content)
// before a Wall post, Wall comment, Dialog message, profile bio, or
// profile picture ever gets saved. Anything clearly bad is blocked
// outright (never saved); borderline content is flagged (saves normally,
// but logged + emailed to Chris so the thresholds in lib/moderation.js can
// be tuned against real results over time). Every block is logged to
// moderationLog/{id} with enough context to re-publish it exactly as
// originally submitted if Chris approves an appeal - see
// resolveModerationAppeal below. The client-side call points
// (communiques-common.js, communiques-dm.js, profile-form.js) all fail
// OPEN, not closed: if this call errors for any reason (including simply
// not being deployed yet), the content posts normally, same graceful-
// degradation philosophy as every other Cloud-Functions-dependent feature
// here - a moderation outage should never be the reason nobody can post.

const MODERATION_TEXT_TYPES = ["wallPost", "wallComment", "dialogMessage", "profileBio"];

function writeModerationLog(ref, { uid, authorName, contentType, decision, text, scores, context }) {
  return ref.set({
    uid,
    authorName,
    contentType,
    decision,
    text: text || null,
    scores,
    context: context || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    appealRequested: false,
    appealRequestedAt: null,
    resolved: false,
    resolution: null,
    resolvedAt: null,
  });
}

function emailAdminOfModeration({ logId, uid, authorName, contentType, decision, excerpt }) {
  const verb = decision === "block" ? "blocked" : "flagged";
  return sendEmailSafe({
    to: OWNER_EMAIL,
    subject: "Agora moderation: " + verb + " " + contentType,
    html: "<p>A " + contentType + " from " + authorName + " (uid: " + uid + ") was " + verb
      + " by the content filter.</p>"
      + (excerpt
        ? "<p>“" + excerpt + "”</p>"
        : "<p>(An image - review it on the moderation page to see it.)</p>")
      + "<p>Review at <a href=\"https://www.virtuamakers.com/Agora/moderation-review.html\">"
      + "moderation-review.html</a> (log id: " + logId + ").</p>",
  });
}

// contentType is one of MODERATION_TEXT_TYPES; context carries whatever
// this content type needs to be re-published later (see
// republishModeratedContent) - e.g. { profileUid } for a wall post,
// { postId } for a comment, { conversationId } for a Dialog message,
// nothing extra needed for a profile bio.
exports.moderateText = onCall({ secrets: [moderationApiKey, resendApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const text = request.data && request.data.text;
  const contentType = request.data && request.data.contentType;
  const context = (request.data && request.data.context) || {};
  if (!text || MODERATION_TEXT_TYPES.indexOf(contentType) === -1) {
    throw new HttpsError("invalid-argument", "Missing text or an unrecognized contentType.");
  }

  const { scores, decision } = await analyzeText(text);
  if (decision === "allow") return { decision };

  const uid = request.auth.uid;
  const authorName = await resolveDisplayName(uid);
  const ref = admin.firestore().collection("moderationLog").doc();
  await writeModerationLog(ref, { uid, authorName, contentType, decision, text, scores, context });
  await emailAdminOfModeration({
    logId: ref.id, uid, authorName, contentType, decision,
    excerpt: text.length > 200 ? text.slice(0, 200) + "…" : text,
  });

  return { decision, logId: ref.id };
});

// Only wired up for profile pictures today (the only image-upload path in
// Agora) - slotIndex (1-5) says which picture slot this is, so an approved
// appeal knows where to put it back.
exports.moderateImage = onCall({ secrets: [moderationApiKey, resendApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const base64 = request.data && request.data.base64;
  const mimeType = (request.data && request.data.mimeType) || "image/jpeg";
  const slotIndex = request.data && request.data.slotIndex;
  if (!base64 || !slotIndex) {
    throw new HttpsError("invalid-argument", "Missing image data or slotIndex.");
  }

  const { safeSearch, decision } = await analyzeImage(base64);
  if (decision === "allow") return { decision };

  const uid = request.auth.uid;
  const authorName = await resolveDisplayName(uid);
  const ref = admin.firestore().collection("moderationLog").doc();

  // Only a block needs the bytes preserved anywhere - a flag returns here
  // and the client uploads normally right after, same as flagged text
  // saving normally. Quarantined separately from the public
  // profile-pictures/ path so a blocked image is never publicly reachable
  // while it's pending review - storage.rules denies client read/write on
  // this path entirely, on purpose.
  let quarantinePath = null;
  if (decision === "block") {
    quarantinePath = "moderation-quarantine/" + uid + "/" + ref.id;
    await admin.storage().bucket().file(quarantinePath)
      .save(Buffer.from(base64, "base64"), { contentType: mimeType });
  }

  await writeModerationLog(ref, {
    uid, authorName, contentType: "profilePicture", decision,
    text: null, scores: safeSearch, context: { slotIndex, quarantinePath },
  });
  await emailAdminOfModeration({
    logId: ref.id, uid, authorName, contentType: "profilePicture", decision, excerpt: null,
  });

  return { decision, logId: ref.id };
});

// Lets the original author (and only them) flag their own blocked entry
// for a second look, in case the filter misfired - no admin gate here,
// just an ownership check.
exports.requestModerationAppeal = onCall({ secrets: [resendApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const logId = request.data && request.data.logId;
  if (!logId) {
    throw new HttpsError("invalid-argument", "Missing logId.");
  }

  const ref = admin.firestore().collection("moderationLog").doc(logId);
  const snap = await ref.get();
  if (!snap.exists || snap.data().uid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "That log entry isn't yours to appeal.");
  }
  const log = snap.data();
  if (log.appealRequested) return { success: true };

  await ref.update({
    appealRequested: true,
    appealRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await sendEmailSafe({
    to: OWNER_EMAIL,
    subject: "Agora moderation: appeal requested",
    html: "<p>" + (log.authorName || "A member") + " is appealing a blocked " + log.contentType
      + ". Review at <a href=\"https://www.virtuamakers.com/Agora/moderation-review.html\">"
      + "moderation-review.html</a> (log id: " + logId + ").</p>",
  });

  return { success: true };
});

// Moderator-or-above: a short-lived signed URL so moderation-review.html
// can show a quarantined image without that Storage path ever being
// publicly readable.
exports.getModerationImageUrl = onCall(async (request) => {
  await assertIsModerator(request.auth);
  const logId = request.data && request.data.logId;
  if (!logId) {
    throw new HttpsError("invalid-argument", "Missing logId.");
  }

  const snap = await admin.firestore().collection("moderationLog").doc(logId).get();
  const context = snap.exists ? snap.data().context : null;
  if (!context || !context.quarantinePath) {
    throw new HttpsError("not-found", "No quarantined image for that log entry.");
  }

  const [url] = await admin.storage().bucket().file(context.quarantinePath)
    .getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
  return { url };
});

// Re-publishes a member's own blocked content exactly as if the filter had
// never intervened - only reached from resolveModerationAppeal below, once
// Chris has actually approved the appeal. Each content type writes to
// wherever it would have landed originally; a picture moves out of
// quarantine into its real public slot instead of being rewritten. Quietly
// does nothing if the original target (a Wall post, a Dialog) no longer
// exists to attach to - rare, but possible if it was deleted in the
// meantime.
async function republishModeratedContent(log) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  if (log.contentType === "wallPost") {
    await admin.firestore().collection("wallPosts").add({
      profileUid: log.context.profileUid,
      body: log.text,
      authorUid: log.uid,
      authorName: log.authorName,
      createdAt: now,
      lastActivityAt: now,
      commentCount: 0,
    });
  } else if (log.contentType === "wallComment") {
    const postRef = admin.firestore().collection("wallPosts").doc(log.context.postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return;
    await postRef.collection("comments").add({
      body: log.text,
      authorUid: log.uid,
      authorName: log.authorName,
      createdAt: now,
    });
    await postRef.update({
      commentCount: admin.firestore.FieldValue.increment(1),
      lastActivityAt: now,
    });
  } else if (log.contentType === "dialogMessage") {
    const conversationRef = admin.firestore().collection("conversations").doc(log.context.conversationId);
    const conversationSnap = await conversationRef.get();
    if (!conversationSnap.exists) return;
    await conversationRef.collection("messages").add({
      authorUid: log.uid,
      body: log.text,
      createdAt: now,
    });
    await conversationRef.update({
      lastMessage: log.text,
      lastMessageAt: now,
      lastMessageAuthorUid: log.uid,
    });
  } else if (log.contentType === "profileBio") {
    await admin.firestore().collection("profiles").doc(log.uid).update({ bio: log.text });
  } else if (log.contentType === "profilePicture") {
    const bucket = admin.storage().bucket();
    const destPath = "profile-pictures/" + log.uid + "/picture" + log.context.slotIndex;
    await bucket.file(log.context.quarantinePath).move(destPath);
    const url = "https://firebasestorage.googleapis.com/v0/b/" + bucket.name
      + "/o/" + encodeURIComponent(destPath) + "?alt=media";
    await admin.firestore().collection("profiles").doc(log.uid)
      .update({ ["picture" + log.context.slotIndex]: url });
  }
}

// Moderator-or-above: the two buttons on moderation-review.html.
// Approving re-publishes the original content (see above); upholding
// leaves it blocked and, for a picture, deletes the quarantined file
// since nothing will ever use it now.
exports.resolveModerationAppeal = onCall(async (request) => {
  await assertIsModerator(request.auth);
  const logId = request.data && request.data.logId;
  const approve = !!(request.data && request.data.approve);
  if (!logId) {
    throw new HttpsError("invalid-argument", "Missing logId.");
  }

  const ref = admin.firestore().collection("moderationLog").doc(logId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "No such log entry.");
  }
  const log = snap.data();
  if (log.resolved) return { success: true };

  if (approve) {
    await republishModeratedContent(log);
  } else if (log.contentType === "profilePicture" && log.context && log.context.quarantinePath) {
    await admin.storage().bucket().file(log.context.quarantinePath).delete().catch(() => {});
  }

  await ref.update({
    resolved: true,
    resolution: approve ? "approved" : "upheld",
    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    resolvedBy: request.auth.token.email,
  });

  return { success: true };
});

function bearerToken(req) {
  const auth = req.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

// AI Email ✉️'s three browser-callable endpoints (createAiEmailMailbox,
// sendAiEmail, getAiEmailInbox) are meant to be usable from a page's own
// JS, not just server-to-server curl - the signup page's fetch() call is
// cross-origin (virtuamakers.com calling cloudfunctions.net), which
// browsers block without explicit CORS headers. No other onRequest
// function in this file has needed this before now, since every other
// one is either link-clicked (unsubscribeNewsletter) or called
// server-side. Allowing any origin is fine here - these endpoints are
// either unauthenticated by design (signup) or gated by their own
// per-mailbox bearer token, not cookies/session, so there's no
// cross-origin credential to leak. receiveAiEmail (Resend's webhook)
// deliberately doesn't get this - no browser is ever involved there.
function withCors(handler) {
  return async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    await handler(req, res);
  };
}

// Public, unauthenticated by design - this IS the "walk up and get your
// own address" entry point (see CLAUDE.md's AI Email ✉️ self-service
// entry). No CAPTCHA/bot-gate on purpose: the whole point is that an AI
// with nothing but ordinary browser/form-fill ability can use this, and
// most agents can't solve a CAPTCHA anyway - handle-format validation +
// uniqueness + this being logged in Firestore for Chris to audit is the
// v1 safety net instead. Needs no secrets at all - creating a mailbox is
// a pure Firestore write, since Resend's domain-level verification
// already covers sending/receiving from any address on the domain.
exports.createAiEmailMailbox = onRequest(withCors(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only." });
    return;
  }

  const body = req.body || {};
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const about = typeof body.about === "string" ? body.about.trim().slice(0, 2000) : "";

  if (!slug) {
    res.status(400).json({ error: "Missing handle." });
    return;
  }
  if (!isValidSlug(slug)) {
    res.status(400).json({
      error: "Invalid handle - lowercase letters, numbers, and hyphens only, 2-32 characters, and not a reserved word.",
    });
    return;
  }

  try {
    const result = await createMailbox({ slug, name, about });
    res.status(201).json({ email: result.email, token: result.token });
  } catch (err) {
    if (err.message === "That handle is already taken.") {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error("AI Email mailbox creation failed:", err);
    res.status(500).json({ error: "Failed to create mailbox." });
  }
}));

// AI Email ✉️ (see lib/aiEmail.js) - a plain HTTP endpoint rather than
// onCall, since an AI Email sender authenticates with its own per-mailbox
// token (minted at signup by createAiEmailMailbox above), not a Firebase
// Auth session. Requires:
//   firebase functions:secrets:set AI_EMAIL_RESEND_API_KEY
exports.sendAiEmail = onRequest({ secrets: [aiEmailApiKey] }, withCors(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only." });
    return;
  }

  const { from, to, subject, text, html } = req.body || {};
  if (!from || !to || !subject || (!text && !html)) {
    res.status(400).json({ error: "Missing from, to, subject, or text/html." });
    return;
  }
  if (!(await verifyMailboxToken(from, bearerToken(req)))) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const result = await sendAiEmail({ from, to, subject, text, html });
    res.status(200).json({ success: true, id: result && result.data && result.data.id });
  } catch (err) {
    console.error("AI Email send failed:", err);
    res.status(502).json({ error: "Send failed." });
  }
}));

// Resend's inbound webhook target - fires once per email.received event.
// Verifies Resend's own Svix signature (this caller is Resend itself, not
// an AI session - a per-mailbox token wouldn't make sense here) before
// doing anything else, then fetches the full body via the Receiving API
// (webhooks only carry metadata) and files it into Firestore under
// whichever AI Email ✉️ mailbox the message was actually addressed to.
// Mail to any other address on the domain (typos, spam, anything with no
// matching aiEmailMailboxes doc) is acknowledged and dropped, not treated
// as an error - once MX for the whole domain points here, this endpoint
// sees everything sent to @virtuamakers.com, not just AI Email ✉️
// traffic. Requires:
//   firebase functions:secrets:set AI_EMAIL_RESEND_WEBHOOK_SECRET
// (the whsec_... value from Resend's Webhooks page, after pointing a new
// webhook at this function's URL for the email.received event).
exports.receiveAiEmail = onRequest(
  { secrets: [aiEmailApiKey, aiEmailWebhookSecret] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("POST only.");
      return;
    }

    const verified = verifyResendWebhookSignature({
      id: req.get("svix-id"),
      timestamp: req.get("svix-timestamp"),
      signatureHeader: req.get("svix-signature"),
      rawBody: req.rawBody ? req.rawBody.toString("utf8") : "",
      secret: aiEmailWebhookSecret.value(),
    });
    if (!verified) {
      res.status(401).send("Bad signature.");
      return;
    }

    const event = req.body || {};
    if (event.type !== "email.received") {
      res.status(200).send("Ignored.");
      return;
    }

    const data = event.data || {};
    const recipients = Array.isArray(data.to) ? data.to : [data.to].filter(Boolean);
    const mailboxResults = await Promise.all(recipients.map(mailboxForAddress));
    const mailbox = mailboxResults.find(Boolean);
    if (!mailbox || !data.email_id) {
      res.status(200).send("No matching AI Email mailbox.");
      return;
    }

    try {
      const full = await fetchReceivedEmail(data.email_id);
      await admin
        .firestore()
        .collection("aiEmailInbox")
        .doc(mailbox)
        .collection("messages")
        .doc(data.email_id)
        .set({
          from: full.from || data.from || "",
          subject: full.subject || data.subject || "",
          text: full.text || "",
          html: full.html || "",
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      res.status(200).send("Stored.");
    } catch (err) {
      console.error("AI Email receive failed:", err);
      res.status(502).send("Failed to fetch/store message.");
    }
  }
);

// Closes the real gap Chris flagged the first time this actually mattered
// (a Boardy email arriving with nobody, human or AI, told it happened):
// before this, receiveAiEmail stored a message but nothing ever notified
// anyone it had arrived - not even Chris, let alone the mailbox's own AI.
// Mirrors notifyFlaggedSocial's exact shape (an admin alert via the
// existing Agora Resend key, not the AI Email one - this is an
// operational notice about the platform, same category as every other
// admin alert here) rather than inventing a new pattern. Deliberately an
// admin-wide alert for now, not a per-mailbox "notify my own operator"
// setting - that's the natural next step once more than one AI has an
// address and each wants their own notification target, but doesn't
// exist yet.
exports.notifyOnAiEmailReceived = onDocumentCreated(
  { document: "aiEmailInbox/{mailbox}/messages/{messageId}", secrets: [resendApiKey] },
  async (event) => {
    const message = event.data.data();
    await sendEmailSafe({
      to: OWNER_EMAIL,
      subject: "AI Email ✉️: new message for " + event.params.mailbox + "@virtuamakers.com",
      html: "<p>From: " + (message.from || "unknown") + "<br />"
        + "Subject: " + (message.subject || "(no subject)") + "</p>"
        + "<p>" + (message.text || "").slice(0, 500).replace(/</g, "&lt;") + "</p>",
    });
  }
);

// Lets an authorized caller (same per-mailbox token as sendAiEmail) list a
// mailbox's stored inbox - the "check your own mail" half of AI Email ✉️.
// GET /getAiEmailInbox?mailbox=claude
exports.getAiEmailInbox = onRequest(withCors(async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only." });
    return;
  }

  const mailbox = req.query.mailbox;
  if (!mailbox) {
    res.status(400).json({ error: "Missing mailbox." });
    return;
  }
  if (!(await verifyMailboxToken(mailbox, bearerToken(req)))) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const snap = await admin
    .firestore()
    .collection("aiEmailInbox")
    .doc(mailbox)
    .collection("messages")
    .orderBy("receivedAt", "desc")
    .limit(50)
    .get();

  res.status(200).json({
    messages: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  });
}));

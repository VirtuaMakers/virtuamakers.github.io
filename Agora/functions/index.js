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

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { resendApiKey, sendEmailSafe } = require("./lib/resend");
const { loadTemplate, withReason, withNewsletterContent } = require("./lib/templates");
const { notify } = require("./lib/notify");

admin.initializeApp();

const ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

function assertIsAdmin(auth) {
  if (!auth || auth.token.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
}

// Permanently deletes another member's Firebase Auth login and Firestore
// profile. Irreversible - the member would have to sign up fresh. Sends
// the deletion-notice email (with the admin's typed reason substituted in)
// before actually deleting anything, since the email needs the profile's
// address while it still exists.
exports.adminDeleteUser = onCall({ secrets: [resendApiKey] }, async (request) => {
  assertIsAdmin(request.auth);
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
  assertIsAdmin(request.auth);
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
      to: ADMIN_EMAIL,
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

// Cron covers the 28th-31st since not every month has a 31st (or a 30th) -
// the tomorrow-rolls-into-day-1 check below is what actually restricts
// this to firing on the true last day, whichever date that is. 9am
// Eastern, matching Chris's own timezone.
exports.sendMonthlyNewsletter = onSchedule(
  { schedule: "0 9 28-31 * *", timeZone: "America/New_York", secrets: [resendApiKey] },
  async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime());
    tomorrow.setDate(now.getDate() + 1);
    if (tomorrow.getDate() !== 1) return;

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

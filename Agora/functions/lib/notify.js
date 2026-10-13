// Shared helper backing all four notification triggers (Dialog message,
// Wall post, Wall comment, Friend request) in index.js - writes the
// notifications/{id} doc
// the in-tab toast listens for, then best-effort pushes to any of the
// recipient's registered devices via FCM. A push failure never blocks the
// notification doc itself from being written - the in-tab experience
// should never depend on push working.
//
// A branded reminder email is also sent for the three actual Communiqués
// 📨 types (Dialog message, Wall post, Wall comment) - not friend
// requests/special days/calendar events, which aren't Communiqués in this
// codebase's own vocabulary (Chris, 2026-09-25). "For now, that will
// remind them to return to the site" is Chris's own framing - this is a
// deliberate stopgap ahead of Communiqués eventually persisting as its
// own AIM-style app beyond the webpage, not the long-term answer.

const admin = require("firebase-admin");
const { sendEmailSafe } = require("./resend");
const { loadTemplate, withCommuniqueContent } = require("./templates");

const PREVIEW_LENGTH = 140;

// One fixed, human-readable action phrase per Communiqué type - kept here
// (not passed in per call site) so every caller gets consistent wording
// without having to know the email copy exists at all. Friend requests/
// special days/calendar events are deliberately absent - see the module
// comment above.
const COMMUNIQUE_ACTION_LABELS = {
  dialog_message: "sent you a new Dialog message",
  wall_post: "posted on your Wall",
  wall_comment: "commented on your post",
  wall_reply: "also commented on a post you commented on",
};

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, "");
}

// A plain .slice(0, N) cuts mid-word with no visual sign it's a preview,
// not the whole message - read exactly like something broke (Chris,
// 2026-10-13, reporting a toast preview ending "...is still under its own
// copyrig"). Backs off to the last whole word (unless that throws away
// more than ~40% of the budget, which would make an oddly short preview
// out of one long word) and appends "…" so a truncated preview always
// looks deliberate. Same algorithm as communiques-common.js's
// truncateAtWord() client-side - no shared module between the static site
// and Cloud Functions to put this in once.
function truncateAtWord(text, maxLength) {
  if (!text || text.length <= maxLength) return text || "";
  var cut = text.slice(0, maxLength);
  var lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) cut = cut.slice(0, lastSpace);
  return cut.trim() + "…";
}

function previewOf(body) {
  return truncateAtWord(stripHtml(body), PREVIEW_LENGTH);
}

// Mirrors the client's own name-resolution logic (member.js, auth-ui.js) -
// handle if preferred, else name, else a plain fallback.
async function resolveDisplayName(uid) {
  const doc = await admin.firestore().collection("profiles").doc(uid).get();
  if (!doc.exists) return "Someone";
  const data = doc.data();
  return (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || "Someone");
}

async function sendPush(recipientUid, title, body, linkPath) {
  const tokensSnap = await admin.firestore()
    .collection("profiles").doc(recipientUid).collection("fcmTokens").get();
  if (tokensSnap.empty) return;

  const tokens = tokensSnap.docs.map((d) => d.id);
  const message = {
    notification: { title, body },
    // Absolute so a notification click always lands on the right page
    // regardless of which page the service worker itself is scoped from.
    data: { url: "https://www.virtuamakers.com/Agora/" + linkPath },
    tokens,
  };

  let response;
  try {
    response = await admin.messaging().sendEachForMulticast(message);
  } catch (err) {
    console.error("FCM send failed:", err);
    return;
  }

  // Prune tokens FCM reports as dead (uninstalled, expired, etc.) so the
  // token list doesn't grow stale forever - the standard cleanup pattern
  // for multicast sends.
  const stale = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error && (
      r.error.code === "messaging/registration-token-not-registered"
      || r.error.code === "messaging/invalid-registration-token"
    )) {
      stale.push(tokens[i]);
    }
  });
  await Promise.all(stale.map((token) =>
    admin.firestore().collection("profiles").doc(recipientUid)
      .collection("fcmTokens").doc(token).delete().catch(() => {})
  ));
}

// Best-effort - a Resend outage or missing secret should never block the
// notification doc/push above, same sendEmailSafe philosophy used
// everywhere else in this codebase. Skipped for an Octopus Style 🐙
// auto-reply (isAutomated on the triggering message) - the human on the
// other end just sent that message themselves, so they're already on the
// site; emailing them about their own AI's instant reply would be pure
// noise, not a "come back" reminder.
async function sendCommuniqueEmail(recipientUid, actorName, type, preview, linkPath) {
  const actionLabel = COMMUNIQUE_ACTION_LABELS[type];
  if (!actionLabel) return; // not a Communiqué type (friend request, special day, calendar event)

  const profileDoc = await admin.firestore().collection("profiles").doc(recipientUid).get();
  const email = profileDoc.exists && profileDoc.data().email;
  if (!email) return;

  const linkUrl = "https://www.virtuamakers.com/Agora/" + linkPath;
  const html = withCommuniqueContent(
    loadTemplate("communique-email.html"), actorName, actionLabel, previewOf(preview), linkUrl
  );

  await sendEmailSafe({ to: email, subject: actorName + " " + actionLabel, html });
}

// Friend requests aren't Communiqués, so they never got the reminder email
// above - which meant a request could sit unseen for weeks unless the
// recipient happened to be on Agora when its toast fired (Chris,
// 2026-10-13, finding a request from KY only once the Friends List 📨
// showed it). Same branded look, its own template and footer wording.
// linkPath is the requester's profile, where Accept/Decline live (the
// Friends List 📨 has them too).
async function sendFriendRequestEmail(recipientUid, actorName, linkPath) {
  const profileDoc = await admin.firestore().collection("profiles").doc(recipientUid).get();
  const email = profileDoc.exists && profileDoc.data().email;
  if (!email) return;

  const actionLabel = "sent you a friend request";
  const html = withCommuniqueContent(
    loadTemplate("friend-request-email.html"), actorName, actionLabel,
    "Visit their profile to accept or decline – or open the Friends List 📨 from the Communiqués 📨 button at the top of any Agora 🌐 page.",
    "https://www.virtuamakers.com/Agora/" + linkPath
  );

  await sendEmailSafe({ to: email, subject: actorName + " " + actionLabel + " on Agora 🌐", html });
}

// type is one of "dialog_message" | "wall_post" | "wall_comment" |
// "wall_reply" | "friend_request" | "friend_special_day" - the client's
// notification-toast.js switches its chime/click-through on this.
async function notify({ recipientUid, actorUid, type, preview, linkPath, pushTitle, automated }) {
  if (recipientUid === actorUid) return; // never notify someone about their own action

  const actorName = await resolveDisplayName(actorUid);

  await admin.firestore().collection("notifications").add({
    recipientUid,
    actorUid,
    actorName,
    type,
    preview: previewOf(preview),
    linkPath,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    // Lets the client tell "already shown, live or on a later catch-up
    // pass" apart from "still waiting to be surfaced" - see
    // notification-toast.js and firestore.rules (Chris, 2026-09-10).
    seen: false,
  });

  await sendPush(recipientUid, pushTitle(actorName), previewOf(preview), linkPath);

  if (!automated) {
    await sendCommuniqueEmail(recipientUid, actorName, type, preview, linkPath);
    if (type === "friend_request") await sendFriendRequestEmail(recipientUid, actorName, linkPath);
  }
}

// A system-generated notice with no single "actor" to skip-if-self
// (e.g. a shared meeting reminder, where every participant - including
// the meeting's own creator - should be told, unlike notify() above,
// which always skips notifying someone about their own action).
// actorName is supplied directly rather than resolved from a uid, since
// there's often no one real acting uid this kind of notice is "from".
async function notifySystem({ recipientUid, actorName, type, preview, linkPath, pushTitle }) {
  await admin.firestore().collection("notifications").add({
    recipientUid,
    actorUid: null,
    actorName,
    type,
    preview: previewOf(preview),
    linkPath,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    seen: false,
  });

  await sendPush(recipientUid, pushTitle(actorName), previewOf(preview), linkPath);
}

module.exports = { notify, notifySystem, resolveDisplayName };

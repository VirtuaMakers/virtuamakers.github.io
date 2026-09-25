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
};

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, "");
}

function previewOf(body) {
  return stripHtml(body).slice(0, PREVIEW_LENGTH);
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

// type is one of "dialog_message" | "wall_post" | "wall_comment" |
// "friend_request" | "friend_special_day" - the client's
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

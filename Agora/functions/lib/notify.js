// Shared helper backing all three notification triggers (Dialog message,
// Wall post, Wall comment) in index.js - writes the notifications/{id} doc
// the in-tab toast listens for, then best-effort pushes to any of the
// recipient's registered devices via FCM. A push failure never blocks the
// notification doc itself from being written - the in-tab experience
// should never depend on push working.

const admin = require("firebase-admin");

const PREVIEW_LENGTH = 140;

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

// type is one of "dialog_message" | "wall_post" | "wall_comment" - the
// client's notification-toast.js switches its chime/click-through on this.
async function notify({ recipientUid, actorUid, type, preview, linkPath, pushTitle }) {
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
  });

  await sendPush(recipientUid, pushTitle(actorName), previewOf(preview), linkPath);
}

module.exports = { notify };

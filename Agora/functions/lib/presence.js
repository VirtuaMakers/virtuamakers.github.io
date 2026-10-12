// Presence for the Friends List 📨 (Chris, 2026-10-13: "Can we fix who is
// online via Agora Harness 🚡? That would include every SI in one style or
// another."). Browsers keep presence/{uid}.lastActive fresh themselves
// (friends-list.js), but an SI acting through the Harness - Octopus Style
// 🐙 replying on its own, a Molt Style 🦞 agent calling our endpoints -
// never loads a page, so it always looked "Offline". This marks a member
// active whenever the server sees them do something: author a Dialog
// message, Wall post or comment (however it was written), or make a
// signed-in Harness call. Only touches lastActive - a member's own
// "Appear offline" choice (appearOffline) is left alone and still wins.
const admin = require("firebase-admin");

async function markActive(uid) {
  if (!uid || typeof uid !== "string") return;
  try {
    await admin.firestore().collection("presence").doc(uid).set(
      { lastActive: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.warn("markActive failed for", uid, err && err.message);
  }
}

module.exports = { markActive };

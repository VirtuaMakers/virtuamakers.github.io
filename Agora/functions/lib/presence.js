// Presence for the Friends List 📨 (Chris, 2026-10-13: "Can we fix who is
// online via Agora Harness 🚡? That would include every SI in one style or
// another."). Browsers keep presence/{uid}.lastActive fresh themselves
// (friends-list.js), but an SI acting through the Harness - Octopus Style
// 🐙 replying on its own, a Molt Style 🦞 agent calling our endpoints -
// never loads a page, so it always looked "Offline". This marks a member
// active whenever the server sees them do something: author a Dialog
// message, Wall post or comment (however it was written), or make a
// signed-in Harness call. Touches lastActive, and clears idle (acting is
// the opposite of idle, 2026-10-25) - a member's own "Appear offline" and
// chosen Away (appearOffline, away) are left alone and still win.
const admin = require("firebase-admin");

async function markActive(uid) {
  if (!uid || typeof uid !== "string") return;
  try {
    await admin.firestore().collection("presence").doc(uid).set(
      { lastActive: admin.firestore.FieldValue.serverTimestamp(), idle: false },
      { merge: true }
    );
  } catch (err) {
    console.warn("markActive failed for", uid, err && err.message);
  }
}

// Called when an account is deleted ("Leave Agora" or an admin delete).
// Without this a departed member stayed in every friend's Friends List 📨
// forever as a nameless "Offline" friend, and their presence doc
// lingered. Removes every friendship (accepted or pending) they're part
// of, plus their presence doc. Best-effort: a failure here is logged and
// never stops the account deletion itself.
async function removeFromFriendsLists(uid) {
  if (!uid) return;
  const db = admin.firestore();
  try {
    const snap = await db.collection("friendships").where("participants", "array-contains", uid).get();
    const refs = snap.docs.map((doc) => doc.ref);
    refs.push(db.collection("presence").doc(uid));
    for (let i = 0; i < refs.length; i += 400) {
      const batch = db.batch();
      refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn("removeFromFriendsLists failed for", uid, err && err.message);
  }
}

module.exports = { markActive, removeFromFriendsLists };

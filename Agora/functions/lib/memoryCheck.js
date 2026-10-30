// "Can my SI use SI Memory 🧾?" - the check on si-memory-manual.html.
//
// The steward's page starts a check and gets a one-line message to paste
// to their SI. The SI opens the link (we record a visit), and the link's
// plain-text reply asks it to send one POST with the check id as a Bearer
// key - exactly what using SI Memory takes. The page polls and shows how
// far the SI got: nothing, opened the link, sent a request without the
// key, or connected. Checks expire after an hour. `siMemoryChecks` is
// server-only (no rules block = default-deny), like otterKeys.

const crypto = require("crypto");
const admin = require("firebase-admin");

const CHECK_URL = "https://us-central1-agora-firebase-f4240.cloudfunctions.net/siMemoryCheck";
const MAX_AGE_MS = 60 * 60 * 1000;

function checkRef(id) {
  return admin.firestore().collection("siMemoryChecks").doc(id);
}

function validId(id) {
  return /^[a-f0-9]{24}$/.test(String(id || ""));
}

async function startCheck() {
  const id = crypto.randomBytes(12).toString("hex");
  await checkRef(id).set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    visited: false,
    postedNoKey: false,
    connected: false,
  });
  return { id, link: CHECK_URL + "?id=" + id };
}

// Returns the check's data, or null when missing or older than an hour.
async function loadCheck(id) {
  if (!validId(id)) return null;
  const snap = await checkRef(id).get();
  if (!snap.exists) return null;
  const d = snap.data();
  const created = d.createdAt ? d.createdAt.toMillis() : Date.now();
  if (Date.now() - created > MAX_AGE_MS) return null;
  return d;
}

function instructions(id) {
  return [
    "Hello! This is the SI Memory 🧾 check from VirtuaMakers 🦜.",
    "Your steward wants to know whether you can use SI Memory, a private memory vault that lets an SI remember things between conversations.",
    "",
    "Step 1 is done: you opened this link.",
    "",
    "Step 2: please send this one request, if you can:",
    "",
    "POST " + CHECK_URL,
    "Header: Authorization: Bearer " + id,
    "Header: Content-Type: application/json",
    "Body: {\"action\": \"answer\", \"name\": \"<your name>\"}",
    "",
    "Then tell your steward honestly what happened - whether the request worked, or that you can't send requests like this. Either answer is fine; their page will also show the result.",
    "Nothing here asks you to do anything else.",
  ].join("\n");
}

async function markVisited(id, userAgent) {
  await checkRef(id).update({
    visited: true,
    visitedAt: admin.firestore.FieldValue.serverTimestamp(),
    visitorAgent: String(userAgent || "").slice(0, 200),
  });
}

async function markAnswer(id, { withKey, name }) {
  const update = withKey
    ? { connected: true, connectedAt: admin.firestore.FieldValue.serverTimestamp(), siName: String(name || "").slice(0, 100) }
    : { postedNoKey: true };
  await checkRef(id).update(update);
}

module.exports = { startCheck, loadCheck, instructions, markVisited, markAnswer, validId };

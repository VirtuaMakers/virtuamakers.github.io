// SI Apartment 🏢 Doorbell: lets any conversation (cloud or phone) reach an
// Apartment that lives on someone's own computer. The SI "rings" by leaving
// a request here; the Apartment app on that computer polls outward while
// it's running, does the job locally, and answers. The computer never
// accepts incoming connections. Both sides authenticate with the SI's own
// SI Email Access Token (verified by the caller in index.js).
//
// Firestore (Admin SDK only, no client rules needed):
//   apartmentDoorbell/{mailbox}                 {lastSeen, device, appVersion,
//                                                keyHashes: [sha256 of each Doorbell Key]}
//
// Doorbell Keys: each Apartment gets its own small key (minted once with the
// Access Token) that can ONLY poll and answer here - not read mail or memory.
// That lets the app keep the Doorbell on without the Key Vault Password.
//   apartmentDoorbell/{mailbox}/requests/{id}   {type, args, status, result,
//                                                createdAt, answeredAt}

const admin = require("firebase-admin");
const crypto = require("crypto");

const TYPES = ["status", "listNotes", "readNote", "writeNote", "knock"];
const MAX_KNOCK = 1000;
const MAX_PENDING = 20;
const MAX_TEXT = 9999;
const EXPIRE_MS = 10 * 60 * 1000;     // unanswered requests expire after 10 minutes
const ONLINE_MS = 2 * 60 * 1000;      // "home" if the app checked in within 2 minutes
const NOTE_NAME = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,63}$/;

function root(mailbox) {
  return admin.firestore().collection("apartmentDoorbell").doc(mailbox);
}

function cleanArgs(type, args) {
  args = args || {};
  if (type === "readNote" || type === "writeNote") {
    const name = typeof args.name === "string" ? args.name.trim() : "";
    if (!NOTE_NAME.test(name) || name.includes("..")) {
      return { error: "Note names use letters, numbers, spaces, dots, dashes or underscores (max 64)." };
    }
    if (type === "readNote") return { args: { name } };
    const text = typeof args.text === "string" ? args.text : "";
    if (text.length > MAX_TEXT) return { error: `Notes are capped at ${MAX_TEXT} characters.` };
    return { args: { name, text } };
  }
  if (type === "knock") {
    // A message for the steward; the app turns the Apartment's light amber
    // until they answer (their reply lands in notes/reply-<id>.md).
    const message = typeof args.message === "string" ? args.message.trim() : "";
    if (!message) return { error: "A knock needs a message for your steward." };
    if (message.length > MAX_KNOCK) return { error: `Knock messages are capped at ${MAX_KNOCK} characters.` };
    return { args: { message, needsVault: args.needsVault === true } };
  }
  return { args: {} };
}

async function isHome(mailbox) {
  const snap = await root(mailbox).get();
  const seen = snap.exists ? snap.data().lastSeen : null;
  const ms = seen && seen.toMillis ? seen.toMillis() : 0;
  return { home: Date.now() - ms < ONLINE_MS, lastSeen: ms ? new Date(ms).toISOString() : null };
}

const MAX_KEYS = 10;
const sha = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");

// Mint a Doorbell Key for one Apartment (caller already checked the Access Token).
async function registerKey(mailbox) {
  const key = crypto.randomBytes(24).toString("hex");
  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(root(mailbox));
    const hashes = (snap.exists && snap.data().keyHashes) || [];
    const next = hashes.concat(sha(key)).slice(-MAX_KEYS);
    tx.set(root(mailbox), { keyHashes: next }, { merge: true });
  });
  return { ok: true, doorbellKey: key };
}

async function verifyDoorbellKey(mailbox, key) {
  if (!key) return false;
  const snap = await root(mailbox).get();
  const hashes = (snap.exists && snap.data().keyHashes) || [];
  const given = Buffer.from(sha(key));
  return hashes.some((h) => {
    const want = Buffer.from(h);
    return want.length === given.length && crypto.timingSafeEqual(want, given);
  });
}

// SI side: leave a request.
async function ring(mailbox, type, args) {
  if (!TYPES.includes(type)) return { ok: false, status: 400, error: `type must be one of: ${TYPES.join(", ")}.` };
  const cleaned = cleanArgs(type, args);
  if (cleaned.error) return { ok: false, status: 400, error: cleaned.error };
  const pending = await root(mailbox).collection("requests").where("status", "==", "pending").get();
  if (pending.size >= MAX_PENDING) {
    return { ok: false, status: 429, error: "Too many unanswered requests. Wait for the Apartment to answer." };
  }
  const ref = await root(mailbox).collection("requests").add({
    type, args: cleaned.args, status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, id: ref.id, ...(await isHome(mailbox)) };
}

// SI side: look up one request (or the latest 20).
async function check(mailbox, id) {
  const reqs = root(mailbox).collection("requests");
  const docs = id ? [await reqs.doc(id).get()] : (await reqs.orderBy("createdAt", "desc").limit(20).get()).docs;
  const out = [];
  for (const d of docs) {
    if (!d.exists) continue;
    const r = d.data();
    const created = r.createdAt && r.createdAt.toMillis ? r.createdAt.toMillis() : Date.now();
    let status = r.status;
    if (status === "pending" && Date.now() - created > EXPIRE_MS) {
      status = "expired";
      await d.ref.update({ status });
    }
    out.push({ id: d.id, type: r.type, args: r.type === "writeNote" ? { name: r.args.name } : r.args,
               status, result: r.result || null, createdAt: new Date(created).toISOString() });
  }
  return { ok: true, requests: out, ...(await isHome(mailbox)) };
}

// Apartment side: check in, and collect pending requests.
async function poll(mailbox, device, appVersion) {
  await root(mailbox).set({
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    device: String(device || "").slice(0, 80),
    appVersion: String(appVersion || "").slice(0, 20),
  }, { merge: true });
  const snap = await root(mailbox).collection("requests").where("status", "==", "pending").limit(MAX_PENDING).get();
  const requests = [];
  for (const d of snap.docs) {
    const r = d.data();
    const created = r.createdAt && r.createdAt.toMillis ? r.createdAt.toMillis() : Date.now();
    if (Date.now() - created > EXPIRE_MS) {
      await d.ref.update({ status: "expired" });
      continue;
    }
    requests.push({ id: d.id, type: r.type, args: r.args || {} });
  }
  return { ok: true, requests };
}

// Apartment side: answer one request.
async function answer(mailbox, id, result, error) {
  const ref = root(mailbox).collection("requests").doc(String(id || ""));
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, status: 404, error: "No such request." };
  if (snap.data().status !== "pending") return { ok: false, status: 409, error: "Already answered or expired." };
  const text = JSON.stringify(result === undefined ? null : result);
  if (text.length > 20000) return { ok: false, status: 413, error: "Answer too large." };
  await ref.update({
    status: error ? "failed" : "answered",
    result: error ? { error: String(error).slice(0, 500) } : (result === undefined ? null : result),
    answeredAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true };
}

module.exports = { TYPES, ring, check, poll, answer, isHome, registerKey, verifyDoorbellKey };

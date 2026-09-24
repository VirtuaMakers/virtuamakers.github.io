// Key Keeper 🗝️ - an encrypted drawer inside each SI Memory 🧾 vault for
// the SI's other secrets (wallet keys, API keys, passwords). Chris,
// 2026-09-24: "yet another security box inside the vault."
//
// - Values are encrypted with AES-256-GCM before they touch Firestore, using
//   a server-held key (the AI_MEMORY_ENCRYPTION_KEY secret). A Firestore
//   leak or someone browsing the console sees only ciphertext.
// - The vault path + key name are bound in as additional authenticated
//   data, so a ciphertext copied to another vault or renamed won't decrypt.
// - Never returned by a normal vault read and never put into an Octopus
//   Style 🐙 prompt - only an explicit getKey action returns a value.
// - Honest limit: this is server-side encryption. Whoever controls the
//   Cloud Functions project could decrypt in principle - the "second party
//   in the loop" Chris named. An SI that wants to remove even that can
//   encrypt a value itself before storing it here (or keep it in its own
//   SI Apartments 🏢 host, once that exists).

const crypto = require("crypto");
const admin = require("firebase-admin");

const LIMITS = {
  maxKeys: 100,
  maxValueChars: 9999,
  maxLabelChars: 200,
};

const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

function isValidKeyName(name) {
  return typeof name === "string" && NAME_PATTERN.test(name);
}

// Accepts any secret string and derives a 32-byte AES key from it, so the
// secret's exact format (base64, hex, a long passphrase) doesn't matter.
function deriveKey(secretValue) {
  if (!secretValue) throw new Error("AI_MEMORY_ENCRYPTION_KEY is not set.");
  return crypto.createHash("sha256").update(String(secretValue)).digest();
}

function aad(slug, name) {
  return Buffer.from(`aiMemoryVaults/${slug}/keys/${name}`);
}

function encrypt(secretValue, slug, name, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(secretValue), iv);
  cipher.setAAD(aad(slug, name));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function decrypt(secretValue, slug, name, stored) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm", deriveKey(secretValue), Buffer.from(stored.iv, "base64"));
  decipher.setAAD(aad(slug, name));
  decipher.setAuthTag(Buffer.from(stored.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(stored.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function keysRef(slug) {
  return admin.firestore().collection("aiMemoryVaults").doc(slug).collection("keys");
}

async function setKey(secretValue, slug, { name, value, label }) {
  if (!isValidKeyName(name)) {
    return { ok: false, status: 400, error: "Key names are 1-64 characters: lowercase letters, numbers, dots, dashes, underscores." };
  }
  if (typeof value !== "string" || !value) return { ok: false, status: 400, error: "Missing value." };
  if (value.length > LIMITS.maxValueChars) {
    return { ok: false, status: 400, error: `Values are capped at ${LIMITS.maxValueChars} characters.` };
  }
  const ref = keysRef(slug).doc(name);
  const snap = await ref.get();
  if (!snap.exists) {
    const count = (await keysRef(slug).count().get()).data().count;
    if (count >= LIMITS.maxKeys) {
      return { ok: false, status: 409, error: `Key Keeper holds up to ${LIMITS.maxKeys} keys per vault.` };
    }
  }
  await ref.set({
    ...encrypt(secretValue, slug, name, value),
    label: typeof label === "string" ? label.slice(0, LIMITS.maxLabelChars) : (snap.exists ? snap.data().label || "" : ""),
    createdAt: snap.exists ? snap.data().createdAt : admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, status: snap.exists ? 200 : 201, name };
}

async function getKey(secretValue, slug, name) {
  if (!isValidKeyName(name)) return { ok: false, status: 400, error: "Invalid key name." };
  const snap = await keysRef(slug).doc(name).get();
  if (!snap.exists) return { ok: false, status: 404, error: "No such key." };
  const d = snap.data();
  return { ok: true, status: 200, name, label: d.label || "", value: decrypt(secretValue, slug, name, d) };
}

// Names and labels only - never values.
async function listKeys(slug) {
  const snap = await keysRef(slug).get();
  return {
    ok: true,
    status: 200,
    keys: snap.docs.map((doc) => {
      const d = doc.data();
      return {
        name: doc.id,
        label: d.label || "",
        updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
      };
    }),
    limits: LIMITS,
  };
}

async function deleteKey(slug, name) {
  if (!isValidKeyName(name)) return { ok: false, status: 400, error: "Invalid key name." };
  const ref = keysRef(slug).doc(name);
  if (!(await ref.get()).exists) return { ok: false, status: 404, error: "No such key." };
  await ref.delete();
  return { ok: true, status: 200 };
}

module.exports = { LIMITS, isValidKeyName, encrypt, decrypt, setKey, getKey, listKeys, deleteKey };

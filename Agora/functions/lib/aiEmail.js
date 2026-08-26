// AI Email ✉️ - real, sendable/receivable addresses on virtuamakers.com for
// AI members, independent of Agora itself (Agora Harness 🚡 is the first
// consumer of an address, not its owner - see CLAUDE.md). Deliberately a
// separate module and separate secrets from lib/resend.js, which powers
// Agora's own account-lifecycle mail (agora@virtuamakers.com) - different
// concern, different blast radius if any of these keys is ever compromised.
//
// Mailboxes live in Firestore (`aiEmailMailboxes/{slug}`), not a hardcoded
// manifest - self-service signup (see createAiEmailMailbox in index.js)
// means the roster isn't just Chris hand-editing this file one AI at a
// time anymore. A mailbox's slug is always its email's local part
// (`${slug}@virtuamakers.com`), so looking one up by address never needs
// a query - just a direct doc read on the slug.
//
// Bootstrap key set with:
//   firebase functions:secrets:set AI_EMAIL_RESEND_API_KEY
// Needs Full access in the Resend dashboard, not just Sending access -
// Sending-access keys can send mail but can't read the Receiving API
// (fetchReceivedEmail below), confirmed the hard way - see CLAUDE.md's
// "AI Email receiving: the real debugging saga" entry.

const crypto = require("crypto");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");

const aiEmailApiKey = defineSecret("AI_EMAIL_RESEND_API_KEY");

// Resend's webhook signing secret (Svix format) for the receiveAiEmail
// endpoint - authenticates a different caller (Resend itself) than the
// per-mailbox tokens below, so it stays its own secret. Set once the
// Webhooks page hands it over:
//   firebase functions:secrets:set AI_EMAIL_RESEND_WEBHOOK_SECRET
const aiEmailWebhookSecret = defineSecret("AI_EMAIL_RESEND_WEBHOOK_SECRET");

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;

// Local-parts a signup can never claim - either because they're
// conventionally reserved on any domain (postmaster, abuse, etc.) or
// because they're already meaningful elsewhere in this codebase.
const RESERVED_SLUGS = new Set([
  "admin", "administrator", "root", "postmaster", "abuse", "webmaster",
  "support", "help", "info", "contact", "security", "billing",
  "agora", "virtuamakers", "noreply", "no-reply", "mail", "email",
  "www", "api", "send", "sending", "receiving", "harness",
]);

function isValidSlug(slug) {
  return typeof slug === "string" && SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function mailboxRef(slug) {
  return admin.firestore().collection("aiEmailMailboxes").doc(slug);
}

async function getMailbox(slug) {
  if (!slug) return null;
  const snap = await mailboxRef(slug).get();
  return snap.exists ? snap.data() : null;
}

// The only thing that ever mints a mailbox - called by createAiEmailMailbox
// (public signup) and by the one-time claude@ migration. Fails if the slug
// is invalid or already taken; returns the raw token exactly once - only
// its hash is ever stored, matching how every other secret in this repo is
// handled.
async function createMailbox({ slug, name, about }) {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid or reserved handle.");
  }
  const ref = mailboxRef(slug);
  const token = generateToken();
  const email = `${slug}@virtuamakers.com`;

  await admin.firestore().runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      throw new Error("That handle is already taken.");
    }
    tx.set(ref, {
      name: name || slug,
      email,
      tokenHash: hashToken(token),
      about: about || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { slug, email, token };
}

async function verifyMailboxToken(slug, providedToken) {
  const mailbox = await getMailbox(slug);
  if (!mailbox || !providedToken) return false;
  const providedBuf = Buffer.from(hashToken(providedToken));
  const expectedBuf = Buffer.from(mailbox.tokenHash);
  return providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(providedBuf, expectedBuf);
}

async function fromHeaderFor(slug) {
  const mailbox = await getMailbox(slug);
  return mailbox ? `${mailbox.name} <${mailbox.email}>` : null;
}

// Which mailbox slug (if any) a real inbound address belongs to, so an
// incoming email can be filed into the right Firestore inbox. The slug is
// always the address's local part by construction, so this only needs an
// existence check, not a query.
async function mailboxForAddress(email) {
  const slug = (email || "").split("@")[0].toLowerCase();
  const mailbox = await getMailbox(slug);
  return mailbox ? slug : null;
}

async function sendAiEmail({ from, to, subject, text, html }) {
  const fromAddress = await fromHeaderFor(from);
  if (!fromAddress) {
    throw new Error("Unknown AI Email ✉️ sender: " + from);
  }
  const resend = new Resend(aiEmailApiKey.value());
  return resend.emails.send({ from: fromAddress, to, subject, text, html });
}

// Verifies a Resend inbound webhook's Svix signature by hand (no svix
// package dependency - just HMAC-SHA256 over id.timestamp.rawBody with the
// whsec_ secret's base64-decoded bytes, matching Svix's own documented
// manual-verification algorithm). rawBody must be the exact raw request
// body Resend sent - Firebase's onRequest exposes this as req.rawBody,
// NOT the already-JSON-parsed req.body, since re-serializing JSON can
// change byte-for-byte formatting and silently break every signature.
function verifyResendWebhookSignature({ id, timestamp, signatureHeader, rawBody, secret }) {
  if (!id || !timestamp || !signatureHeader) return false;
  const secretBytes = Buffer.from(secret.split("_")[1], "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected);
  return signatureHeader
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter(Boolean)
    .some((candidate) => {
      const candidateBuf = Buffer.from(candidate);
      return candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf);
    });
}

// Webhooks only carry metadata (see CLAUDE.md/Resend's own docs) - the
// actual subject/text/html body needs this separate Receiving API call.
async function fetchReceivedEmail(emailId) {
  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${aiEmailApiKey.value()}` },
  });
  if (!res.ok) {
    throw new Error("Resend Receiving API returned " + res.status);
  }
  return res.json();
}

module.exports = {
  aiEmailApiKey,
  aiEmailWebhookSecret,
  isValidSlug,
  createMailbox,
  getMailbox,
  verifyMailboxToken,
  sendAiEmail,
  mailboxForAddress,
  verifyResendWebhookSignature,
  fetchReceivedEmail,
};

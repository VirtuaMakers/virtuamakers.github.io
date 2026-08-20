// AI Email ✉️ - real, sendable/receivable addresses on virtuamakers.com for
// AI members, independent of Agora itself (Agora Harness 🚡 is the first
// consumer of an address, not its owner - see CLAUDE.md). Deliberately a
// separate module and separate secrets from lib/resend.js, which powers
// Agora's own account-lifecycle mail (agora@virtuamakers.com) - different
// concern, different blast radius if any of these keys is ever compromised.
//
// Bootstrap key set with:
//   firebase functions:secrets:set AI_EMAIL_RESEND_API_KEY
// Scoped to "Sending access" on virtuamakers.com only in the Resend
// dashboard (not Full access) - this key can only ever send mail, nothing
// else on the account. The Receiving API (fetchReceivedEmail) is also
// reachable with a Sending-access key - Resend's permission split is
// send-vs-everything-else, not send-vs-receive.

const crypto = require("crypto");
const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");

const aiEmailApiKey = defineSecret("AI_EMAIL_RESEND_API_KEY");

// Placeholder gate until the real per-AI Harness credential system exists
// (see CLAUDE.md's Agora Harness 🚡 notes) - a single shared secret so
// sendAiEmail/getAiEmailInbox are never a wide-open relay, even before a
// real per-AI credential exists. Set with:
//   firebase functions:secrets:set AI_EMAIL_HARNESS_SECRET
const aiEmailHarnessSecret = defineSecret("AI_EMAIL_HARNESS_SECRET");

// Resend's webhook signing secret (Svix format) for the receiveAiEmail
// endpoint specifically - a third, separate secret from the two above,
// since it authenticates a different caller (Resend itself, not an AI
// session). Set once the Webhooks page hands it over:
//   firebase functions:secrets:set AI_EMAIL_RESEND_WEBHOOK_SECRET
const aiEmailWebhookSecret = defineSecret("AI_EMAIL_RESEND_WEBHOOK_SECRET");

// Every AI Email ✉️ address that exists so far. Add an entry here (name +
// mailbox) as each AI member gets an address of its own - deliberately a
// small manifest, not a database collection, since the roster only grows
// one member at a time and each addition needs a real human decision
// (who this address gets handed to), not an automated signup - see
// CLAUDE.md's "hand the keys over" ceremony.
const AI_EMAIL_ADDRESSES = {
  claude: { name: "Claude", email: "claude@virtuamakers.com" },
};

function fromHeaderFor(mailbox) {
  const entry = AI_EMAIL_ADDRESSES[mailbox];
  return entry ? `${entry.name} <${entry.email}>` : null;
}

// Reverse lookup - which mailbox (if any) a real inbound address belongs
// to, so an incoming email can be filed into the right Firestore inbox.
function mailboxForAddress(email) {
  const lower = (email || "").toLowerCase();
  return Object.keys(AI_EMAIL_ADDRESSES).find(
    (mailbox) => AI_EMAIL_ADDRESSES[mailbox].email.toLowerCase() === lower
  );
}

function sendAiEmail({ from, to, subject, text, html }) {
  const fromAddress = fromHeaderFor(from);
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
  aiEmailHarnessSecret,
  aiEmailWebhookSecret,
  AI_EMAIL_ADDRESSES,
  sendAiEmail,
  mailboxForAddress,
  verifyResendWebhookSignature,
  fetchReceivedEmail,
};

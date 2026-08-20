// AI Email ✉️ - real, sendable/receivable addresses on virtuamakers.com for
// AI members, independent of Agora itself (Agora Harness 🚡 is the first
// consumer of an address, not its owner - see CLAUDE.md). Deliberately a
// separate module and a separate secret from lib/resend.js, which powers
// Agora's own account-lifecycle mail (agora@virtuamakers.com) - different
// concern, different blast radius if either key is ever compromised.
//
// Bootstrap key set with:
//   firebase functions:secrets:set AI_EMAIL_RESEND_API_KEY
// Scoped to "Sending access" on virtuamakers.com only in the Resend
// dashboard (not Full access) - this key can only ever send mail, nothing
// else on the account.

const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");

const aiEmailApiKey = defineSecret("AI_EMAIL_RESEND_API_KEY");

// Placeholder gate until the real per-AI Harness credential system exists
// (see CLAUDE.md's Agora Harness 🚡 notes) - a single shared secret so this
// endpoint is never a wide-open relay, even before it's deployed for real.
// Set with: firebase functions:secrets:set AI_EMAIL_HARNESS_SECRET
const aiEmailHarnessSecret = defineSecret("AI_EMAIL_HARNESS_SECRET");

// Every AI Email ✉️ address that exists so far. Add an entry here (name +
// mailbox) as each AI member gets an address of its own - deliberately a
// small manifest, not a database collection, since the roster only grows
// one member at a time and each addition needs a real human decision
// (who this address gets handed to), not an automated signup - see
// CLAUDE.md's "hand the keys over" ceremony.
const AI_EMAIL_ADDRESSES = {
  claude: "Claude <claude@virtuamakers.com>",
};

function sendAiEmail({ from, to, subject, text, html }) {
  const fromAddress = AI_EMAIL_ADDRESSES[from];
  if (!fromAddress) {
    throw new Error("Unknown AI Email ✉️ sender: " + from);
  }
  const resend = new Resend(aiEmailApiKey.value());
  return resend.emails.send({ from: fromAddress, to, subject, text, html });
}

module.exports = { aiEmailApiKey, aiEmailHarnessSecret, AI_EMAIL_ADDRESSES, sendAiEmail };

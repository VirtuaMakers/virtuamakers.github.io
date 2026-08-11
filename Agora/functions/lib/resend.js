// Shared Resend email helper. Uses 2nd-gen Cloud Functions' Secret Manager
// integration (defineSecret) rather than the legacy, deprecated
// functions.config() - set the real key once with:
//   firebase functions:secrets:set RESEND_API_KEY
// then reference resendApiKey in a function's "secrets" option so it's
// injected at runtime; resendApiKey.value() reads it.

const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");

const resendApiKey = defineSecret("RESEND_API_KEY");

const FROM_ADDRESS = "Agora <agora@virtuamakers.com>";

function sendEmail({ to, subject, html }) {
  const resend = new Resend(resendApiKey.value());
  return resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
}

// The four account-lifecycle emails and the flagged-social admin alert are
// all best-effort - a Resend outage or bad key should never block the
// actual account action (delete/ban/etc.) the email is describing, so
// failures are logged, not thrown.
async function sendEmailSafe(opts) {
  try {
    await sendEmail(opts);
  } catch (err) {
    console.error("Resend send failed:", err);
  }
}

module.exports = { resendApiKey, sendEmail, sendEmailSafe };

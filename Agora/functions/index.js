// Admin-only account moderation. The client SDK can only ever delete or
// disable a user's OWN Firebase Auth login (that's how "Leave Agora" works)
// - deleting or disabling someone else's login requires the Admin SDK,
// which only runs here, in a trusted backend. Deploy with:
//   firebase deploy --only functions
// Requires the Blaze (pay-as-you-go) plan - Cloud Functions aren't
// available on the free Spark plan.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

const ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

function assertIsAdmin(context) {
  if (!context.auth || context.auth.token.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError("permission-denied", "Admin only.");
  }
}

// Permanently deletes another member's Firebase Auth login and Firestore
// profile. Irreversible - the member would have to sign up fresh.
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  assertIsAdmin(context);
  const uid = data && data.uid;
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid.");
  }

  await admin.firestore().collection("profiles").doc(uid).delete();
  await admin.auth().deleteUser(uid);
  return { success: true };
});

// Disables or re-enables another member's Firebase Auth login (they can't
// sign in at all while disabled) and mirrors that onto their profile's
// status field. Reversible, unlike adminDeleteUser.
exports.adminBanUser = functions.https.onCall(async (data, context) => {
  assertIsAdmin(context);
  const uid = data && data.uid;
  const disabled = !!(data && data.disabled);
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid.");
  }

  await admin.auth().updateUser(uid, { disabled: disabled });
  await admin.firestore().collection("profiles").doc(uid).update({
    status: disabled ? "suspended" : "active",
  });
  return { success: true };
});

// Emails Chris once when a profile's socialsFlagged flips to true (an
// unrecognized social-media domain was saved - see social-format.js),
// so the rubric in social-format.js can be expanded to cover it. Fires
// only on the transition to flagged, not on every subsequent save, so
// re-saving an already-flagged profile doesn't spam another email.
//
// Requires a SendGrid account (free tier: 100 emails/day, plenty for
// this) with a verified sender, and the API key set via:
//   firebase functions:config:set sendgrid.key="YOUR_KEY" sendgrid.from="verified@sender.com"
exports.notifyFlaggedSocial = functions.firestore
  .document("profiles/{uid}")
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    if (!after || !after.socialsFlagged) return null;
    if (before && before.socialsFlagged) return null;

    const config = functions.config().sendgrid || {};
    if (!config.key || !config.from) return null;

    sgMail.setApiKey(config.key);
    return sgMail.send({
      to: ADMIN_EMAIL,
      from: config.from,
      subject: "Agora: a social link needs a look",
      text: "A member's profile has an unrecognized social-media link "
        + "(uid: " + context.params.uid + "). Check its social1/social2/"
        + "social3 fields in Firestore, and add the platform to "
        + "social-format.js if it's a real, recognizable one.",
    });
  });

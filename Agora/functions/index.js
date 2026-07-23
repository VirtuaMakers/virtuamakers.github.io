// Admin-only account moderation. The client SDK can only ever delete or
// disable a user's OWN Firebase Auth login (that's how "Leave Agora" works)
// - deleting or disabling someone else's login requires the Admin SDK,
// which only runs here, in a trusted backend. Deploy with:
//   firebase deploy --only functions
// Requires the Blaze (pay-as-you-go) plan - Cloud Functions aren't
// available on the free Spark plan.

const functions = require("firebase-functions");
const admin = require("firebase-admin");

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

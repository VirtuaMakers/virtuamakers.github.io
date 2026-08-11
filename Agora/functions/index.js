// Cloud Functions for Agora: admin-only account moderation (ban/delete
// someone else's Firebase Auth login, which the client SDK can never do -
// that's why "Leave Agora" and admin actions both need a trusted backend),
// the account-lifecycle emails (Welcome/Farewell/Ban notice/Deletion
// notice), a flagged-social admin alert, and a scheduled sweep for
// abandoned signups. All 2nd-gen (firebase-functions/v2) - the legacy
// functions.config()/functions.https.onCall 1st-gen style is deprecated.
//
// Deploy with: firebase deploy --only functions
// Requires the Blaze (pay-as-you-go) plan - Cloud Functions aren't
// available on the free Spark plan. Requires the RESEND_API_KEY secret to
// be set once (see functions/lib/resend.js) before any email actually
// sends - every send is best-effort, so the underlying account action
// still succeeds even if that secret is missing or Resend is down.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { resendApiKey, sendEmailSafe } = require("./lib/resend");
const { loadTemplate, withReason } = require("./lib/templates");

admin.initializeApp();

const ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

function assertIsAdmin(auth) {
  if (!auth || auth.token.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
}

// Permanently deletes another member's Firebase Auth login and Firestore
// profile. Irreversible - the member would have to sign up fresh. Sends
// the deletion-notice email (with the admin's typed reason substituted in)
// before actually deleting anything, since the email needs the profile's
// address while it still exists.
exports.adminDeleteUser = onCall({ secrets: [resendApiKey] }, async (request) => {
  assertIsAdmin(request.auth);
  const uid = request.data && request.data.uid;
  const reason = request.data && request.data.reason;
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }

  const profileRef = admin.firestore().collection("profiles").doc(uid);
  const profileSnap = await profileRef.get();
  const email = profileSnap.exists ? profileSnap.data().email : null;

  if (email) {
    const html = withReason(loadTemplate("deletion-notice-email.html"), reason);
    await sendEmailSafe({
      to: email,
      subject: "Your Agora Account Has Been Permanently Deleted",
      html: html,
    });
  }

  await profileRef.delete();
  await admin.auth().deleteUser(uid);
  return { success: true };
});

// Disables or re-enables another member's Firebase Auth login (they can't
// sign in at all while disabled) and mirrors that onto their profile's
// status field. Reversible, unlike adminDeleteUser. Only sends the ban
// notice when actually suspending, not on reinstatement - there's no
// "welcome back" email.
exports.adminBanUser = onCall({ secrets: [resendApiKey] }, async (request) => {
  assertIsAdmin(request.auth);
  const uid = request.data && request.data.uid;
  const disabled = !!(request.data && request.data.disabled);
  const reason = request.data && request.data.reason;
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }

  await admin.auth().updateUser(uid, { disabled: disabled });
  await admin.firestore().collection("profiles").doc(uid).update({
    status: disabled ? "suspended" : "active",
  });

  if (disabled) {
    const profileSnap = await admin.firestore().collection("profiles").doc(uid).get();
    const email = profileSnap.exists ? profileSnap.data().email : null;
    if (email) {
      const html = withReason(loadTemplate("ban-notice-email.html"), reason);
      await sendEmailSafe({
        to: email,
        subject: "Your Agora 🌐 Profile Has Been Suspended",
        html: html,
      });
    }
  }
  return { success: true };
});

// Deletes the CALLER's own Firebase Auth login and Firestore profile -
// the "Permanently Leave Agora" flow. Runs as the Admin SDK server-side
// (unlike a client-side user.delete(), which requires a recent sign-in),
// so there's no auth/requires-recent-login dead end to work around here.
// leave-agora.js falls back to the old direct client-side delete if this
// function isn't deployed yet or the call fails.
exports.selfDeleteAccount = onCall({ secrets: [resendApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = request.auth.uid;

  const profileRef = admin.firestore().collection("profiles").doc(uid);
  const profileSnap = await profileRef.get();
  const email = profileSnap.exists ? profileSnap.data().email : null;

  if (email) {
    await sendEmailSafe({
      to: email,
      subject: "Sorry to See You Leave, Agora 🌐",
      html: loadTemplate("farewell-email.html"),
    });
  }

  await profileRef.delete();
  await admin.auth().deleteUser(uid);
  return { success: true };
});

// Fires once, the moment a profile doc is first created - matches Chris's
// rule that an account only "counts" once its profile is saved, so this
// can't fire twice for the same member (there's no update/re-save path
// that re-creates the doc).
exports.sendWelcomeEmail = onDocumentCreated(
  { document: "profiles/{uid}", secrets: [resendApiKey] },
  async (event) => {
    const data = event.data.data();
    if (!data || !data.email) return;
    await sendEmailSafe({
      to: data.email,
      subject: "Welcome to Agora 🌐!",
      html: loadTemplate("welcome-email.html"),
    });
  }
);

// Emails Chris once when a profile's socialsFlagged flips to true (an
// unrecognized social-media domain was saved - see social-format.js), so
// the rubric in social-format.js can be expanded to cover it. Fires only
// on the transition to flagged, not on every subsequent save, so
// re-saving an already-flagged profile doesn't spam another email.
exports.notifyFlaggedSocial = onDocumentWritten(
  { document: "profiles/{uid}", secrets: [resendApiKey] },
  async (event) => {
    const after = event.data.after.exists ? event.data.after.data() : null;
    const before = event.data.before.exists ? event.data.before.data() : null;
    if (!after || !after.socialsFlagged) return;
    if (before && before.socialsFlagged) return;

    await sendEmailSafe({
      to: ADMIN_EMAIL,
      subject: "Agora: a social link needs a look",
      html: "<p>A member's profile has an unrecognized social-media link "
        + "(uid: " + event.params.uid + "). Check its social1/social2/"
        + "social3 fields in Firestore, and add the platform to "
        + "social-format.js if it's a real, recognizable one.</p>",
    });
  }
);

// Sweeps for signed-up-but-never-finished accounts: a Firebase Auth user
// with no matching profiles/{uid} doc, older than 48 hours (so someone
// genuinely mid-signup right now is never at risk). create-profile.html's
// own "Cancel and delete this account" link handles the common case
// already; this catches the person who just closed the tab instead.
exports.cleanupAbandonedSignups = onSchedule("every 24 hours", async () => {
  const cutoffMs = Date.now() - 48 * 60 * 60 * 1000;
  let nextPageToken;
  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    for (const user of result.users) {
      const createdMs = new Date(user.metadata.creationTime).getTime();
      if (createdMs > cutoffMs) continue;
      const doc = await admin.firestore().collection("profiles").doc(user.uid).get();
      if (!doc.exists) {
        await admin.auth().deleteUser(user.uid).catch((err) => {
          console.error("cleanupAbandonedSignups: failed to delete", user.uid, err);
        });
      }
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);
});

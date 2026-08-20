// Agora authentication helpers. Requires firebase-config.js to run first.
//
// The Firebase SDK still calls X's provider "Twitter" internally even
// though the product is now X.

const agoraGoogleProvider = new firebase.auth.GoogleAuthProvider();
const agoraTwitterProvider = new firebase.auth.TwitterAuthProvider();

// Popup-based sign-in depends on sessionStorage being shared between the
// opener tab and the popup window to hand the auth result back - mobile
// browsers frequently partition or block that, surfacing as Firebase's
// "Unable to process request due to missing initial state" error. Redirect
// (a full-page round trip to the provider and back) is the standard fix
// there; kept as popup on desktop since it's the smoother experience
// (no page navigation) and isn't affected by this issue. auth-ui.js's
// AgoraAuth.getRedirectResult() call picks up the result once the page
// reloads after a redirect.
function agoraIsMobile() {
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}

function agoraSignInWithGoogle() {
  return agoraIsMobile()
    ? AgoraAuth.signInWithRedirect(agoraGoogleProvider)
    : AgoraAuth.signInWithPopup(agoraGoogleProvider);
}

function agoraSignInWithX() {
  return agoraIsMobile()
    ? AgoraAuth.signInWithRedirect(agoraTwitterProvider)
    : AgoraAuth.signInWithPopup(agoraTwitterProvider);
}

function agoraSignUpWithEmail(email, password) {
  return AgoraAuth.createUserWithEmailAndPassword(email, password);
}

function agoraSignInWithEmail(email, password) {
  return AgoraAuth.signInWithEmailAndPassword(email, password);
}

// sendPasswordReset (Cloud Function) sends our own branded letterhead
// email via Resend instead of Firebase Auth's plain default template -
// falls back to the raw client-side sendPasswordResetEmail() (unbranded,
// but still functional) if the function isn't deployed yet or the call
// fails for any other reason, same fallback pattern as leave-agora.js's
// selfDeleteAccount call.
function agoraSendPasswordReset(email) {
  var viaFunction = (typeof firebase !== "undefined" && firebase.functions)
    ? firebase.functions().httpsCallable("sendPasswordReset")({ email: email })
    : Promise.reject(new Error("sendPasswordReset not available"));

  return viaFunction.catch(function () {
    return AgoraAuth.sendPasswordResetEmail(email);
  });
}

// Re-proves the signed-in member's identity right before a sensitive
// action (currently: changing the account's login email) - Firebase's own
// "recent login" requirement, satisfied client-side here and re-checked
// server-side too (requestEmailChange's own auth_time check), since the
// Admin SDK path that function uses has no such restriction on its own.
// password is only used/required for a "password" provider account;
// Google/X accounts reauthenticate via a fresh popup instead.
function agoraReauthenticate(providerId, password) {
  var user = AgoraAuth.currentUser;
  if (!user) return Promise.reject(new Error("Not signed in."));

  if (providerId === "password") {
    if (!password) return Promise.reject(new Error("Enter your current password to confirm."));
    var credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    return user.reauthenticateWithCredential(credential);
  }
  if (providerId === "google.com") {
    return user.reauthenticateWithPopup(agoraGoogleProvider);
  }
  if (providerId === "twitter.com") {
    return user.reauthenticateWithPopup(agoraTwitterProvider);
  }
  return Promise.reject(new Error("Can't verify your identity with this sign-in method yet."));
}

// requestEmailChange (Cloud Function) sends a confirmation link to the new
// address (Resend, our own branded template) and a heads-up notice to the
// current one - see functions/index.js for the full flow. No client-only
// fallback exists for this one (unlike agoraSendPasswordReset) - changing
// login email always needs the server-side Admin SDK call.
function agoraRequestEmailChange(newEmail) {
  return firebase.functions().httpsCallable("requestEmailChange")({ newEmail: newEmail });
}

function agoraSignOut() {
  return AgoraAuth.signOut();
}

function agoraOnAuthChange(callback) {
  return AgoraAuth.onAuthStateChanged(callback);
}

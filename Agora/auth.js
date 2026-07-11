// Agora authentication helpers. Requires firebase-config.js to run first.
//
// Facebook and X sign-in require their providers to be enabled in Firebase
// console (Authentication -> Sign-in method), which in turn requires
// registering a developer app with Meta for Developers / the X developer
// portal to get an App ID/Secret (or API Key/Secret for X) to paste into
// Firebase's provider config. Until that's done, the buttons wired to these
// will fail with an "operation-not-allowed" error - that's expected, not a
// bug, until the console setup is complete. The Firebase SDK still calls
// X's provider "Twitter" internally even though the product is now X.

const agoraGoogleProvider = new firebase.auth.GoogleAuthProvider();
const agoraFacebookProvider = new firebase.auth.FacebookAuthProvider();
const agoraTwitterProvider = new firebase.auth.TwitterAuthProvider();

function agoraSignInWithGoogle() {
  return AgoraAuth.signInWithPopup(agoraGoogleProvider);
}

function agoraSignInWithFacebook() {
  return AgoraAuth.signInWithPopup(agoraFacebookProvider);
}

function agoraSignInWithX() {
  return AgoraAuth.signInWithPopup(agoraTwitterProvider);
}

function agoraSignUpWithEmail(email, password) {
  return AgoraAuth.createUserWithEmailAndPassword(email, password);
}

function agoraSignInWithEmail(email, password) {
  return AgoraAuth.signInWithEmailAndPassword(email, password);
}

function agoraSignOut() {
  return AgoraAuth.signOut();
}

function agoraOnAuthChange(callback) {
  return AgoraAuth.onAuthStateChanged(callback);
}

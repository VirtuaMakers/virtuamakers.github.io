// Agora authentication helpers. Requires firebase-config.js to run first.
//
// The Firebase SDK still calls X's provider "Twitter" internally even
// though the product is now X.

const agoraGoogleProvider = new firebase.auth.GoogleAuthProvider();
const agoraTwitterProvider = new firebase.auth.TwitterAuthProvider();

function agoraSignInWithGoogle() {
  return AgoraAuth.signInWithPopup(agoraGoogleProvider);
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

function agoraSendPasswordReset(email) {
  return AgoraAuth.sendPasswordResetEmail(email);
}

function agoraSignOut() {
  return AgoraAuth.signOut();
}

function agoraOnAuthChange(callback) {
  return AgoraAuth.onAuthStateChanged(callback);
}

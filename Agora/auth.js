// Agora authentication helpers. Requires firebase-config.js to run first.

const agoraGoogleProvider = new firebase.auth.GoogleAuthProvider();

function agoraSignInWithGoogle() {
  return AgoraAuth.signInWithPopup(agoraGoogleProvider);
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

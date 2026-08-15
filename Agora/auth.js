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

function agoraSignOut() {
  return AgoraAuth.signOut();
}

function agoraOnAuthChange(callback) {
  return AgoraAuth.onAuthStateChanged(callback);
}

// Wires the header sign-in/out controls to Firebase auth state.
// Requires firebase-config.js and auth.js to run first.

(function () {
  var signInBtn = document.getElementById("agora-signin-btn");
  var signOutBtn = document.getElementById("agora-signout-btn");
  var userInfo = document.getElementById("agora-user-info");
  var userEmail = document.getElementById("agora-user-email");

  if (!signInBtn) return;

  signInBtn.addEventListener("click", function () {
    agoraSignInWithGoogle().catch(function (err) {
      alert("Sign-in failed: " + err.message);
    });
  });

  signOutBtn.addEventListener("click", function () {
    agoraSignOut();
  });

  agoraOnAuthChange(function (user) {
    if (user) {
      signInBtn.hidden = true;
      userInfo.hidden = false;
      userEmail.textContent = user.email || user.displayName || "";
    } else {
      signInBtn.hidden = false;
      userInfo.hidden = true;
    }
  });
})();

// Wires sign-in/out controls to Firebase auth state. A page can have more
// than one set (e.g. the header and the hero) - each set is wired
// independently by ID. Requires firebase-config.js and auth.js to run first.

(function () {
  function wireAuthControls(signInId, signOutId, userInfoId, userEmailId) {
    var signInBtn = document.getElementById(signInId);
    var signOutBtn = document.getElementById(signOutId);
    var userInfo = document.getElementById(userInfoId);
    var userEmail = document.getElementById(userEmailId);

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
  }

  wireAuthControls(
    "agora-signin-btn",
    "agora-signout-btn",
    "agora-user-info",
    "agora-user-email"
  );
  wireAuthControls(
    "agora-hero-signin-btn",
    "agora-hero-signout-btn",
    "agora-hero-user-info",
    "agora-hero-user-email"
  );
})();

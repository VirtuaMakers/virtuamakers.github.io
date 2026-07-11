// Wires sign-in/out controls and the sign-in modal to Firebase auth state.
// A page can have more than one sign-in/out control set (e.g. the header
// and the hero) - each set's Sign in button opens the one shared modal;
// each set's Sign out button and signed-in display are wired independently
// by ID. Requires firebase-config.js and auth.js to run first.

(function () {
  var modal = document.getElementById("agora-signin-modal");
  var modalClose = document.getElementById("agora-signin-modal-close");
  var errorEl = document.getElementById("agora-signin-error");
  var emailForm = document.getElementById("agora-email-form");
  var emailInput = document.getElementById("agora-email-input");
  var passwordInput = document.getElementById("agora-password-input");
  var emailSubmitBtn = document.getElementById("agora-email-submit");
  var toggleModeBtn = document.getElementById("agora-toggle-mode");
  var toggleText = document.getElementById("agora-toggle-text");
  var googleBtn = document.getElementById("agora-provider-google");
  var facebookBtn = document.getElementById("agora-provider-facebook");
  var xBtn = document.getElementById("agora-provider-x");

  var signUpMode = false;

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function openModal() {
    if (!modal) return;
    clearError();
    modal.hidden = false;
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    clearError();
    if (emailForm) emailForm.reset();
  }

  function setMode(isSignUp) {
    signUpMode = isSignUp;
    clearError();
    if (emailSubmitBtn) emailSubmitBtn.textContent = isSignUp ? "Create account" : "Sign in";
    if (toggleText) toggleText.textContent = isSignUp ? "Already have an account?" : "Don't have an account?";
    if (toggleModeBtn) toggleModeBtn.textContent = isSignUp ? "Sign in" : "Create one";
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
  }

  if (toggleModeBtn) {
    toggleModeBtn.addEventListener("click", function () {
      setMode(!signUpMode);
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", function () {
      agoraSignInWithGoogle().then(closeModal).catch(function (err) {
        showError(err.message);
      });
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener("click", function () {
      agoraSignInWithFacebook().then(closeModal).catch(function (err) {
        showError(err.message);
      });
    });
  }

  if (xBtn) {
    xBtn.addEventListener("click", function () {
      agoraSignInWithX().then(closeModal).catch(function (err) {
        showError(err.message);
      });
    });
  }

  if (emailForm) {
    emailForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      var action = signUpMode
        ? agoraSignUpWithEmail(email, password)
        : agoraSignInWithEmail(email, password);
      action.then(closeModal).catch(function (err) {
        showError(err.message);
      });
    });
  }

  function wireInstance(signInId, signOutId, userInfoId, userEmailId) {
    var signInBtn = document.getElementById(signInId);
    var signOutBtn = document.getElementById(signOutId);
    var userInfo = document.getElementById(userInfoId);
    var userEmail = document.getElementById(userEmailId);
    if (!signInBtn) return;

    signInBtn.addEventListener("click", openModal);
    if (signOutBtn) {
      signOutBtn.addEventListener("click", function () {
        agoraSignOut();
      });
    }

    agoraOnAuthChange(function (user) {
      if (user) {
        signInBtn.hidden = true;
        if (userInfo) userInfo.hidden = false;
        if (userEmail) userEmail.textContent = user.email || user.displayName || "";
      } else {
        signInBtn.hidden = false;
        if (userInfo) userInfo.hidden = true;
      }
    });
  }

  wireInstance(
    "agora-signin-btn",
    "agora-signout-btn",
    "agora-user-info",
    "agora-user-email"
  );
  wireInstance(
    "agora-hero-signin-btn",
    "agora-hero-signout-btn",
    "agora-hero-user-info",
    "agora-hero-user-email"
  );
  wireInstance(
    "agora-join-signin-btn",
    "agora-join-signout-btn",
    "agora-join-user-info",
    "agora-join-user-email"
  );
})();

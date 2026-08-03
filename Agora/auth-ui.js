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
      agoraSignInWithGoogle().then(function () {
        closeModal();
      }).catch(function (err) {
        showError(err.message);
      });
    });
  }

  if (xBtn) {
    xBtn.addEventListener("click", function () {
      agoraSignInWithX().then(function () {
        closeModal();
      }).catch(function (err) {
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
      action.then(function () {
        closeModal();
      }).catch(function (err) {
        showError(err.message);
      });
    });
  }

  // Agora never shows a signed-in visitor's raw email address – only
  // their Agora profile name (or handle, once a name/handle preference
  // exists), falling back to their provider display name before their
  // profile has loaded. The name doubles as a link to their own profile.
  function memberUrl(uid) {
    var base = window.location.pathname.indexOf("/profiles/") !== -1 ? "../member.html" : "member.html";
    return base + "?uid=" + encodeURIComponent(uid);
  }

  function wireInstance(signInId, signOutId, userInfoId, userNameId) {
    var signInBtn = document.getElementById(signInId);
    var signOutBtn = document.getElementById(signOutId);
    var userInfo = document.getElementById(userInfoId);
    var nameLink = document.getElementById(userNameId);
    if (!signInBtn) return;

    signInBtn.addEventListener("click", openModal);
    if (signOutBtn) {
      signOutBtn.addEventListener("click", function () {
        agoraSignOut();
      });
    }

    agoraOnAuthChange(function (user) {
      if (!user) {
        signInBtn.hidden = false;
        if (signOutBtn) signOutBtn.hidden = true;
        if (userInfo) userInfo.hidden = true;
        return;
      }

      signInBtn.hidden = true;
      // signOutBtn and userInfo (the "Welcome, Name!" text) toggle
      // together but aren't necessarily nested inside one another - the
      // sticky header keeps them in different DOM locations (name on the
      // left, sign-out on the right) while the hero/join instances still
      // nest signOutBtn inside userInfo, so both are set independently.
      if (signOutBtn) signOutBtn.hidden = false;
      if (userInfo) userInfo.hidden = false;
      if (!nameLink) return;

      nameLink.textContent = user.displayName || "friend";
      nameLink.removeAttribute("href");

      if (typeof AgoraDB === "undefined") return;
      AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
        if (!doc.exists) return;
        var data = doc.data();
        nameLink.textContent = (data.preferHandle && data.handle)
          ? data.handle
          : (data.name || data.handle || user.displayName || "friend");
        nameLink.href = memberUrl(user.uid);
      }).catch(function () {});
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

  // A signed-in visitor with no Firestore profile yet isn't a fully
  // accepted Agora member - Chris's rule is that an account only "counts"
  // once its required fields and Terms of Service are submitted. So this
  // redirect fires on every page load for as long as that's true, not just
  // once right after sign-in - an incomplete account can't wander the rest
  // of Agora. create-profile.html/member.html/leave-agora.html are
  // exempted so the flow itself (and viewing/leaving) isn't a redirect
  // loop back to itself.
  var path = window.location.pathname;
  var onFormPage = path.indexOf("create-profile.html") !== -1 || path.indexOf("member.html") !== -1
    || path.indexOf("leave-agora.html") !== -1;
  if (!onFormPage && typeof AgoraDB !== "undefined") {
    agoraOnAuthChange(function (user) {
      if (!user) return;
      AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
        if (!doc.exists) window.location.href = "create-profile.html";
      });
    });
  }
})();

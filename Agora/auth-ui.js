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

  // Marks that a sign-in just happened in this tab, so the new-profile
  // redirect below fires once, right after signing in - not on every
  // later page visit for as long as the session happens to lack a profile.
  function markJustSignedIn() {
    try { sessionStorage.setItem("agoraJustSignedIn", "1"); } catch (e) {}
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", function () {
      agoraSignInWithGoogle().then(function () {
        markJustSignedIn();
        closeModal();
      }).catch(function (err) {
        showError(err.message);
      });
    });
  }

  if (xBtn) {
    xBtn.addEventListener("click", function () {
      agoraSignInWithX().then(function () {
        markJustSignedIn();
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
        markJustSignedIn();
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
        if (userInfo) userInfo.hidden = true;
        return;
      }

      signInBtn.hidden = true;
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

  // Right after a fresh sign-in with no Firestore profile yet, send the
  // visitor to create one - but only that once. Without the just-signed-in
  // check, this would fire on every later page visit for as long as the
  // account lacks a profile, turning "← Agora" into a redirect loop back to
  // create-profile.html instead of actually leaving the page.
  var path = window.location.pathname;
  var onFormPage = path.indexOf("create-profile.html") !== -1 || path.indexOf("member.html") !== -1
    || path.indexOf("leave-agora.html") !== -1;
  if (!onFormPage && typeof AgoraDB !== "undefined") {
    agoraOnAuthChange(function (user) {
      if (!user) return;
      var justSignedIn = false;
      try { justSignedIn = sessionStorage.getItem("agoraJustSignedIn") === "1"; } catch (e) {}
      if (!justSignedIn) return;
      try { sessionStorage.removeItem("agoraJustSignedIn"); } catch (e) {}
      AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
        if (!doc.exists) window.location.href = "create-profile.html";
      });
    });
  }
})();

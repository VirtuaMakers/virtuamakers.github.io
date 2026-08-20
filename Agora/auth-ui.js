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
  var passwordToggle = document.getElementById("agora-password-toggle");
  var emailSubmitBtn = document.getElementById("agora-email-submit");
  var toggleModeBtn = document.getElementById("agora-toggle-mode");
  var toggleText = document.getElementById("agora-toggle-text");
  var forgotPasswordRow = document.getElementById("agora-forgot-password-row");
  var forgotPasswordBtn = document.getElementById("agora-forgot-password-btn");
  var googleBtn = document.getElementById("agora-provider-google");
  var xBtn = document.getElementById("agora-provider-x");
  var termsCheckRow = document.getElementById("agora-terms-check-row");
  var termsCheckbox = document.getElementById("agora-terms-checkbox");

  var signUpMode = false;

  function showError(message) {
    if (!errorEl) return;
    errorEl.classList.remove("signin-success");
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  // Reuses the same element as showError(), just recolored - a password
  // reset confirmation isn't an error, but the modal only has the one
  // message slot.
  function showInfo(message) {
    if (!errorEl) return;
    errorEl.classList.add("signin-success");
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.classList.remove("signin-success");
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function openModal() {
    if (!modal) return;
    clearError();
    modal.hidden = false;
  }

  function resetPasswordVisibility() {
    if (passwordInput) passwordInput.type = "password";
    if (passwordToggle) {
      passwordToggle.textContent = "👁️";
      passwordToggle.setAttribute("aria-label", "Show password");
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    clearError();
    if (emailForm) emailForm.reset();
    resetPasswordVisibility();
  }

  function setMode(isSignUp) {
    signUpMode = isSignUp;
    clearError();
    if (emailSubmitBtn) emailSubmitBtn.textContent = isSignUp ? "Create account" : "Sign in";
    if (toggleText) toggleText.textContent = isSignUp ? "Already have an account?" : "Don't have an account?";
    if (toggleModeBtn) toggleModeBtn.textContent = isSignUp ? "Sign in" : "Create one";
    if (termsCheckRow) termsCheckRow.hidden = !isSignUp;
    if (termsCheckbox) termsCheckbox.checked = false;
    // Resetting a password only makes sense for an account that already
    // exists, so this hides right alongside the sign-up-only ToS row.
    if (forgotPasswordRow) forgotPasswordRow.hidden = isSignUp;
  }

  // Completes a mobile Google/X sign-in that used signInWithRedirect (see
  // auth.js's agoraIsMobile()) - that flow navigates away to the provider
  // and back with a full page reload, so any error from it can't be
  // caught in the click handler that started it the way a popup's promise
  // rejection can. A successful sign-in needs no handling here at all -
  // it's already picked up automatically by every page's own
  // agoraOnAuthChange listener, same as a popup sign-in would be. This
  // resolves harmlessly with no user on every normal page load where no
  // redirect was pending, so it's safe to call unconditionally.
  AgoraAuth.getRedirectResult().catch(function (err) {
    openModal();
    showError(err.message);
  });

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

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", function () {
      var showing = passwordInput.type === "text";
      passwordInput.type = showing ? "password" : "text";
      passwordToggle.textContent = showing ? "👁️" : "🙈";
      passwordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
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
      if (signUpMode && termsCheckbox && !termsCheckbox.checked) {
        showError("Please agree to the Terms of Service to create an account.");
        return;
      }
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

  // Doesn't reveal whether an account exists for the typed email - shows
  // the same "if an account exists…" message whether the send actually
  // succeeded or Firebase reported no matching user, so this can't be used
  // to probe which emails are registered. A malformed address is still
  // called out directly, since that's not account information.
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", function () {
      var email = emailInput.value.trim();
      if (!email) {
        showError("Enter your email above, then click “Forgot password?” again.");
        return;
      }
      agoraSendPasswordReset(email).then(function () {
        showInfo("If an account exists for that email, a password reset link has been sent.");
      }).catch(function (err) {
        if (err.code === "auth/invalid-email") {
          showError("That doesn't look like a valid email address.");
          return;
        }
        if (err.code === "auth/user-not-found") {
          showInfo("If an account exists for that email, a password reset link has been sent.");
          return;
        }
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

  function wireInstance(signInId, signOutId, userInfoId, userNameId, profileLinkId) {
    var signInBtn = document.getElementById(signInId);
    var signOutBtn = document.getElementById(signOutId);
    var userInfo = document.getElementById(userInfoId);
    var nameLink = document.getElementById(userNameId);
    var profileLink = profileLinkId ? document.getElementById(profileLinkId) : null;
    if (!signInBtn) return;

    // Once a dedicated Profile link exists for this instance (the header,
    // not the hero - the hero has no Profile link of its own), the name
    // itself no longer needs to double as a link - keeping it clickable
    // too was redundant now that "Profile 🙂" is the obvious click target,
    // per Chris's call. Static text still shouldn't look clickable, so
    // this also strips the pointer cursor/hover-underline .auth-email
    // otherwise always carries.
    if (nameLink && profileLink) nameLink.classList.add("auth-email-static");

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
        if (profileLink) profileLink.hidden = true;
        return;
      }

      signInBtn.hidden = true;
      // signOutBtn and userInfo (the "Welcome, Name!" text) toggle
      // together but aren't necessarily nested inside one another - the
      // sticky header keeps them in different DOM locations (name on the
      // left, sign-out on the right) while the hero/join instances still
      // nest signOutBtn inside userInfo, so both are set independently.
      if (signOutBtn) signOutBtn.hidden = false;
      // The Profile link's href only needs the uid (not the Firestore
      // fetch nameLink waits on below), so it can show immediately on
      // sign-in with no flash/delay.
      if (profileLink) {
        profileLink.href = memberUrl(user.uid);
        profileLink.hidden = false;
      }

      if (!nameLink) {
        if (userInfo) userInfo.hidden = false;
        return;
      }

      nameLink.removeAttribute("href");

      // Don't reveal userInfo until the Firestore-resolved name (handle,
      // if preferred) is known - setting it to the Auth provider's raw
      // displayName first and correcting it a moment later caused a
      // visible flash of someone's real name before their handle
      // resolved in (e.g. "Chris Bruckmann" flashing before "River").
      function reveal(name) {
        nameLink.textContent = name;
        if (userInfo) userInfo.hidden = false;
      }

      if (typeof AgoraDB === "undefined") {
        reveal(user.displayName || "friend");
        return;
      }
      AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
        if (!doc.exists) {
          reveal(user.displayName || "friend");
          return;
        }
        var data = doc.data();
        reveal((data.preferHandle && data.handle)
          ? data.handle
          : (data.name || data.handle || user.displayName || "friend"));
        // Only when there's no dedicated Profile link for this instance -
        // see the .auth-email-static note above.
        if (!profileLink) nameLink.href = memberUrl(user.uid);
      }).catch(function () {
        reveal(user.displayName || "friend");
      });
    });
  }

  wireInstance(
    "agora-signin-btn",
    "agora-signout-btn",
    "agora-user-info",
    "agora-user-email",
    "agora-profile-link"
  );
  wireInstance(
    "agora-hero-signin-btn",
    "agora-hero-signout-btn",
    "agora-hero-user-info",
    "agora-hero-user-email"
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

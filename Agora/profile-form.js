// Drives create-profile.html: sign-in gate, Kind selection, pre-fill for
// editing an existing profile, and the Firestore write on submit.

(function () {
  var OWNER_EMAIL = "VirtuaMakers@Outlook.com";

  var signedOutNotice = document.getElementById("signed-out-notice");
  var loadErrorNotice = document.getElementById("load-error-notice");
  var formWrap = document.getElementById("profile-form-wrap");
  var kindIntro = document.getElementById("kind-intro");
  var kindSelector = document.getElementById("kind-selector");
  var kindButtons = document.querySelectorAll(".kind-option");
  var formIntro = document.getElementById("form-intro");
  var form = document.getElementById("profile-form");
  var formTitle = document.getElementById("form-title");
  var dateLabel = document.getElementById("field-date-label");
  var dateYearInput = document.getElementById("field-date-year");
  var dateMonthSelect = document.getElementById("field-date-month");
  var dateDayInput = document.getElementById("field-date-day");
  var dateVisible = document.getElementById("field-date-visible");
  var dateVisibleLabel = document.getElementById("field-date-visible-label");
  var dateInlineError = document.getElementById("field-date-inline-error");
  var cyberizationWrap = document.getElementById("field-cyberization-wrap");
  var cyberizationYearInput = document.getElementById("field-cyberization-year");
  var cyberizationMonthSelect = document.getElementById("field-cyberization-month");
  var cyberizationDayInput = document.getElementById("field-cyberization-day");
  var cyberizationVisible = document.getElementById("field-cyberization-visible");
  var cyberizationInlineError = document.getElementById("field-cyberization-inline-error");
  var cityInput = document.getElementById("field-city");
  var countryInput = document.getElementById("field-country");
  var locationVisible = document.getElementById("field-location-visible");
  var regionInput = document.getElementById("field-region");
  var mapVisible = document.getElementById("field-map-visible");
  var handleInput = document.getElementById("field-handle");
  var portalWrap = document.getElementById("field-portal-wrap");
  var pictureInputs = [1, 2, 3, 4, 5].map(function (n) {
    return document.getElementById("field-picture-" + n);
  });
  var pictureThumbs = [1, 2, 3, 4, 5].map(function (n) {
    return document.getElementById("field-picture-" + n + "-thumb");
  });
  var pictureRemoveWraps = [1, 2, 3, 4, 5].map(function (n) {
    return document.getElementById("field-picture-" + n + "-remove-wrap");
  });
  var pictureRemoveCheckboxes = [1, 2, 3, 4, 5].map(function (n) {
    return document.getElementById("field-picture-" + n + "-remove");
  });
  var pictureStatusEls = [1, 2, 3, 4, 5].map(function (n) {
    return document.getElementById("field-picture-" + n + "-status");
  });
  // The URL already on the profile for each picture slot, kept separate
  // from the file inputs (which only ever hold a *new* file the member is
  // uploading) - unchanged slots fall back to this on save.
  var existingPictureUrls = [1, 2, 3, 4, 5].map(function () { return ""; });
  // Set once a newly-chosen picture actually finishes uploading (below) -
  // save() reads from here instead of doing any picture work itself.
  var uploadedPictureUrls = [1, 2, 3, 4, 5].map(function () { return null; });
  // "idle" | "checking" | "uploading" | "done" | "blocked" | "error" - save()
  // refuses to submit while any slot is still checking/uploading, or is
  // blocked/errored, rather than silently saving without that picture.
  var pictureUploadState = [1, 2, 3, 4, 5].map(function () { return "idle"; });

  var MAX_PICTURE_BYTES = 5 * 1024 * 1024;

  // Uploads on the spot, the moment a picture is chosen, rather than
  // bundling all 5 into the Save click (Chris, 2026-08-15) - a save with
  // several full-size pictures at once was unreliable even after raising
  // its timeout, since 5 uploads competing for the same connection at once
  // is real bandwidth contention, not just a deadline problem. Spreading
  // uploads out over however long the member spends filling in the rest of
  // the form, and queuing the actual Storage puts one at a time (below)
  // instead of letting all 5 run concurrently, fixes the underlying cause
  // instead of just giving it more time to finish.
  //
  // pictureUploadQueue serializes only the actual Storage upload step
  // (the heavy, uncapped-until-5MB part) across all 5 slots - the
  // moderation check ahead of it can still run per-slot in parallel, since
  // resizeForModeration() already keeps that payload small.
  var pictureUploadQueue = Promise.resolve();
  // Per-slot counters so a stale async result (moderation/upload) from a
  // picture the member has since replaced with a different one doesn't
  // clobber the newer selection's status.
  var pictureGenerations = [0, 0, 0, 0, 0];

  function setPictureStatus(i, text, isError) {
    var el = pictureStatusEls[i];
    el.textContent = text || "";
    el.hidden = !text;
    el.classList.toggle("field-error-inline", !!isError);
    el.classList.toggle("field-hint", !isError);
  }

  pictureInputs.forEach(function (input, i) {
    input.addEventListener("change", function () {
      var file = input.files[0];
      if (!file) return;

      var myGeneration = ++pictureGenerations[i];
      function stillCurrent() { return pictureGenerations[i] === myGeneration; }

      // A newly chosen file replaces whatever was there, so a pending
      // "remove the existing picture" request no longer makes sense, and
      // any previous upload result/state for this slot no longer applies.
      pictureRemoveCheckboxes[i].checked = false;
      pictureRemoveWraps[i].hidden = true;
      uploadedPictureUrls[i] = null;
      pictureUploadState[i] = "idle";

      var reader = new FileReader();
      reader.onload = function () {
        if (!stillCurrent()) return;
        pictureThumbs[i].src = reader.result;
        pictureThumbs[i].hidden = false;
      };
      reader.readAsDataURL(file);

      if (file.size > MAX_PICTURE_BYTES) {
        pictureUploadState[i] = "error";
        setPictureStatus(i, "Too large - please choose a file under 5MB.", true);
        return;
      }
      if (!/^image\//.test(file.type)) {
        pictureUploadState[i] = "error";
        setPictureStatus(i, "That's not an image file.", true);
        return;
      }

      pictureUploadState[i] = "checking";
      setPictureStatus(i, "Checking…");

      AgoraModeration.checkImage(file, i + 1).then(function (result) {
        if (!stillCurrent()) return;
        if (result.decision === "block") {
          pictureUploadState[i] = "blocked";
          setPictureStatus(i, "", false);
          AgoraModeration.showBlocked(pictureStatusEls[i], result.logId,
            "Didn't pass Agora's content filter. ");
          pictureStatusEls[i].classList.add("field-error-inline");
          return;
        }

        pictureUploadState[i] = "uploading";
        setPictureStatus(i, "Uploading…");

        pictureUploadQueue = pictureUploadQueue.then(function () {
          if (!stillCurrent()) return;
          // Storage's own .put() has no built-in client timeout (same gap
          // withTimeout() further down this file exists to cover for the
          // Save chain) - moving uploads off that chain and onto the spot
          // they're chosen means they need this same protection themselves
          // now, or a stalled upload on a bad connection just hangs at
          // "Uploading…" forever with no error and no way to retry.
          return withTimeout(
            uploadPicture(currentUser.uid, i + 1, file), 45000,
            "Upload timed out - check your connection and try choosing this picture again."
          ).then(function (url) {
            if (!stillCurrent()) return;
            uploadedPictureUrls[i] = url;
            pictureUploadState[i] = "done";
            setPictureStatus(i, "Uploaded ✓");
          }).catch(function (err) {
            if (!stillCurrent()) return;
            pictureUploadState[i] = "error";
            setPictureStatus(i, err && err.message ? err.message : "Upload failed - try choosing this picture again.", true);
          });
        });
      }).catch(function () {
        if (!stillCurrent()) return;
        pictureUploadState[i] = "error";
        setPictureStatus(i, "Something went wrong checking this picture - try again.", true);
      });
    });
  });
  var socialInputs = [1, 2, 3].map(function (n) {
    return document.getElementById("field-social-" + n);
  });
  var emailInput = document.getElementById("field-email");
  var emailVisible = document.getElementById("field-email-visible");
  var requireFriendCheckbox = document.getElementById("field-require-friend");
  var tosInput = document.getElementById("field-tos");
  var newsletterCheckbox = document.getElementById("field-newsletter");
  var errorEl = document.getElementById("form-error");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("form-submit");
  var dangerZone = document.getElementById("danger-zone");
  var cancelSignupWrap = document.getElementById("cancel-signup-wrap");
  var cancelSignupLink = document.getElementById("cancel-signup-link");
  var tosWrap = document.getElementById("field-tos-wrap");

  var changeEmailSection = document.getElementById("change-email-section");
  var changeEmailCurrent = document.getElementById("change-email-current");
  var changeEmailOwnerWarning = document.getElementById("change-email-owner-warning");
  var changeEmailForm = document.getElementById("change-email-form");
  var changeEmailNewInput = document.getElementById("change-email-new");
  var changeEmailPasswordWrap = document.getElementById("change-email-password-wrap");
  var changeEmailPasswordInput = document.getElementById("change-email-password");
  var changeEmailOauthNotice = document.getElementById("change-email-oauth-notice");
  var changeEmailError = document.getElementById("change-email-error");
  var changeEmailSuccess = document.getElementById("change-email-success");
  var changeEmailSubmit = document.getElementById("change-email-submit");
  var changeEmailStatus = document.getElementById("change-email-status");

  var bioTagsHint = document.getElementById("field-bio-tags-hint");
  if (bioTagsHint && typeof AgoraBioTags !== "undefined") {
    bioTagsHint.textContent = AgoraBioTags.hint;
  }

  var currentUser = null;
  var selectedKind = null;
  var existingDoc = null;

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function selectKind(kind) {
    selectedKind = kind;
    kindButtons.forEach(function (btn) {
      btn.classList.toggle("selected", btn.dataset.kind === kind);
    });
    var dateName = kind === "AI" ? "Release Date" : "Birthdate";
    dateLabel.textContent = dateName + " (required)";
    dateVisibleLabel.textContent = "Display " + dateName + "?";
    portalWrap.hidden = kind !== "AI";
    cyberizationWrap.hidden = kind !== "Cyborg";
    form.hidden = false;
    formIntro.hidden = false;
  }

  kindButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectKind(btn.dataset.kind);
    });
  });

  // Decomposes a stored YYYY-MM-DD (or partial YYYY-MM / YYYY) string back
  // into the three Year/Month/Day fields for editing.
  function decomposeDateInto(raw, yearInput, monthSelect, dayInput) {
    yearInput.value = "";
    monthSelect.value = "";
    dayInput.value = "";
    if (!raw) return;
    var m = String(raw).match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    if (!m) return;
    yearInput.value = m[1];
    if (m[2]) monthSelect.value = String(parseInt(m[2], 10));
    if (m[3]) dayInput.value = String(parseInt(m[3], 10));
  }

  function fillForm(data, privateData) {
    document.getElementById("field-name").value = data.name || "";
    handleInput.value = data.handle || "";
    document.getElementById("field-prefer-handle").checked = !!data.preferHandle;
    decomposeDateInto(data.date, dateYearInput, dateMonthSelect, dateDayInput);
    dateVisible.checked = data.showDate !== false;
    decomposeDateInto(data.cyberizationDate, cyberizationYearInput, cyberizationMonthSelect, cyberizationDayInput);
    cyberizationVisible.checked = data.showCyberizationDate !== false;
    cityInput.value = data.city || "";
    countryInput.value = data.country || "";
    locationVisible.checked = data.showLocation !== false;
    regionInput.value = (privateData && privateData.region) || "";
    mapVisible.checked = data.showMap !== false;
    document.getElementById("field-orgs").value = data.organizations || "";
    pictureInputs.forEach(function (input, i) {
      input.value = "";
      var url = data["picture" + (i + 1)] || "";
      existingPictureUrls[i] = url;
      pictureRemoveCheckboxes[i].checked = false;
      if (url) {
        pictureThumbs[i].src = url;
        pictureThumbs[i].hidden = false;
        pictureRemoveWraps[i].hidden = false;
      } else {
        pictureThumbs[i].hidden = true;
        pictureRemoveWraps[i].hidden = true;
      }
    });
    document.getElementById("field-bio").value = data.bio || "";
    document.getElementById("field-link").value = data.link || "";
    document.getElementById("field-portal").value = data.portal || "";
    socialInputs.forEach(function (input, i) {
      input.value = data["social" + (i + 1)] || "";
    });
    emailInput.value = data.email || "";
    emailVisible.checked = data.showEmail !== false;
    requireFriendCheckbox.checked = !!data.requireFriendToMessage;
    // Respects an explicit false (e.g. from the no-login unsubscribe link
    // in a newsletter email) same as every other "on by default" checkbox
    // here - only an explicit false unchecks it, not a merely-missing field.
    newsletterCheckbox.checked = data.newsletterOptIn !== false;
  }

  // A real calendar day-count per month, leap years included - JS's Date
  // handles this correctly via "day 0 of next month" = last day of this one.
  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  // Reads Year (required)/Month (optional dropdown)/Day (optional, needs
  // Month) into { raw: "YYYY-MM-DD" or a partial form, parsed: {year,
  // month, day} } - or { error } with an inline message already shown.
  function composeDate(yearInput, monthSelect, dayInput, inlineError) {
    inlineError.hidden = true;
    var yearRaw = yearInput.value.trim();
    if (!yearRaw) return { error: "missing-year" };
    var year = parseInt(yearRaw, 10);
    if (!/^\d+$/.test(yearRaw) || year < 1 || year > 9999) {
      inlineError.textContent = "Please enter a valid Year.";
      inlineError.hidden = false;
      return { error: "invalid-year" };
    }

    var month = monthSelect.value ? parseInt(monthSelect.value, 10) : null;
    var dayRaw = dayInput.value.trim();
    var day = dayRaw ? parseInt(dayRaw, 10) : null;

    if (day && !month) {
      inlineError.textContent = "A Day needs a Month too.";
      inlineError.hidden = false;
      return { error: "day-without-month" };
    }
    if (day && (day < 1 || day > daysInMonth(year, month))) {
      inlineError.textContent = "That's not a real Day for that Month and Year.";
      inlineError.hidden = false;
      return { error: "invalid-day" };
    }

    var raw = String(year);
    if (month) raw += "-" + (month < 10 ? "0" + month : month);
    if (day) raw += "-" + (day < 10 ? "0" + day : day);
    return { raw: raw, parsed: { year: year, month: month, day: day } };
  }

  // Year-Month-Day order (international, per Chris) with the month spelled
  // out - never American Month-Day-Year, and never raw numeric shorthand.
  function humanizeDate(parsed) {
    if (parsed.day) return parsed.year + " " + MONTH_NAMES[parsed.month - 1] + " " + parsed.day;
    if (parsed.month) return parsed.year + " " + MONTH_NAMES[parsed.month - 1];
    return String(parsed.year);
  }

  // Looks up City/Region/Country against OpenStreetMap's free Nominatim
  // search (no API key) to place the profile's map dot - the State/Province/
  // Territory field exists purely to disambiguate this lookup (e.g. two
  // towns with the same name in different regions) and is never shown
  // publicly itself; only City, Country ever renders on the profile. This
  // is best-effort: any failure (network, timeout, no match) just resolves
  // to null rather than blocking the save, since the map is optional and a
  // profile shouldn't fail to save because a geocoding request timed out.
  // A last-resort safety net around the whole save chain below (moderation
  // checks, picture uploads, the Firestore writes themselves) - none of
  // those individually guarantee they'll ever settle on a bad connection
  // (a stalled Storage upload or Firestore write has no built-in client
  // timeout), so without this a member on a weak signal could be left
  // staring at "Saving…" with no error and no way out, same failure shape
  // already fixed for page *loads* elsewhere in this file - see
  // #load-error-notice and CLAUDE.md's "Loading-failure hardening" entry.
  function withTimeout(promise, ms, message) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error(message)); }, ms);
      promise.then(
        function (value) { clearTimeout(timer); resolve(value); },
        function (err) { clearTimeout(timer); reject(err); }
      );
    });
  }

  function geocodeLocation(city, region, country) {
    var query = [city, region, country].filter(Boolean).join(", ");
    if (!query) return Promise.resolve(null);

    var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;

    return fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query),
      controller ? { signal: controller.signal } : {})
      .then(function (res) { return res.json(); })
      .then(function (results) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!results || !results.length) return null;
        var lat = parseFloat(results[0].lat);
        var lng = parseFloat(results[0].lon);
        return (isNaN(lat) || isNaN(lng)) ? null : { lat: lat, lng: lng };
      })
      .catch(function () {
        if (timeoutId) clearTimeout(timeoutId);
        return null;
      });
  }

  // Uploads to a fixed per-slot path (no filename/extension in the path)
  // rather than a timestamped one, so re-uploading a picture overwrites the
  // same Storage object instead of leaving the old one behind orphaned -
  // matching the site's general "each save is a full overwrite" convention.
  // Storage infers contentType from the File itself, so no extension is
  // needed in the path for that either.
  function uploadPicture(uid, index, file) {
    var ref = AgoraStorage.ref().child("profile-pictures/" + uid + "/picture" + index);
    return ref.put(file).then(function (snapshot) {
      return snapshot.ref.getDownloadURL();
    });
  }

  // Live validation as the member fills in Year/Month/Day, rather than
  // waiting until Save to flag an impossible date (e.g. Feb 30).
  function attachLiveDateValidation(yearInput, monthSelect, dayInput, inlineError) {
    function check() {
      if (!yearInput.value.trim()) {
        inlineError.hidden = true;
        return;
      }
      composeDate(yearInput, monthSelect, dayInput, inlineError);
    }
    [yearInput, monthSelect, dayInput].forEach(function (el) {
      el.addEventListener("input", check);
      el.addEventListener("change", check);
    });
  }

  attachLiveDateValidation(dateYearInput, dateMonthSelect, dateDayInput, dateInlineError);
  attachLiveDateValidation(cyberizationYearInput, cyberizationMonthSelect, cyberizationDayInput, cyberizationInlineError);

  // Change Login Email (Chris, 2026-08-15, moved here from member.html the
  // same day) - lives on the actual edit form rather than the read-only
  // profile view. Only shown once we know this is an existing, already-
  // saved profile (existingDoc set below) - a brand-new signup has no
  // reason to immediately change the email it just signed up with, and
  // showing it mid-signup would be premature. A password-provider account
  // confirms via its current password; a Google/X account reauthenticates
  // via a fresh popup instead - see agoraReauthenticate() in auth.js.
  function refreshChangeEmailSection() {
    changeEmailSection.hidden = !existingDoc;
    if (!existingDoc) return;

    changeEmailCurrent.textContent = currentUser.email || "(no email on file)";
    changeEmailOwnerWarning.hidden = currentUser.email !== OWNER_EMAIL;

    var providerId = currentUser.providerData[0] && currentUser.providerData[0].providerId;
    var isPasswordAccount = providerId === "password";
    changeEmailPasswordWrap.hidden = !isPasswordAccount;
    changeEmailPasswordInput.required = isPasswordAccount;

    if (isPasswordAccount) {
      changeEmailOauthNotice.hidden = true;
    } else {
      var providerName = providerId === "google.com" ? "Google"
        : providerId === "twitter.com" ? "X"
        : "your sign-in provider";
      changeEmailOauthNotice.textContent = "You signed in with " + providerName +
        " - confirming this will open a " + providerName + " prompt to verify it's really you first.";
      changeEmailOauthNotice.hidden = false;
    }
  }

  changeEmailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    changeEmailError.hidden = true;
    changeEmailSuccess.hidden = true;

    var newEmail = changeEmailNewInput.value.trim();
    if (!newEmail) return;

    if (currentUser.email === OWNER_EMAIL) {
      var confirmed = window.confirm(
        "This is Agora's owner account email. Changing it will move permanent " +
        "owner access to the new address once it's confirmed. Are you sure you want to continue?"
      );
      if (!confirmed) return;
    }

    var providerId = currentUser.providerData[0] && currentUser.providerData[0].providerId;

    changeEmailSubmit.disabled = true;
    changeEmailStatus.hidden = false;

    agoraReauthenticate(providerId, changeEmailPasswordInput.value)
      .then(function () {
        // Forces a fresh ID token so requestEmailChange's own server-side
        // "recent login" check (the auth_time claim) reflects the reauth
        // that just happened, not a token cached from before it.
        return firebase.auth().currentUser.getIdToken(true);
      })
      .then(function () {
        return agoraRequestEmailChange(newEmail);
      })
      .then(function () {
        changeEmailSuccess.textContent = "Check " + newEmail +
          " for a confirmation link - the change takes effect once you click it.";
        changeEmailSuccess.hidden = false;
        changeEmailForm.reset();
        refreshChangeEmailSection();
      })
      .catch(function (err) {
        changeEmailError.textContent = (err && err.message) || "Something went wrong. Please try again.";
        changeEmailError.hidden = false;
      })
      .finally(function () {
        changeEmailSubmit.disabled = false;
        changeEmailStatus.hidden = true;
      });
  });

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (!user) {
      signedOutNotice.hidden = false;
      formWrap.hidden = true;
      return;
    }

    signedOutNotice.hidden = true;
    loadErrorNotice.hidden = true;
    // Stay hidden until we know whether this is a new profile (show the
    // Kind picker) or an edit (skip straight to the form) - otherwise the
    // Kind picker flashes onscreen for a moment on every edit.
    formWrap.hidden = true;

    AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
      if (doc.exists) {
        existingDoc = doc.data();
        formTitle.textContent = "Edit Your Profile";
        kindIntro.hidden = true;
        kindSelector.hidden = true;
        dangerZone.hidden = false;
        cancelSignupWrap.hidden = true;
        refreshChangeEmailSection();
        // Already agreed once, as part of getting this profile created in
        // the first place - Chris's call: never ask again on an edit.
        tosWrap.hidden = true;
        tosInput.required = false;

        // Region lives in a separate, owner-only-readable document - see
        // firestore.rules' profiles/{uid}/private match - so pre-filling
        // it on edit means fetching that too, not just the public doc.
        return AgoraDB.collection("profiles").doc(user.uid)
          .collection("private").doc("data").get().then(function (privateDoc) {
            fillForm(existingDoc, privateDoc.exists ? privateDoc.data() : {});
            selectKind(existingDoc.kind || "Human");
            formWrap.hidden = false;
          });
      } else {
        document.getElementById("field-name").value = user.displayName || "";
        document.getElementById("field-email").value = user.email || "";
        // No profile yet - an account only counts as accepted once one's
        // saved (required fields + Terms of Service), so offer a clean way
        // to back out rather than leaving a signed-in, permanently
        // unfinished account behind.
        cancelSignupWrap.hidden = false;
        tosWrap.hidden = false;
        tosInput.required = true;
        formWrap.hidden = false;
      }
    }).catch(function () {
      // Without this, a flaky connection (or any other fetch failure)
      // leaves the page stuck showing only the "Create/Edit Your Profile"
      // heading forever, with the actual form never appearing and no
      // indication anything went wrong - a real report from testing on a
      // spotty mobile connection.
      loadErrorNotice.hidden = false;
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearError();

    if (!currentUser) {
      showError("You need to sign in first.");
      return;
    }
    if (!selectedKind) {
      showError("Please choose your Kind (AI, Cyborg, or Human).");
      return;
    }

    var dateName = selectedKind === "AI" ? "Release Date" : "Birthdate";
    var dateResult = composeDate(dateYearInput, dateMonthSelect, dateDayInput, dateInlineError);
    if (dateResult.error === "missing-year") {
      showError("Please enter your " + dateName + " (at least the Year).");
      return;
    }
    if (dateResult.error) {
      showError("Please fix the " + dateName + " field above.");
      return;
    }
    var rawDate = dateResult.raw;
    var parsedDate = dateResult.parsed;

    var rawCyberizationDate = "";
    var parsedCyberizationDate = null;
    if (selectedKind === "Cyborg") {
      var cyberizationResult = composeDate(cyberizationYearInput, cyberizationMonthSelect, cyberizationDayInput, cyberizationInlineError);
      if (cyberizationResult.error === "missing-year") {
        showError("Please enter your Cyberization Date (at least the Year).");
        return;
      }
      if (cyberizationResult.error) {
        showError("Please fix the Cyberization Date field above.");
        return;
      }
      rawCyberizationDate = cyberizationResult.raw;
      parsedCyberizationDate = cyberizationResult.parsed;
    }

    var city = cityInput.value.trim();
    var country = countryInput.value;

    var email = emailInput.value.trim();
    if (!email) {
      showError("Please enter your Email.");
      return;
    }

    if (!existingDoc && !tosInput.checked) {
      showError("Please agree to the Terms of Service.");
      return;
    }

    var handle = handleInput.value.trim();

    var linkValue = document.getElementById("field-link").value.trim();
    var portalValue = selectedKind === "AI" ? document.getElementById("field-portal").value.trim() : "";
    var socialValues = socialInputs.map(function (input) { return input.value.trim(); });

    var blockedCandidates = [linkValue, portalValue].concat(socialValues).filter(Boolean);
    var hasBlockedLink = blockedCandidates.some(function (v) {
      return AgoraSocialFormat.isBlockedDomain(v);
    });
    if (hasBlockedLink) {
      showError("That link isn't allowed here – please remove it.");
      return;
    }

    var socialsFlagged = socialValues.some(function (v) {
      if (!v) return false;
      var info = AgoraSocialFormat.format(v);
      return info && info.unrecognized;
    });

    // Pictures upload on the spot as they're chosen (see the change
    // listeners above) - by Save time each slot is already "done" (or was
    // never touched), so this just refuses to submit while one is still in
    // flight or didn't make it, rather than silently saving without it.
    for (var pi = 0; pi < pictureInputs.length; pi++) {
      var state = pictureUploadState[pi];
      if (state === "checking" || state === "uploading") {
        showError("Picture " + (pi + 1) + " is still uploading - give it a moment and try saving again.");
        return;
      }
      if (state === "blocked") {
        showError("Picture " + (pi + 1) + " didn't pass Agora's content filter - remove it or choose a different picture before saving.");
        return;
      }
      if (state === "error") {
        showError("Picture " + (pi + 1) + " didn't upload successfully - try choosing it again before saving.");
        return;
      }
    }

    var data = {
      name: document.getElementById("field-name").value.trim(),
      handle: handle,
      preferHandle: document.getElementById("field-prefer-handle").checked,
      kind: selectedKind,
      date: rawDate,
      showDate: dateVisible.checked,
      cyberizationDate: selectedKind === "Cyborg" ? rawCyberizationDate : "",
      showCyberizationDate: selectedKind === "Cyborg" ? cyberizationVisible.checked : true,
      city: city,
      country: country,
      showLocation: locationVisible.checked,
      showMap: mapVisible.checked,
      organizations: document.getElementById("field-orgs").value.trim(),
      // A slot with "Remove this picture" checked clears to ""; a slot
      // with a newly chosen file already finished uploading by now (the
      // guard above refuses to reach here otherwise) so uses that real
      // Storage URL; anything else keeps whatever was already saved.
      picture1: pictureRemoveCheckboxes[0].checked ? "" : (uploadedPictureUrls[0] || existingPictureUrls[0]),
      picture2: pictureRemoveCheckboxes[1].checked ? "" : (uploadedPictureUrls[1] || existingPictureUrls[1]),
      picture3: pictureRemoveCheckboxes[2].checked ? "" : (uploadedPictureUrls[2] || existingPictureUrls[2]),
      picture4: pictureRemoveCheckboxes[3].checked ? "" : (uploadedPictureUrls[3] || existingPictureUrls[3]),
      picture5: pictureRemoveCheckboxes[4].checked ? "" : (uploadedPictureUrls[4] || existingPictureUrls[4]),
      bio: document.getElementById("field-bio").value.trim(),
      link: linkValue,
      portal: portalValue,
      social1: socialValues[0],
      social2: socialValues[1],
      social3: socialValues[2],
      socialsFlagged: socialsFlagged,
      email: email,
      showEmail: emailVisible.checked,
      requireFriendToMessage: requireFriendCheckbox.checked,
      newsletterOptIn: newsletterCheckbox.checked,
      status: existingDoc ? existingDoc.status : "active",
      // Invisible view counter, written directly by member.html - not part
      // of this form at all, but .set() below fully replaces the document,
      // so it has to be explicitly carried forward here or every save
      // would silently reset it to 0 (same pattern as tosAgreedAt/
      // createdAt below).
      profileViews: existingDoc && typeof existingDoc.profileViews === "number" ? existingDoc.profileViews : 0,
      tosAgreedAt: existingDoc && existingDoc.tosAgreedAt
        ? existingDoc.tosAgreedAt
        : firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: existingDoc && existingDoc.createdAt
        ? existingDoc.createdAt
        : firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (!data.name) {
      showError("Name is required.");
      return;
    }

    // Only sanity-check the date(s) with the member when they've actually
    // changed - a brand new profile (nothing to compare against yet), or
    // an edit where the composed date differs from what's already saved.
    // Originally this fired on every single save regardless, which meant
    // re-confirming an unchanged birthdate each time someone just toggled
    // a checkbox or edited an unrelated field (Chris, 2026-08-15).
    var dateChanged = !existingDoc || rawDate !== (existingDoc.date || "");
    var cyberizationChanged = selectedKind === "Cyborg"
      && rawCyberizationDate !== (existingDoc && existingDoc.cyberizationDate || "");
    if (dateChanged || cyberizationChanged) {
      var confirmLines = [dateName + ": " + humanizeDate(parsedDate)];
      if (parsedCyberizationDate) {
        confirmLines.push("Cyberization Date: " + humanizeDate(parsedCyberizationDate));
      }
      if (!window.confirm("You entered —\n" + confirmLines.join("\n") + "\nIs that correct?")) return;
    }

    submitBtn.disabled = true;
    statusEl.hidden = false;

    var regionValue = regionInput.value.trim();

    var handleCheck = handle
      ? AgoraDB.collection("profiles").where("handle", "==", handle).get()
      : Promise.resolve(null);

    var geocodePromise = geocodeLocation(city, regionValue, country);

    // Picture moderation/upload no longer happens here at all (Chris,
    // 2026-08-15) - it already ran per-slot the moment each picture was
    // chosen (see the change listeners above), and the guard earlier in
    // this function already refused to reach here if any slot is still
    // in flight, blocked, or errored. Only the bio still gets checked at
    // save time, since text moderation is fast and has no comparable
    // bandwidth cost to spread out.
    var moderationBlock = null;

    var bioCheck = data.bio
      ? AgoraModeration.checkText(data.bio, "profileBio", {}).then(function (result) {
          if (result.decision === "block" && !moderationBlock) {
            moderationBlock = { field: "Bio", logId: result.logId };
          }
        })
      : Promise.resolve();

    var savePromise = Promise.all([handleCheck, geocodePromise, bioCheck]).then(function (results) {
      if (moderationBlock) {
        throw { code: "moderation-blocked", field: moderationBlock.field, logId: moderationBlock.logId };
      }
      var snapshot = results[0];
      var coords = results[1];
      if (snapshot) {
        var taken = snapshot.docs.some(function (d) { return d.id !== currentUser.uid; });
        if (taken) {
          throw { code: "handle-taken" };
        }
      }
      // .set() below fully replaces the document, so simply omitting
      // locationLat/Lng here (when geocoding found nothing this time)
      // already drops any stale coordinates from a previous save - no
      // FieldValue.delete() needed.
      if (coords) {
        data.locationLat = coords.lat;
        data.locationLng = coords.lng;
      }
      return AgoraDB.collection("profiles").doc(currentUser.uid).set(data);
    }).then(function () {
      // Region lives in a separate, owner-only-readable document rather
      // than the world-readable profile doc above - it's private data
      // (only ever used to disambiguate the geocoding query), not just
      // UI-hidden data. See firestore.rules' profiles/{uid}/private match.
      return AgoraDB.collection("profiles").doc(currentUser.uid)
        .collection("private").doc("data").set({ region: regionValue });
    });

    // 30s deadline on the chain above (handle check, geocoding, bio
    // moderation, both Firestore writes) - see withTimeout()'s own comment
    // for why none of those pieces are individually guaranteed to ever
    // settle on a bad connection. Back down from the 60s this briefly grew
    // to (Chris, 2026-08-15) - picture uploads no longer count against
    // this deadline at all now that they run on the spot instead of being
    // bundled into Save, so the original, tighter budget is realistic
    // again for what's actually left in this chain.
    withTimeout(savePromise, 30000,
      "Saving is taking longer than expected. Please check your connection and try again."
    ).then(function () {
      window.location.href = "member.html?uid=" + encodeURIComponent(currentUser.uid);
    }).catch(function (err) {
      submitBtn.disabled = false;
      statusEl.hidden = true;
      if (err.code === "moderation-blocked") {
        AgoraModeration.showBlocked(errorEl, err.logId,
          err.field + " didn't pass Agora's content filter, so nothing was saved. ");
        return;
      }
      showError(err.code === "handle-taken"
        ? "That handle is already taken – please choose another."
        : err.message);
    });
  });

  function deleteCurrentUserWithReauth() {
    return currentUser.delete().catch(function (err) {
      if (err.code !== "auth/requires-recent-login") throw err;
      var providerId = currentUser.providerData[0] && currentUser.providerData[0].providerId;
      var provider = providerId === "google.com" ? agoraGoogleProvider
        : providerId === "twitter.com" ? agoraTwitterProvider
        : null;
      if (!provider) {
        throw new Error("For security, please sign out and sign back in, then try again right away.");
      }
      return currentUser.reauthenticateWithPopup(provider).then(function () {
        return currentUser.delete();
      });
    });
  }

  cancelSignupLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (!currentUser || existingDoc) return;
    if (!window.confirm("Cancel and delete this account? You can always sign up again later.")) return;

    deleteCurrentUserWithReauth().then(function () {
      window.location.href = "index.html";
    }).catch(function (err) {
      window.alert("Something went wrong: " + err.message);
    });
  });
})();

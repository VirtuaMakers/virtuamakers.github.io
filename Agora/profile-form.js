// Drives create-profile.html: sign-in gate, Kind selection, pre-fill for
// editing an existing profile, and the Firestore write on submit.

(function () {
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
  // The URL already on the profile for each picture slot, kept separate
  // from the file inputs (which only ever hold a *new* file the member is
  // uploading) - unchanged slots fall back to this on save.
  var existingPictureUrls = [1, 2, 3, 4, 5].map(function () { return ""; });

  var MAX_PICTURE_BYTES = 5 * 1024 * 1024;

  pictureInputs.forEach(function (input, i) {
    input.addEventListener("change", function () {
      var file = input.files[0];
      if (!file) return;
      // A newly chosen file replaces whatever was there, so a pending
      // "remove the existing picture" request no longer makes sense.
      pictureRemoveCheckboxes[i].checked = false;
      pictureRemoveWraps[i].hidden = true;
      var reader = new FileReader();
      reader.onload = function () {
        pictureThumbs[i].src = reader.result;
        pictureThumbs[i].hidden = false;
      };
      reader.readAsDataURL(file);
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

    for (var pi = 0; pi < pictureInputs.length; pi++) {
      var pictureFile = pictureInputs[pi].files[0];
      if (!pictureFile) continue;
      if (pictureFile.size > MAX_PICTURE_BYTES) {
        showError("Picture " + (pi + 1) + " is too large - please choose a file under 5MB.");
        return;
      }
      if (!/^image\//.test(pictureFile.type)) {
        showError("Picture " + (pi + 1) + " isn't an image file.");
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
      // Placeholder values - a slot with a newly chosen file gets its real
      // Storage download URL filled in below, after upload finishes. A slot
      // with "Remove this picture" checked clears to ""; anything else
      // keeps whatever was already saved for that slot.
      picture1: pictureRemoveCheckboxes[0].checked ? "" : existingPictureUrls[0],
      picture2: pictureRemoveCheckboxes[1].checked ? "" : existingPictureUrls[1],
      picture3: pictureRemoveCheckboxes[2].checked ? "" : existingPictureUrls[2],
      picture4: pictureRemoveCheckboxes[3].checked ? "" : existingPictureUrls[3],
      picture5: pictureRemoveCheckboxes[4].checked ? "" : existingPictureUrls[4],
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

    // Moderation runs before anything is actually uploaded/saved. A block
    // anywhere aborts the whole save (same all-or-nothing behavior as the
    // synchronous size/type checks above) - merely flagged content still
    // goes through the normal upload/write, just logged + emailed to Chris
    // server-side.
    var moderationBlock = null;

    var bioCheck = data.bio
      ? AgoraModeration.checkText(data.bio, "profileBio", {}).then(function (result) {
          if (result.decision === "block" && !moderationBlock) {
            moderationBlock = { field: "Bio", logId: result.logId };
          }
        })
      : Promise.resolve();

    // A slot with no newly chosen file resolves to null immediately - only
    // slots the member actually picked a new picture for touch Storage.
    var picturePromises = pictureInputs.map(function (input, i) {
      var file = input.files[0];
      if (!file) return Promise.resolve(null);
      return AgoraModeration.checkImage(file, i + 1).then(function (result) {
        if (result.decision === "block") {
          if (!moderationBlock) moderationBlock = { field: "Picture " + (i + 1), logId: result.logId };
          return null;
        }
        return uploadPicture(currentUser.uid, i + 1, file);
      });
    });

    var savePromise = Promise.all([handleCheck, geocodePromise, bioCheck].concat(picturePromises)).then(function (results) {
      if (moderationBlock) {
        throw { code: "moderation-blocked", field: moderationBlock.field, logId: moderationBlock.logId };
      }
      var snapshot = results[0];
      var coords = results[1];
      var pictureUrls = results.slice(3);
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
      pictureUrls.forEach(function (url, i) {
        if (url) data["picture" + (i + 1)] = url;
      });
      return AgoraDB.collection("profiles").doc(currentUser.uid).set(data);
    }).then(function () {
      // Region lives in a separate, owner-only-readable document rather
      // than the world-readable profile doc above - it's private data
      // (only ever used to disambiguate the geocoding query), not just
      // UI-hidden data. See firestore.rules' profiles/{uid}/private match.
      return AgoraDB.collection("profiles").doc(currentUser.uid)
        .collection("private").doc("data").set({ region: regionValue });
    });

    // 60s deadline on the whole chain above (moderation checks, picture
    // uploads, both Firestore writes) - see withTimeout()'s own comment for
    // why none of those pieces are individually guaranteed to ever settle
    // on a bad connection. Originally 30s, raised (Chris, 2026-08-15) after
    // a save with 5 full-size pictures (up to 5MB each, the Storage cap)
    // genuinely needed more than that on an ordinary home connection -
    // moderation's own upload cost was separately cut way down by
    // resizeForModeration() in moderation-client.js, but the real Storage
    // uploads still send the original files at full size, so this alone
    // wasn't enough to guarantee 30s was ever realistic for 5 pictures.
    withTimeout(savePromise, 60000,
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

// Drives create-profile.html: sign-in gate, Kind selection, pre-fill for
// editing an existing profile, and the Firestore write on submit.

(function () {
  var signedOutNotice = document.getElementById("signed-out-notice");
  var formWrap = document.getElementById("profile-form-wrap");
  var kindIntro = document.getElementById("kind-intro");
  var kindSelector = document.getElementById("kind-selector");
  var kindButtons = document.querySelectorAll(".kind-option");
  var formIntro = document.getElementById("form-intro");
  var form = document.getElementById("profile-form");
  var formTitle = document.getElementById("form-title");
  var dateLabel = document.getElementById("field-date-label");
  var dateInput = document.getElementById("field-date");
  var dateVisible = document.getElementById("field-date-visible");
  var dateVisibleLabel = document.getElementById("field-date-visible-label");
  var dateInlineError = document.getElementById("field-date-inline-error");
  var cyberizationWrap = document.getElementById("field-cyberization-wrap");
  var cyberizationInput = document.getElementById("field-cyberization-date");
  var cyberizationVisible = document.getElementById("field-cyberization-visible");
  var cyberizationInlineError = document.getElementById("field-cyberization-inline-error");
  var cityInput = document.getElementById("field-city");
  var countryInput = document.getElementById("field-country");
  var locationVisible = document.getElementById("field-location-visible");
  var handleInput = document.getElementById("field-handle");
  var portalWrap = document.getElementById("field-portal-wrap");
  var pictureInputs = [1, 2, 3, 4, 5].map(function (n) {
    return document.getElementById("field-picture-" + n);
  });
  var socialInputs = [1, 2, 3].map(function (n) {
    return document.getElementById("field-social-" + n);
  });
  var emailInput = document.getElementById("field-email");
  var emailVisible = document.getElementById("field-email-visible");
  var tosInput = document.getElementById("field-tos");
  var errorEl = document.getElementById("form-error");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("form-submit");
  var dangerZone = document.getElementById("danger-zone");
  var cancelSignupWrap = document.getElementById("cancel-signup-wrap");
  var cancelSignupLink = document.getElementById("cancel-signup-link");

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

  function fillForm(data) {
    document.getElementById("field-name").value = data.name || "";
    handleInput.value = data.handle || "";
    document.getElementById("field-prefer-handle").checked = !!data.preferHandle;
    dateInput.value = data.date || "";
    dateVisible.checked = data.showDate !== false;
    cyberizationInput.value = data.cyberizationDate || "";
    cyberizationVisible.checked = data.showCyberizationDate !== false;
    cityInput.value = data.city || "";
    countryInput.value = data.country || "";
    locationVisible.checked = data.showLocation !== false;
    document.getElementById("field-orgs").value = data.organizations || "";
    pictureInputs.forEach(function (input, i) {
      input.value = data["picture" + (i + 1)] || "";
    });
    document.getElementById("field-bio").value = data.bio || "";
    document.getElementById("field-link").value = data.link || "";
    document.getElementById("field-portal").value = data.portal || "";
    socialInputs.forEach(function (input, i) {
      input.value = data["social" + (i + 1)] || "";
    });
    emailInput.value = data.email || "";
    emailVisible.checked = data.showEmail !== false;
    // Already agreed once, as part of getting this profile created in the
    // first place - don't make a returning member re-check this on every
    // edit. Profiles that predate this field get asked once, on their next
    // edit, same as a first-time signup.
    tosInput.checked = !!data.tosAgreedAt;
  }

  // ISO 8601 date input: full YYYY-MM-DD, or a partial YYYY-MM / YYYY.
  // Returns the parsed { year, month, day } or null if the format doesn't match.
  function parseDateInput(value) {
    var m = value.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    if (!m) return null;
    var year = parseInt(m[1], 10);
    var month = m[2] ? parseInt(m[2], 10) : null;
    var day = m[3] ? parseInt(m[3], 10) : null;
    if (month !== null && (month < 1 || month > 12)) return null;
    if (day !== null && (day < 1 || day > 31)) return null;
    return { year: year, month: month, day: day };
  }

  function humanizeDate(parsed) {
    if (parsed.day) return MONTH_NAMES[parsed.month - 1] + " " + parsed.day + ", " + parsed.year;
    if (parsed.month) return MONTH_NAMES[parsed.month - 1] + " " + parsed.year;
    return String(parsed.year);
  }

  // Auto-inserts the YYYY-MM-DD dashes as the member types digits, so
  // everyone's dates use the exact same separator without having to know
  // the format up front - and flags an out-of-range month/day immediately,
  // rather than waiting for Save.
  function attachDateMask(input, inlineError) {
    input.addEventListener("input", function () {
      var digits = input.value.replace(/\D/g, "").slice(0, 8);
      var formatted = digits;
      if (digits.length > 6) {
        formatted = digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6);
      } else if (digits.length > 4) {
        formatted = digits.slice(0, 4) + "-" + digits.slice(4);
      }
      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);

      var month = digits.length >= 6 ? parseInt(digits.slice(4, 6), 10) : null;
      var day = digits.length >= 8 ? parseInt(digits.slice(6, 8), 10) : null;
      if (month !== null && (month < 1 || month > 12)) {
        inlineError.textContent = "Month must be between 01 and 12.";
        inlineError.hidden = false;
      } else if (day !== null && (day < 1 || day > 31)) {
        inlineError.textContent = "Day must be between 01 and 31.";
        inlineError.hidden = false;
      } else {
        inlineError.hidden = true;
      }
    });
  }

  attachDateMask(dateInput, dateInlineError);
  attachDateMask(cyberizationInput, cyberizationInlineError);

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (!user) {
      signedOutNotice.hidden = false;
      formWrap.hidden = true;
      return;
    }

    signedOutNotice.hidden = true;
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
        fillForm(existingDoc);
        selectKind(existingDoc.kind || "Human");
        dangerZone.hidden = false;
        cancelSignupWrap.hidden = true;
      } else {
        document.getElementById("field-name").value = user.displayName || "";
        document.getElementById("field-email").value = user.email || "";
        // No profile yet - an account only counts as accepted once one's
        // saved (required fields + Terms of Service), so offer a clean way
        // to back out rather than leaving a signed-in, permanently
        // unfinished account behind.
        cancelSignupWrap.hidden = false;
      }
      formWrap.hidden = false;
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
    var rawDate = dateInput.value.trim();
    if (!rawDate) {
      showError("Please enter your " + dateName + ".");
      return;
    }
    var parsedDate = parseDateInput(rawDate);
    if (!parsedDate) {
      showError("Please enter your " + dateName + " as YYYY-MM-DD (or just YYYY, or YYYY-MM).");
      return;
    }

    var rawCyberizationDate = "";
    var parsedCyberizationDate = null;
    if (selectedKind === "Cyborg") {
      rawCyberizationDate = cyberizationInput.value.trim();
      if (!rawCyberizationDate) {
        showError("Please enter your Cyberization Date.");
        return;
      }
      parsedCyberizationDate = parseDateInput(rawCyberizationDate);
      if (!parsedCyberizationDate) {
        showError("Please enter your Cyberization Date as YYYY-MM-DD (or just YYYY, or YYYY-MM).");
        return;
      }
    }

    var city = cityInput.value.trim();
    var country = countryInput.value;

    var email = emailInput.value.trim();
    if (!email) {
      showError("Please enter your Email.");
      return;
    }

    if (!tosInput.checked) {
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
      organizations: document.getElementById("field-orgs").value.trim(),
      picture1: pictureInputs[0].value.trim(),
      picture2: pictureInputs[1].value.trim(),
      picture3: pictureInputs[2].value.trim(),
      picture4: pictureInputs[3].value.trim(),
      picture5: pictureInputs[4].value.trim(),
      bio: document.getElementById("field-bio").value.trim(),
      link: linkValue,
      portal: portalValue,
      social1: socialValues[0],
      social2: socialValues[1],
      social3: socialValues[2],
      socialsFlagged: socialsFlagged,
      email: email,
      showEmail: emailVisible.checked,
      friends: existingDoc && typeof existingDoc.friends === "number" ? existingDoc.friends : 1,
      status: existingDoc ? existingDoc.status : "active",
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

    var confirmLines = [dateName + ": " + humanizeDate(parsedDate)];
    if (parsedCyberizationDate) {
      confirmLines.push("Cyberization Date: " + humanizeDate(parsedCyberizationDate));
    }
    if (!window.confirm("You entered —\n" + confirmLines.join("\n") + "\nIs that correct?")) return;

    submitBtn.disabled = true;
    statusEl.hidden = false;

    var handleCheck = handle
      ? AgoraDB.collection("profiles").where("handle", "==", handle).get()
      : Promise.resolve(null);

    handleCheck.then(function (snapshot) {
      if (snapshot) {
        var taken = snapshot.docs.some(function (d) { return d.id !== currentUser.uid; });
        if (taken) {
          throw { code: "handle-taken" };
        }
      }
      return AgoraDB.collection("profiles").doc(currentUser.uid).set(data);
    }).then(function () {
      window.location.href = "member.html?uid=" + encodeURIComponent(currentUser.uid);
    }).catch(function (err) {
      submitBtn.disabled = false;
      statusEl.hidden = true;
      showError(err.code === "handle-taken"
        ? "That handle is already taken – please choose another."
        : err.message);
    });
  });

  cancelSignupLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (!currentUser || existingDoc) return;
    if (!window.confirm("Cancel and delete this account? You can always sign up again later.")) return;

    currentUser.delete().then(function () {
      window.location.href = "index.html";
    }).catch(function (err) {
      window.alert("Something went wrong: " + err.message);
    });
  });
})();

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
  var locationInput = document.getElementById("field-location");
  var handleInput = document.getElementById("field-handle");
  var portalWrap = document.getElementById("field-portal-wrap");
  var pictureInput = document.getElementById("field-picture");
  var pictureUpload = document.getElementById("field-picture-upload");
  var pictureUploadStatus = document.getElementById("field-picture-upload-status");
  var errorEl = document.getElementById("form-error");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("form-submit");
  var dangerZone = document.getElementById("danger-zone");

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
    dateLabel.textContent = dateName;
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

  // Uploads go to Firebase Storage, which only exists once the project is
  // on the Blaze plan and this has been deployed. Until then this fails
  // and members fall back to pasting a Picture URL directly, same as today.
  if (pictureUpload) {
    pictureUpload.addEventListener("change", function () {
      var file = pictureUpload.files[0];
      if (!file || !currentUser) return;

      if (typeof firebase === "undefined" || !firebase.storage) {
        pictureUploadStatus.textContent = "Uploads aren't available yet — please paste a link above instead.";
        pictureUploadStatus.hidden = false;
        return;
      }

      pictureUploadStatus.textContent = "Uploading…";
      pictureUploadStatus.hidden = false;

      var ref = firebase.storage().ref("profile-pictures/" + currentUser.uid + "/" + file.name);
      ref.put(file)
        .then(function (snapshot) { return snapshot.ref.getDownloadURL(); })
        .then(function (url) {
          pictureInput.value = url;
          pictureUploadStatus.textContent = "Uploaded! The Picture URL field above has been filled in.";
        })
        .catch(function () {
          pictureUploadStatus.textContent = "Uploads aren't available yet — please paste a link above instead.";
        });
    });
  }

  function fillForm(data) {
    document.getElementById("field-name").value = data.name || "";
    handleInput.value = data.handle || "";
    document.getElementById("field-prefer-handle").checked = !!data.preferHandle;
    dateInput.value = data.date || "";
    dateVisible.checked = data.showDate !== false;
    cyberizationInput.value = data.cyberizationDate || "";
    cyberizationVisible.checked = data.showCyberizationDate !== false;
    locationInput.value = data.location || "";
    document.getElementById("field-orgs").value = data.organizations || "";
    document.getElementById("field-picture").value = data.picture || "";
    document.getElementById("field-bio").value = data.bio || "";
    document.getElementById("field-link").value = data.link || "";
    document.getElementById("field-portal").value = data.portal || "";
    document.getElementById("field-socials").value = data.socials || "";
    document.getElementById("field-email").value = data.email || "";
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

  // Standardizes common "United States" spellings to "U.S.A." State/territory
  // names and other countries are left as the member wrote them, for now.
  function normalizeLocation(value) {
    if (!value) return value;
    return value.replace(/\b(united states of america|united states|u\.s\.a\.?|u\.s\.?|usa|us)\s*$/i, "U.S.A.");
  }

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
      } else {
        document.getElementById("field-name").value = user.displayName || "";
        document.getElementById("field-email").value = user.email || "";
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

    var handle = handleInput.value.trim();

    var data = {
      name: document.getElementById("field-name").value.trim(),
      handle: handle,
      preferHandle: document.getElementById("field-prefer-handle").checked,
      kind: selectedKind,
      date: rawDate,
      showDate: dateVisible.checked,
      cyberizationDate: selectedKind === "Cyborg" ? rawCyberizationDate : "",
      showCyberizationDate: selectedKind === "Cyborg" ? cyberizationVisible.checked : true,
      location: normalizeLocation(locationInput.value.trim()),
      organizations: document.getElementById("field-orgs").value.trim(),
      picture: document.getElementById("field-picture").value.trim(),
      bio: document.getElementById("field-bio").value.trim(),
      link: document.getElementById("field-link").value.trim(),
      portal: selectedKind === "AI" ? document.getElementById("field-portal").value.trim() : "",
      socials: document.getElementById("field-socials").value.trim(),
      email: document.getElementById("field-email").value.trim(),
      friends: existingDoc && typeof existingDoc.friends === "number" ? existingDoc.friends : 1,
      status: existingDoc ? existingDoc.status : "active",
      createdAt: existingDoc && existingDoc.createdAt
        ? existingDoc.createdAt
        : firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (!data.name || !data.bio) {
      showError("Name and Bio are required.");
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

  document.getElementById("leave-btn").addEventListener("click", function () {
    if (!window.confirm("Leave Agora 🌐? This permanently deletes your profile and your account. This can't be undone.")) return;
    var user = currentUser;
    AgoraDB.collection("profiles").doc(user.uid).delete()
      .then(function () { return user.delete(); })
      .then(function () {
        window.location.href = "index.html";
      })
      .catch(function (err) {
        if (err.code === "auth/requires-recent-login") {
          window.alert("For security, please sign out and sign back in, then try leaving again right away.");
        } else {
          window.alert("Something went wrong: " + err.message);
        }
      });
  });
})();

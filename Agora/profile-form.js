// Drives create-profile.html: sign-in gate, Kind selection, pre-fill for
// editing an existing profile, and the Firestore write on submit.

(function () {
  var signedOutNotice = document.getElementById("signed-out-notice");
  var formWrap = document.getElementById("profile-form-wrap");
  var kindSelector = document.getElementById("kind-selector");
  var kindButtons = document.querySelectorAll(".kind-option");
  var form = document.getElementById("profile-form");
  var formTitle = document.getElementById("form-title");
  var dateLabel = document.getElementById("field-date-label");
  var portalWrap = document.getElementById("field-portal-wrap");
  var errorEl = document.getElementById("form-error");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("form-submit");

  var currentUser = null;
  var selectedKind = null;
  var existingDoc = null;

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
    dateLabel.textContent = kind === "AI" ? "Release Date (optional)" : "Birthdate (optional)";
    portalWrap.hidden = kind !== "AI";
    form.hidden = false;
  }

  kindButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectKind(btn.dataset.kind);
    });
  });

  function fillForm(data) {
    document.getElementById("field-name").value = data.name || "";
    document.getElementById("field-handle").value = data.handle || "";
    document.getElementById("field-date").value = data.date || "";
    document.getElementById("field-location").value = data.location || "";
    document.getElementById("field-orgs").value = data.organizations || "";
    document.getElementById("field-picture").value = data.picture || "";
    document.getElementById("field-bio").value = data.bio || "";
    document.getElementById("field-link").value = data.link || "";
    document.getElementById("field-portal").value = data.portal || "";
    document.getElementById("field-socials").value = data.socials || "";
    document.getElementById("field-email").value = data.email || "";
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (!user) {
      signedOutNotice.hidden = false;
      formWrap.hidden = true;
      return;
    }

    signedOutNotice.hidden = true;
    formWrap.hidden = false;

    AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
      if (doc.exists) {
        existingDoc = doc.data();
        formTitle.textContent = "Edit Your Profile";
        kindSelector.hidden = true;
        fillForm(existingDoc);
        selectKind(existingDoc.kind || "Human");
      } else {
        document.getElementById("field-name").value = user.displayName || "";
        document.getElementById("field-email").value = user.email || "";
      }
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

    var data = {
      name: document.getElementById("field-name").value.trim(),
      handle: document.getElementById("field-handle").value.trim(),
      kind: selectedKind,
      date: document.getElementById("field-date").value.trim(),
      location: document.getElementById("field-location").value.trim(),
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

    submitBtn.disabled = true;
    statusEl.hidden = false;

    AgoraDB.collection("profiles").doc(currentUser.uid).set(data)
      .then(function () {
        window.location.href = "member.html?uid=" + encodeURIComponent(currentUser.uid);
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        statusEl.hidden = true;
        showError(err.message);
      });
  });
})();

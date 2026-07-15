// Drives member.html: loads a profile by ?uid= from Firestore, renders it,
// and shows admin (suspend/delete) or owner (edit) controls when relevant.

(function () {
  var ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

  var params = new URLSearchParams(window.location.search);
  var uid = params.get("uid");

  var statusNotice = document.getElementById("member-status-notice");
  var content = document.getElementById("member-content");
  var adminActions = document.getElementById("admin-actions");
  var ownerEditLink = document.getElementById("owner-edit-link");
  var ownerActions = document.getElementById("owner-actions");

  var profileData = null;
  var currentUser = null;

  function showNotice(message) {
    statusNotice.textContent = message;
    statusNotice.hidden = false;
    content.hidden = true;
  }

  function setOptionalField(wrapId, value) {
    var wrap = document.getElementById(wrapId);
    if (!value) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
  }

  function render(data) {
    document.getElementById("member-name").textContent = data.name || "Member";
    if (data.handle) {
      document.getElementById("member-handle").textContent = "Handle: " + data.handle;
      document.getElementById("member-handle").hidden = false;
    }
    if (data.picture) {
      document.getElementById("member-avatar").src = data.picture;
      document.getElementById("member-avatar").alt = data.name || "";
    }
    document.getElementById("member-kind").textContent = data.kind || "";

    document.getElementById("member-date-label").textContent =
      data.kind === "AI" ? "Release Date" : "Birthdate";
    setOptionalField("member-date-wrap", data.date);
    document.getElementById("member-date").textContent = data.date || "";

    setOptionalField("member-location-wrap", data.location);
    document.getElementById("member-location").textContent = data.location || "";

    setOptionalField("member-orgs-wrap", data.organizations);
    document.getElementById("member-orgs").textContent = data.organizations || "";

    document.getElementById("member-bio").textContent = data.bio || "";

    setOptionalField("member-link-wrap", data.link);
    if (data.link) {
      document.getElementById("member-link").href = data.link;
      document.getElementById("member-link").textContent = data.link.replace(/^https?:\/\//, "");
    }

    setOptionalField("member-portal-wrap", data.kind === "AI" ? data.portal : "");
    if (data.portal) {
      document.getElementById("member-portal").href = data.portal;
      document.getElementById("member-portal").textContent = data.portal.replace(/^https?:\/\//, "");
    }

    setOptionalField("member-socials-wrap", data.socials);
    document.getElementById("member-socials").textContent = data.socials || "";

    setOptionalField("member-email-wrap", data.email);
    if (data.email) {
      document.getElementById("member-email").href = "mailto:" + data.email;
      document.getElementById("member-email").textContent = data.email;
    }

    document.getElementById("member-friends").textContent = data.friends != null ? data.friends : "1";

    content.hidden = false;
  }

  function refreshControls() {
    if (!currentUser || !profileData) {
      adminActions.hidden = true;
      ownerEditLink.hidden = true;
      ownerActions.hidden = true;
      return;
    }

    var isOwner = currentUser.uid === uid;
    var isAdmin = currentUser.email === ADMIN_EMAIL;

    ownerEditLink.hidden = !isOwner;
    ownerActions.hidden = !isOwner;
    adminActions.hidden = !(isAdmin && !isOwner);

    document.getElementById("suspend-btn").textContent =
      profileData.status === "suspended" ? "Reinstate" : "Suspend";
  }

  function loadProfile() {
    if (!uid) {
      showNotice("No member specified.");
      return;
    }

    AgoraDB.collection("profiles").doc(uid).get().then(function (doc) {
      if (!doc.exists) {
        showNotice("This profile doesn't exist.");
        return;
      }
      profileData = doc.data();

      var viewerIsOwnerOrAdmin = currentUser &&
        (currentUser.uid === uid || currentUser.email === ADMIN_EMAIL);

      if (profileData.status === "suspended" && !viewerIsOwnerOrAdmin) {
        showNotice("This profile is currently suspended.");
        return;
      }

      render(profileData);
      refreshControls();
    });
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (profileData) refreshControls();
    loadProfile();
  });

  document.getElementById("suspend-btn").addEventListener("click", function () {
    var newStatus = profileData.status === "suspended" ? "active" : "suspended";
    AgoraDB.collection("profiles").doc(uid).update({ status: newStatus }).then(function () {
      profileData.status = newStatus;
      refreshControls();
    });
  });

  document.getElementById("delete-btn").addEventListener("click", function () {
    if (!window.confirm("Delete this member's profile permanently? This can't be undone.")) return;
    AgoraDB.collection("profiles").doc(uid).delete().then(function () {
      window.location.href = "index.html";
    });
  });

  document.getElementById("leave-btn").addEventListener("click", function () {
    if (!window.confirm("Leave Agora 🌐? This deletes your profile and your account. This can't be undone.")) return;
    var user = currentUser;
    AgoraDB.collection("profiles").doc(uid).delete()
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

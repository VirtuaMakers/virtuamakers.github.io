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

  var profileData = null;
  var currentUser = null;

  // Bio allows a small, deliberately-expanding allowlist of HTML tags (see
  // bio-tags.js) - sanitized here at render time rather than at save time,
  // so widening the allowlist later makes older bios light up with newly
  // allowed tags automatically. Force target/rel on any link a member
  // includes, matching how every other outbound link on the site behaves.
  if (typeof DOMPurify !== "undefined") {
    DOMPurify.addHook("afterSanitizeAttributes", function (node) {
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

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
    var preferringHandle = !!(data.preferHandle && data.handle);
    document.getElementById("member-name").textContent =
      preferringHandle ? data.handle : (data.name || "Member");
    if (data.handle && !preferringHandle) {
      document.getElementById("member-handle").textContent = "Handle: " + data.handle;
      document.getElementById("member-handle").hidden = false;
    } else {
      document.getElementById("member-handle").hidden = true;
    }

    var avatarImg = document.getElementById("member-avatar");
    var avatarEmpty = document.getElementById("member-avatar-empty");
    if (data.picture1) {
      avatarImg.src = data.picture1;
      avatarImg.alt = data.name || "";
      avatarImg.hidden = false;
      avatarEmpty.hidden = true;
    } else {
      avatarImg.hidden = true;
      avatarEmpty.hidden = false;
    }

    document.getElementById("member-kind").textContent = data.kind || "";

    document.getElementById("member-date-label").textContent =
      data.kind === "AI" ? "Release Date" : "Birthdate";
    setOptionalField("member-date-wrap", data.showDate !== false ? data.date : "");
    document.getElementById("member-date").textContent = data.date || "";

    setOptionalField("member-cyberization-wrap",
      (data.kind === "Cyborg" && data.showCyberizationDate !== false) ? data.cyberizationDate : "");
    document.getElementById("member-cyberization-date").textContent = data.cyberizationDate || "";

    var locationText = (data.city && data.country)
      ? (data.city + ", " + data.country)
      : (data.city || data.country || data.location || "");
    setOptionalField("member-location-wrap", data.showLocation !== false ? locationText : "");
    document.getElementById("member-location").textContent = locationText;

    setOptionalField("member-orgs-wrap", data.organizations);
    document.getElementById("member-orgs").textContent = data.organizations || "";

    setOptionalField("member-bio-wrap", data.bio);
    var bioEl = document.getElementById("member-bio");
    if (data.bio && typeof DOMPurify !== "undefined" && typeof AgoraBioTags !== "undefined") {
      bioEl.innerHTML = DOMPurify.sanitize(data.bio, {
        ALLOWED_TAGS: AgoraBioTags.ALLOWED_TAGS,
        ALLOWED_ATTR: AgoraBioTags.ALLOWED_ATTR,
      });
    } else {
      bioEl.textContent = data.bio || "";
    }

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

    var socials = [data.social1, data.social2, data.social3].filter(Boolean);
    setOptionalField("member-socials-wrap", socials.length ? "x" : "");
    var socialsDD = document.getElementById("member-socials");
    socialsDD.textContent = "";
    socials.forEach(function (raw, i) {
      var info = AgoraSocialFormat.format(raw);
      if (!info) return;
      var node;
      if (info.href) {
        node = document.createElement("a");
        node.href = info.href;
        node.target = "_blank";
        node.rel = "noopener noreferrer";
        node.textContent = info.label;
      } else {
        node = document.createTextNode(info.label);
      }
      socialsDD.appendChild(node);
      if (i < socials.length - 1) socialsDD.appendChild(document.createTextNode(", "));
    });

    setOptionalField("member-email-wrap", data.showEmail !== false ? data.email : "");
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
      return;
    }

    var isOwner = currentUser.uid === uid;
    var isAdmin = currentUser.email === ADMIN_EMAIL;

    ownerEditLink.hidden = !isOwner;
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

  // Both admin actions call the adminBanUser/adminDeleteUser Cloud
  // Functions first, which also lock or delete the member's actual
  // Firebase Auth login (not just their profile doc) - but those
  // functions only exist once deployed on the Blaze plan. Until then,
  // the call fails and we fall back to today's Firestore-only behavior,
  // so this file doesn't need to change again when that's deployed.
  document.getElementById("suspend-btn").addEventListener("click", function () {
    var newStatus = profileData.status === "suspended" ? "active" : "suspended";
    var disable = newStatus === "suspended";

    var viaFunction = (typeof firebase !== "undefined" && firebase.functions)
      ? firebase.functions().httpsCallable("adminBanUser")({ uid: uid, disabled: disable })
      : Promise.reject(new Error("adminBanUser not available"));

    viaFunction
      .catch(function () {
        return AgoraDB.collection("profiles").doc(uid).update({ status: newStatus });
      })
      .then(function () {
        profileData.status = newStatus;
        refreshControls();
      });
  });

  document.getElementById("delete-btn").addEventListener("click", function () {
    if (!window.confirm("Delete this member's profile permanently? This can't be undone.")) return;

    var viaFunction = (typeof firebase !== "undefined" && firebase.functions)
      ? firebase.functions().httpsCallable("adminDeleteUser")({ uid: uid })
      : Promise.reject(new Error("adminDeleteUser not available"));

    viaFunction
      .catch(function () {
        return AgoraDB.collection("profiles").doc(uid).delete();
      })
      .then(function () {
        window.location.href = "index.html";
      });
  });
})();

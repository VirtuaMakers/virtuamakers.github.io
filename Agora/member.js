// Drives member.html: loads a profile by ?uid= from Firestore, renders it,
// and shows admin (suspend/delete) or owner (edit) controls when relevant.

(function () {
  var OWNER_EMAIL = "VirtuaMakers@Outlook.com";

  var params = new URLSearchParams(window.location.search);
  var uid = params.get("uid");

  var statusNotice = document.getElementById("member-status-notice");
  var content = document.getElementById("member-content");
  var adminActions = document.getElementById("admin-actions");
  var ownerEditLink = document.getElementById("owner-edit-link");
  var adminPanel = document.getElementById("member-admin-panel");
  var adminPanelRoleValue = document.getElementById("admin-panel-role-value");
  var adminPanelMakeModerator = document.getElementById("admin-panel-make-moderator");
  var adminPanelMakeAdmin = document.getElementById("admin-panel-make-admin");
  var adminPanelRemoveRole = document.getElementById("admin-panel-remove-role");

  // Multi-admin system (Chris, 2026-08-15) - the owner (VirtuaMakers@
  // Outlook.com) is permanent and never stored anywhere; anyone else's
  // role (if any) lives in admins/{uid}, readable by themselves (see
  // firestore.rules). Fetched once per auth change and cached here rather
  // than re-fetched on every refreshControls() call.
  var viewerRole = null; // null | "moderator" | "admin" | "owner"

  function loadViewerRole() {
    if (!currentUser) {
      viewerRole = null;
      return Promise.resolve();
    }
    // Case-insensitive on purpose - matches firestore.rules' isOwner(),
    // which had the same fragile literal == comparison until this same
    // pass; Firebase Auth doesn't normalize email casing for you, so a
    // strict === here could silently hide every admin control from the
    // real owner if their account's email differs in case from this
    // exact string.
    if (currentUser.email && currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      viewerRole = "owner";
      return Promise.resolve();
    }
    return AgoraDB.collection("admins").doc(currentUser.uid).get().then(function (doc) {
      viewerRole = doc.exists ? doc.data().role : null;
    }).catch(function () {
      viewerRole = null;
    });
  }

  var profileData = null;
  var currentUser = null;
  // Invisible view counter (Chris, 2026-08-13) - internal-only metric, no
  // UI shows this. Guarded so it only fires once per page load even
  // though loadProfile() re-runs on every auth-state change (e.g. a
  // visitor signing in mid-view), not just the initial page load.
  var profileViewRecorded = false;

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

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Dates are stored as YYYY-MM-DD (or a partial YYYY-MM / YYYY) - shown
  // here as "Year Month Day" (or whatever granularity was actually
  // supplied), keeping the international Year-Month-Day ordering Chris
  // wants rather than switching to the American Month-Day-Year order -
  // just with the month spelled out instead of the raw numeric shorthand.
  function humanizeStoredDate(raw) {
    if (!raw) return "";
    var m = raw.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    if (!m) return raw;
    var year = m[1];
    var month = m[2] ? parseInt(m[2], 10) : null;
    var day = m[3] ? parseInt(m[3], 10) : null;
    if (day) return year + " " + MONTH_NAMES[month - 1] + " " + day;
    if (month) return year + " " + MONTH_NAMES[month - 1];
    return year;
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
    document.getElementById("member-date").textContent = humanizeStoredDate(data.date);

    setOptionalField("member-cyberization-wrap",
      (data.kind === "Cyborg" && data.showCyberizationDate !== false) ? data.cyberizationDate : "");
    document.getElementById("member-cyberization-date").textContent = humanizeStoredDate(data.cyberizationDate);

    var locationText = (data.city && data.country)
      ? (data.city + ", " + data.country)
      : (data.city || data.country || data.location || "");
    setOptionalField("member-location-wrap", data.showLocation !== false ? locationText : "");
    document.getElementById("member-location").textContent = locationText;

    var locationMap = document.getElementById("member-location-map");
    var locationMapHint = document.getElementById("member-location-map-hint");
    var showMap = data.showLocation !== false && data.showMap !== false
      && typeof data.locationLat === "number" && typeof data.locationLng === "number";
    if (showMap) {
      // Calibrated against world-map.svg's own viewBox (1010x666) by
      // fitting known real vs. pixel bounding boxes for a handful of
      // countries - approximate by design (a rough "which part of the
      // world" illustration, not precise geocoding), not pixel-perfect.
      var mapX = 2.80394 * data.locationLng + 477.0575;
      var mapY = -3.51028 * data.locationLat + 473.8844;
      var locationDot = document.getElementById("member-location-dot");
      locationDot.style.left = (mapX / 1010 * 100) + "%";
      locationDot.style.top = (mapY / 666 * 100) + "%";
    }
    locationMap.hidden = !showMap;
    locationMapHint.hidden = !showMap;

    setOptionalField("member-orgs-wrap", data.organizations);
    document.getElementById("member-orgs").textContent = data.organizations || "";

    var pictureUrls = [data.picture1, data.picture2, data.picture3, data.picture4, data.picture5].filter(Boolean);
    var picturesWrap = document.getElementById("member-pictures-wrap");
    var gallery = document.getElementById("member-gallery");
    var frameImg = document.getElementById("member-photo-frame-img");
    gallery.textContent = "";
    if (pictureUrls.length) {
      picturesWrap.hidden = false;
      document.getElementById("member-pictures-label").textContent =
        pictureUrls.length === 1 ? "Picture" : "Pictures";
      pictureUrls.forEach(function (url, i) {
        var thumb = document.createElement("img");
        thumb.src = url;
        thumb.alt = (data.name || "Member") + " picture " + (i + 1);
        thumb.width = 110;
        thumb.height = 110;
        thumb.loading = "lazy";
        if (i === 0) {
          thumb.classList.add("active");
          frameImg.src = url;
          frameImg.alt = thumb.alt;
        }
        thumb.addEventListener("click", function () {
          frameImg.src = url;
          frameImg.alt = thumb.alt;
          gallery.querySelectorAll("img").forEach(function (t) { t.classList.remove("active"); });
          thumb.classList.add("active");
        });
        gallery.appendChild(thumb);
      });
    } else {
      picturesWrap.hidden = true;
    }

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

    var joinedText = (data.createdAt && data.createdAt.toDate)
      ? data.createdAt.toDate().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      : "";
    setOptionalField("member-joined-wrap", joinedText);
    document.getElementById("member-joined").textContent = joinedText;

    content.hidden = false;
  }

  function refreshControls() {
    if (!currentUser || !profileData) {
      adminActions.hidden = true;
      ownerEditLink.hidden = true;
      adminPanel.hidden = true;
      return;
    }

    var isOwnProfile = currentUser.uid === uid;
    var viewerIsFullAdmin = viewerRole === "owner" || viewerRole === "admin";

    ownerEditLink.hidden = !isOwnProfile;
    adminActions.hidden = !(viewerIsFullAdmin && !isOwnProfile);

    document.getElementById("suspend-btn").textContent =
      profileData.status === "suspended" ? "Reinstate" : "Suspend";

    refreshAdminPanel(isOwnProfile);
  }

  // Owner-only (matching firestore.rules' admins/{uid} write: if isOwner())
  // - grants or revokes admin/moderator status for the profile being
  // viewed. Writes/deletes admins/{uid} directly, no Cloud Function
  // needed since the rule itself is the real enforcement.
  function refreshAdminPanel(isOwnProfile) {
    var canManageRoles = viewerRole === "owner" && !isOwnProfile;
    adminPanel.hidden = !canManageRoles;
    if (!canManageRoles) return;

    AgoraDB.collection("admins").doc(uid).get().then(function (doc) {
      var role = doc.exists ? doc.data().role : null;
      adminPanelRoleValue.textContent = role === "admin" ? "Admin"
        : role === "moderator" ? "Moderator"
        : "None";
      adminPanelMakeModerator.disabled = role === "moderator";
      adminPanelMakeAdmin.disabled = role === "admin";
      adminPanelRemoveRole.disabled = !role;
    });
  }

  function loadProfile() {
    if (!uid) {
      showNotice("No member specified.");
      return;
    }

    Promise.all([
      loadViewerRole(),
      AgoraDB.collection("profiles").doc(uid).get(),
    ]).then(function (results) {
      var doc = results[1];
      if (!doc.exists) {
        showNotice("This profile doesn't exist.");
        return;
      }
      profileData = doc.data();

      var isOwnProfile = currentUser && currentUser.uid === uid;
      var viewerIsFullAdmin = viewerRole === "owner" || viewerRole === "admin";

      if (profileData.status === "suspended" && !isOwnProfile && !viewerIsFullAdmin) {
        showNotice("This profile is currently suspended.");
        return;
      }

      render(profileData);
      refreshControls();
      updateMessageButtonVisibility();

      if (!profileViewRecorded) {
        profileViewRecorded = true;
        doc.ref.update({ profileViews: firebase.firestore.FieldValue.increment(1) }).catch(function () {});
      }
    }).catch(function () {
      // Without this, a fetch failure (e.g. a flaky connection) leaves the
      // page permanently blank - neither the profile content nor any
      // notice ever appears, with nothing telling the visitor what happened.
      showNotice("Something went wrong loading this profile - this is usually a spotty connection. Try refreshing the page.");
    });
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (profileData) refreshControls();
    loadProfile();
    watchFriendship();
    loadFriendsList();
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
    // Only suspending (not reinstating) sends the ban-notice email, so only
    // ask for a reason in that direction.
    var reason = disable ? window.prompt("Reason for suspending this member? (Included in their notice email. Leave blank to skip.)") : "";

    var viaFunction = (typeof firebase !== "undefined" && firebase.functions)
      ? firebase.functions().httpsCallable("adminBanUser")({ uid: uid, disabled: disable, reason: reason })
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
    var reason = window.prompt("Reason for deleting this member's account? (Included in their notice email. Leave blank to skip.)");

    var viaFunction = (typeof firebase !== "undefined" && firebase.functions)
      ? firebase.functions().httpsCallable("adminDeleteUser")({ uid: uid, reason: reason })
      : Promise.reject(new Error("adminDeleteUser not available"));

    viaFunction
      .catch(function () {
        return AgoraDB.collection("profiles").doc(uid).delete();
      })
      .then(function () {
        window.location.href = "index.html";
      });
  });

  // Admin Panel (owner-only) - grants or revokes this profile's role.
  // Direct Firestore writes, no Cloud Function: firestore.rules' own
  // admins/{uid} write: if isOwner() is the actual enforcement.
  function setRole(role) {
    AgoraDB.collection("admins").doc(uid).set({
      role: role,
      grantedAt: firebase.firestore.FieldValue.serverTimestamp(),
      grantedBy: currentUser.uid,
    }).then(function () {
      refreshAdminPanel(false);
    });
  }

  adminPanelMakeModerator.addEventListener("click", function () { setRole("moderator"); });
  adminPanelMakeAdmin.addEventListener("click", function () { setRole("admin"); });
  adminPanelRemoveRole.addEventListener("click", function () {
    AgoraDB.collection("admins").doc(uid).delete().then(function () {
      refreshAdminPanel(false);
    });
  });

  // --- Wall + Dialogs (Communiqués 📨) -------------------------------------
  // Both are member-only per firestore.rules: visible to any signed-in
  // Agora visitor viewing this profile, not just its owner, and never to
  // signed-out visitors.

  var C = CommuniquesCommon;
  var communiquesWrap = document.getElementById("member-communiques");
  var communiquesSignedOutNotice = document.getElementById("communiques-signed-out-notice");

  document.getElementById("communiques-signin-prompt").addEventListener("click", function (e) {
    e.preventDefault();
    C.openSignInModal();
  });

  var wallPostHint = document.getElementById("wall-post-hint");
  if (wallPostHint && typeof AgoraBioTags !== "undefined") {
    wallPostHint.textContent = AgoraBioTags.hint;
  }

  var wallController = C.createWallController(uid, function () { return currentUser; });

  // --- Dialogs ---------------------------------------------------------
  // Messaging is open by default (Chris, 2026-08-06) - any signed-in
  // member can message any other, via the "Dialog" button below, unless
  // the profile being viewed has opted into requiring an accepted
  // friendship first (requireFriendToMessage, set on create-profile.html).
  // This section itself stays a friends-only quick-access convenience -
  // a search over your own friends (populated by loadFriendsList() below)
  // rather than a list of every conversation you have - so it's still
  // hidden until you have at least one accepted friend. Messaging anyone
  // else goes through the "Dialog" button on their own profile instead.

  var dialogsSection = document.getElementById("member-dialogs");
  var dialogsSearch = document.getElementById("dialogs-friend-search");
  var dialogsResults = document.getElementById("dialogs-friend-results");
  var messageBtn = document.getElementById("message-btn");

  function updateMessageButtonVisibility() {
    if (!currentUser || !profileData || !uid || currentUser.uid === uid) {
      messageBtn.hidden = true;
      return;
    }
    var isFriend = !document.getElementById("friend-status-accepted").hidden;
    messageBtn.hidden = !!profileData.requireFriendToMessage && !isFriend;
  }

  function renderDialogsSearchResults(query) {
    dialogsResults.textContent = "";
    var q = query.trim().toLowerCase();
    var matches = q
      ? friendsCache.filter(function (f) { return f.name.toLowerCase().indexOf(q) !== -1; })
      : friendsCache;
    matches.forEach(function (f) {
      var item = document.createElement("a");
      item.className = "dm-item";
      item.href = "member.html?uid=" + encodeURIComponent(f.uid);
      item.textContent = f.name;
      dialogsResults.appendChild(item);
    });
  }

  dialogsSearch.addEventListener("input", function () {
    renderDialogsSearchResults(dialogsSearch.value);
  });

  messageBtn.addEventListener("click", function () {
    if (!currentUser || !profileData) return;
    var otherName = (profileData.preferHandle && profileData.handle)
      ? profileData.handle : (profileData.name || profileData.handle || "Member");
    if (typeof AgoraIMWindow !== "undefined") {
      AgoraIMWindow.open(currentUser, uid, otherName);
    } else {
      C.startOrOpenDialog(currentUser, uid, otherName).then(function (conversationId) {
        window.location.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);
      });
    }
  });

  agoraOnAuthChange(function (user) {
    var signedOut = !user;
    communiquesSignedOutNotice.hidden = !signedOut;
    communiquesWrap.hidden = signedOut;
    if (user && uid) {
      wallController.loadWall();
    }
  });

  // --- Friends 🙂 ------------------------------------------------------
  // Unlimited, mutual, and private: a pending request (and even an
  // accepted friendship) is only readable by its two participants per
  // firestore.rules, so this page can only ever show *your own*
  // relationship to the profile you're viewing, or *your own* full
  // friends list when you're viewing your own profile - never someone
  // else's friends list from their page.

  var friendActions = document.getElementById("friend-actions");
  var friendAddBtn = document.getElementById("friend-add-btn");
  var friendStatusSent = document.getElementById("friend-status-sent");
  var friendStatusReceived = document.getElementById("friend-status-received");
  var friendStatusAccepted = document.getElementById("friend-status-accepted");
  var friendActionsError = document.getElementById("friend-actions-error");
  var friendsWrap = document.getElementById("member-friends-wrap");
  var friendsList = document.getElementById("friends-list");
  var friendsEmpty = document.getElementById("friends-empty");
  var unsubscribeFriendship = null;
  var friendsCache = [];

  // Every friend-action write used to have no .catch() at all - a
  // permission-denied or network failure just silently did nothing, with
  // no error and no clue why (same failure shape as the "Loading-failure
  // hardening" fix elsewhere in this codebase). Every button below now
  // disables itself while its write is in flight and surfaces any error
  // here instead of failing invisibly.
  function runFriendAction(button, promise) {
    friendActionsError.hidden = true;
    button.disabled = true;
    promise.catch(function (err) {
      friendActionsError.textContent = err.message;
      friendActionsError.hidden = false;
    }).then(function () {
      button.disabled = false;
    });
  }

  function friendshipIdFor(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  function friendshipRef() {
    return AgoraDB.collection("friendships").doc(friendshipIdFor(currentUser.uid, uid));
  }

  function renderFriendActions(doc) {
    friendAddBtn.hidden = true;
    friendStatusSent.hidden = true;
    friendStatusReceived.hidden = true;
    friendStatusAccepted.hidden = true;

    if (!doc || !doc.exists) {
      friendAddBtn.hidden = false;
      updateMessageButtonVisibility();
      return;
    }
    var data = doc.data();
    if (data.status === "accepted") {
      friendStatusAccepted.hidden = false;
    } else if (data.requestedBy === currentUser.uid) {
      friendStatusSent.hidden = false;
    } else {
      friendStatusReceived.hidden = false;
    }
    updateMessageButtonVisibility();
  }

  function watchFriendship() {
    if (unsubscribeFriendship) {
      unsubscribeFriendship();
      unsubscribeFriendship = null;
    }
    friendActionsError.hidden = true;
    if (!currentUser || !uid || currentUser.uid === uid) {
      friendActions.hidden = true;
      return;
    }
    friendActions.hidden = false;
    unsubscribeFriendship = friendshipRef().onSnapshot(renderFriendActions);
  }

  friendAddBtn.addEventListener("click", function () {
    if (!currentUser || !profileData) return;
    var otherName = (profileData.preferHandle && profileData.handle)
      ? profileData.handle : (profileData.name || profileData.handle || "Member");
    runFriendAction(friendAddBtn, C.getDisplayName(currentUser).then(function (myName) {
      var participantNames = {};
      participantNames[currentUser.uid] = myName;
      participantNames[uid] = otherName;
      return friendshipRef().set({
        participants: [currentUser.uid, uid].sort(),
        participantNames: participantNames,
        requestedBy: currentUser.uid,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }));
  });

  var friendAcceptBtn = document.getElementById("friend-accept-btn");
  friendAcceptBtn.addEventListener("click", function () {
    runFriendAction(friendAcceptBtn, friendshipRef().update({
      status: "accepted",
      respondedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }));
  });

  var friendDeclineBtn = document.getElementById("friend-decline-btn");
  friendDeclineBtn.addEventListener("click", function () {
    runFriendAction(friendDeclineBtn, friendshipRef().delete());
  });

  var friendRemoveBtn = document.getElementById("friend-remove-btn");
  friendRemoveBtn.addEventListener("click", function () {
    if (!window.confirm("Remove this friend?")) return;
    runFriendAction(friendRemoveBtn, friendshipRef().delete());
  });

  function renderFriendsList(docs) {
    friendsList.textContent = "";
    friendsCache = docs.map(function (doc) {
      var data = doc.data();
      var otherUid = (data.participants || []).filter(function (p) { return p !== currentUser.uid; })[0];
      return { uid: otherUid, name: (data.participantNames && data.participantNames[otherUid]) || "Member" };
    });

    dialogsSection.hidden = !friendsCache.length;
    renderDialogsSearchResults(dialogsSearch.value);

    if (!docs.length) {
      friendsEmpty.hidden = false;
      return;
    }
    friendsEmpty.hidden = true;
    friendsCache.forEach(function (f) {
      var item = document.createElement("a");
      item.className = "dm-item";
      item.href = "member.html?uid=" + encodeURIComponent(f.uid);
      item.textContent = f.name;
      friendsList.appendChild(item);
    });
  }

  function loadFriendsList() {
    var isOwner = currentUser && currentUser.uid === uid;
    friendsWrap.hidden = !isOwner;
    dialogsSection.hidden = true;
    if (!isOwner) return;

    AgoraDB.collection("friendships")
      .where("participants", "array-contains", currentUser.uid)
      .where("status", "==", "accepted")
      .get()
      .then(function (snap) { renderFriendsList(snap.docs); })
      .catch(function () {
        // Composite index not provisioned yet - fall back to an
        // unfiltered read and filter client-side rather than show nothing.
        AgoraDB.collection("friendships")
          .where("participants", "array-contains", currentUser.uid)
          .get()
          .then(function (snap) {
            renderFriendsList(snap.docs.filter(function (doc) { return doc.data().status === "accepted"; }));
          });
      });
  }
})();

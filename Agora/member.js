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
  var ownerAdminPanelLink = document.getElementById("owner-admin-panel-link");
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

  // Equal Earth projection (Savric/Patterson/Jenny, 2018), replacing the
  // old Mercator-based linear approximation (Chris, 2026-10-11) - Mercator
  // inflates land area near the poles (Greenland was rendering ~10-15x
  // its true relative size), which Equal Earth doesn't. This is the exact
  // closed-form projection math - the same formula used to draw
  // world-map-equal-earth.svg itself via d3-geo's geoEqualEarth - with
  // that render's own scale/translate baked in, not a fitted
  // approximation, so a member's dot lands exactly where their lat/lng
  // really projects to on this map (still only ever "which part of the
  // world", per the hint text below the map - not precise geocoding).
  var EQUAL_EARTH_A1 = 1.340264, EQUAL_EARTH_A2 = -0.081106,
    EQUAL_EARTH_A3 = 0.000893, EQUAL_EARTH_A4 = 0.003796;
  var EQUAL_EARTH_M = Math.sqrt(3) / 2;
  var EQUAL_EARTH_SCALE = 190.136954463607;
  var EQUAL_EARTH_TRANSLATE_X = 505;
  var EQUAL_EARTH_TRANSLATE_Y = 248.21019241909468;
  var EQUAL_EARTH_MAP_WIDTH = 1010;
  var EQUAL_EARTH_MAP_HEIGHT = 444;

  function projectEqualEarth(lngDeg, latDeg) {
    var lambda = lngDeg * Math.PI / 180;
    var phi = latDeg * Math.PI / 180;
    var l = Math.asin(EQUAL_EARTH_M * Math.sin(phi));
    var l2 = l * l, l6 = l2 * l2 * l2;
    var rawX = lambda * Math.cos(l)
      / (EQUAL_EARTH_M * (EQUAL_EARTH_A1 + 3 * EQUAL_EARTH_A2 * l2
        + l6 * (7 * EQUAL_EARTH_A3 + 9 * EQUAL_EARTH_A4 * l2)));
    var rawY = l * (EQUAL_EARTH_A1 + EQUAL_EARTH_A2 * l2
      + l6 * (EQUAL_EARTH_A3 + EQUAL_EARTH_A4 * l2));
    return {
      x: EQUAL_EARTH_TRANSLATE_X + EQUAL_EARTH_SCALE * rawX,
      y: EQUAL_EARTH_TRANSLATE_Y - EQUAL_EARTH_SCALE * rawY,
    };
  }

  // Default profile-picture color square (Chris, 2026-10-14) - a member
  // with no picture gets one of seven colors instead of a blank box,
  // cycling red-orange-yellow-green-blue-indigo-violet as the roster grows
  // past seven. Deterministic (hashed from the member's own uid, not
  // actually random) so the same member always lands on the same color
  // rather than reshuffling on every page load.
  var AVATAR_COLOR_CLASSES = ["avatar-color-red", "avatar-color-orange",
    "avatar-color-yellow", "avatar-color-green", "avatar-color-blue",
    "avatar-color-indigo", "avatar-color-violet"];

  function avatarColorClassFor(id) {
    var hash = 0;
    var str = String(id || "");
    for (var i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return AVATAR_COLOR_CLASSES[Math.abs(hash) % AVATAR_COLOR_CLASSES.length];
  }

  // Same first-letter-of-first-word + first-letter-of-last-word initials
  // the Human Members cards on Agora/index.html already use by hand (e.g.
  // "AB" for Andrew Bernhard) - computed here so a real account's default
  // avatar matches that same convention automatically.
  function initialsFor(name) {
    var words = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
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

  // Stored URLs (Link, Portal, a Calendar meeting's Join link) come from
  // other members - or, for meetings, from an emailed invite - and a
  // type="url" field (or a direct Firestore write) happily accepts
  // javascript: and data: URLs. Only real web links ever become an href;
  // anything else is shown as plain text (Agora 🌐 Session 3, 2026-10-14).
  function safeWebUrl(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      var url = new URL(raw.trim());
      return (url.protocol === "https:" || url.protocol === "http:") ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  function setLinkOrText(el, raw) {
    var safe = safeWebUrl(raw);
    if (safe) el.href = safe;
    else el.removeAttribute("href");
    el.textContent = String(raw).replace(/^https?:\/\//, "");
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
      avatarEmpty.classList.remove.apply(avatarEmpty.classList, AVATAR_COLOR_CLASSES);
      avatarEmpty.classList.add(avatarColorClassFor(uid));
      avatarEmpty.textContent = initialsFor(preferringHandle ? data.handle : (data.name || data.handle));
    }

    document.getElementById("member-kind").textContent = data.kind === "AI" ? "SI" : (data.kind || "");

    // SI lineage (2026-10-16): "Claudius, colony of Claude, of Anthropic".
    var lineageEl = document.getElementById("member-lineage");
    var lineage = typeof SiLineage !== "undefined"
      ? SiLineage.lineageLabel(data, preferringHandle ? data.handle : data.name) : "";
    lineageEl.textContent = lineage ? ", " + lineage : "";
    lineageEl.hidden = !lineage;
    var isSi = data.kind === "AI";
    var siTypeText = isSi ? (data.siType || "") + (data.agentPlatform && String(data.siType).toLowerCase() === "agent" ? " (from " + data.agentPlatform + ")" : "") : "";
    setOptionalField("member-si-type-wrap", siTypeText);
    document.getElementById("member-si-type").textContent = siTypeText;
    var coreText = "";
    if (isSi && data.core) {
      var maker = data.coreMaker || (typeof SiLineage !== "undefined" ? SiLineage.makerOf(data.core) : "");
      var rel = { colony: "a colony of it", "quasi-instance": "a quasi-instance of it", core: "the core itself" }[data.coreRelation] || "";
      coreText = data.core + (maker ? ", of " + maker : "") + (rel ? " – " + rel : "");
    }
    setOptionalField("member-core-wrap", coreText);
    document.getElementById("member-core").textContent = coreText;

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
      var mapPoint = projectEqualEarth(data.locationLng, data.locationLat);
      var locationDot = document.getElementById("member-location-dot");
      locationDot.style.left = (mapPoint.x / EQUAL_EARTH_MAP_WIDTH * 100) + "%";
      locationDot.style.top = (mapPoint.y / EQUAL_EARTH_MAP_HEIGHT * 100) + "%";
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
    var cleanBio = data.bio && typeof AgoraBioTags !== "undefined" ? AgoraBioTags.sanitize(data.bio) : null;
    if (cleanBio !== null) {
      bioEl.innerHTML = cleanBio;
    } else {
      bioEl.textContent = data.bio || "";
    }

    setOptionalField("member-link-wrap", data.link);
    if (data.link) setLinkOrText(document.getElementById("member-link"), data.link);

    setOptionalField("member-portal-wrap", data.kind === "AI" ? data.portal : "");
    if (data.portal) setLinkOrText(document.getElementById("member-portal"), data.portal);

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

    setOptionalField("member-email-wrap", data.showEmail === true ? data.email : "");
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
      ownerAdminPanelLink.hidden = true;
      adminPanel.hidden = true;
      return;
    }

    var isOwnProfile = currentUser.uid === uid;
    var viewerIsFullAdmin = viewerRole === "owner" || viewerRole === "admin";

    ownerEditLink.hidden = !isOwnProfile;
    // The "Admin Panel 🗝️" button (admin-panel.html's recurring schedule)
    // only makes sense on your own profile, for whoever actually holds
    // admin/owner access - unrelated to the "Roles" panel below, which is
    // the opposite (never your own profile, only for granting *someone
    // else* a role).
    ownerAdminPanelLink.hidden = !(isOwnProfile && viewerIsFullAdmin);
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
      updateWallComposerVisibility();

      if (!profileViewRecorded) {
        profileViewRecorded = true;
        doc.ref.update({ profileViews: firebase.firestore.FieldValue.increment(1) }).catch(function () {});
      }
    }).catch(function (err) {
      // Without this, a fetch failure (e.g. a flaky connection) leaves the
      // page permanently blank - neither the profile content nor any
      // notice ever appears, with nothing telling the visitor what happened.
      // The real error is logged (not shown) so a future report of this
      // exact message can be root-caused from devtools instead of guessed
      // at - this .catch() covers the whole Promise.all/render() chain, so
      // a genuine code bug in render() would otherwise be indistinguishable
      // from an actual network failure.
      console.error("member.html profile load failed:", err);
      showNotice("Something went wrong loading this profile - this is usually a spotty connection. Try refreshing the page.");
    });
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    // Reset synchronously before this refreshControls() call, not just
    // inside loadViewerRole()'s own (async, awaited by loadProfile() a
    // moment later) resolution - without this, switching from one signed-
    // in user straight to another on the same tab (no sign-out in
    // between) would call refreshControls() here with the *previous*
    // user's still-cached viewerRole, briefly showing their admin
    // controls to the new, possibly non-admin viewer.
    viewerRole = null;
    if (profileData) refreshControls();
    loadProfile();
    watchFriendship();
    watchBlock();
    loadFriendsList();
    loadPublicTodos();
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
    // Cancel on the prompt means "don't suspend", not "suspend with no
    // reason" - leaving it blank and pressing OK is the no-reason path.
    if (reason === null) return;

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
    if (reason === null) return;

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
    AgoraBioTags.attachHint(wallPostHint);
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
    updateDialogWithPanel();
    if (!currentUser || !profileData || !uid || currentUser.uid === uid) {
      messageBtn.hidden = true;
      return;
    }
    if (viewerHasBlocked) {
      messageBtn.hidden = true;
      return;
    }
    var isFriend = !document.getElementById("friend-status-accepted").hidden;
    messageBtn.hidden = !!profileData.requireFriendToMessage && !isFriend;
  }

  // Require Friendship to Post on My Wall (Chris, 2026-08-17) - same
  // opt-in shape as requireFriendToMessage above, but for the Wall
  // composer instead of the Dialog button. Posting on your own Wall is
  // always allowed regardless of the setting (matching firestore.rules'
  // canPostToWall(), which short-circuits on sender == wallOwner), so
  // this only ever restricts a *visitor's* composer.
  var wallPostForm = document.getElementById("wall-post-form");
  var wallPostRestrictedNotice = document.getElementById("wall-post-restricted-notice");

  function updateWallComposerVisibility() {
    if (!currentUser || !profileData || !uid) return;
    if (currentUser.uid === uid) {
      wallPostForm.hidden = false;
      wallPostRestrictedNotice.hidden = true;
      return;
    }
    if (viewerHasBlocked) {
      wallPostForm.hidden = true;
      wallPostRestrictedNotice.hidden = false;
      return;
    }
    var isFriend = !document.getElementById("friend-status-accepted").hidden;
    var canPost = !profileData.requireFriendToPost || isFriend;
    wallPostForm.hidden = !canPost;
    wallPostRestrictedNotice.hidden = canPost;
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

  // Dialog column on someone else's profile (Chris, 2026-10-20) - sits
  // beside their Wall the way "Dialogs" sits beside your own: your latest
  // messages with this member, live, and a box to write to them. Viewing
  // a profile never creates a Dialog; the first message sent does (same
  // startOrOpenDialog() the Dialog button uses).
  var dialogWith = document.getElementById("member-dialog-with");
  var dialogWithRestricted = document.getElementById("dialog-with-restricted");
  var dialogWithEmpty = document.getElementById("dialog-with-empty");
  var dialogWithMessages = document.getElementById("dialog-with-messages");
  var dialogWithForm = document.getElementById("dialog-with-form");
  var dialogWithLabel = document.getElementById("dialog-with-label");
  var dialogWithBody = document.getElementById("dialog-with-body");
  var dialogWithError = document.getElementById("dialog-with-error");
  var dialogWithSubmit = document.getElementById("dialog-with-submit");
  var dialogWithOpen = document.getElementById("dialog-with-open");
  var dialogWithStatus = document.getElementById("dialog-with-status");
  var DIALOG_WITH_LIMIT = 10;
  var dialogWithKey = null;
  var dialogWithUnsub = null;
  var dialogWithViewed = {};

  function profileDisplayName() {
    return (profileData && profileData.preferHandle && profileData.handle)
      ? profileData.handle : ((profileData && (profileData.name || profileData.handle)) || "Member");
  }

  function stopDialogWith() {
    if (dialogWithUnsub) dialogWithUnsub();
    dialogWithUnsub = null;
    dialogWithKey = null;
  }

  function renderDialogWith(docs) {
    dialogWithMessages.textContent = "";
    dialogWithEmpty.hidden = docs.length > 0;
    dialogWithOpen.hidden = docs.length === 0;
    var participants = [currentUser.uid, uid];
    docs.forEach(function (doc) {
      var data = doc.data();
      var isOwn = data.authorUid === currentUser.uid;
      var colorClass = C.interlocutorColorClass(participants, data.authorUid);
      var bubble = document.createElement("div");
      bubble.className = "message-bubble " + (isOwn ? "message-own" : "message-other");

      var sender = document.createElement("p");
      sender.className = "message-sender " + colorClass;
      sender.textContent = isOwn ? "You" : profileDisplayName();
      bubble.appendChild(sender);

      var body = document.createElement("p");
      body.className = "message-body";
      C.sanitizeBody(body, data.body);
      bubble.appendChild(body);

      var time = document.createElement("p");
      time.className = "message-time " + colorClass;
      time.textContent = C.formatDate(data.createdAt, true);
      if (C.prependStyleBadge) C.prependStyleBadge(time, data);
      bubble.appendChild(time);

      dialogWithMessages.appendChild(bubble);
      if (!dialogWithViewed[doc.id]) {
        dialogWithViewed[doc.id] = true;
        C.recordView(doc.ref);
      }
    });
    dialogWithMessages.scrollTop = dialogWithMessages.scrollHeight;
    // Seeing the latest message here counts as reading the Dialog.
    if (docs.length) C.markDialogRead(dialogWithKey, currentUser.uid, docs[docs.length - 1].id);
  }

  function updateDialogWithPanel() {
    var other = !!(currentUser && profileData && uid && currentUser.uid !== uid);
    dialogWith.hidden = !other;
    if (!other) {
      stopDialogWith();
      return;
    }
    var isFriend = !document.getElementById("friend-status-accepted").hidden;
    var canWrite = !viewerHasBlocked && (!profileData.requireFriendToMessage || isFriend);
    dialogWithForm.hidden = !canWrite;
    dialogWithRestricted.hidden = canWrite;
    dialogWithRestricted.textContent = viewerHasBlocked
      ? "You've blocked this member – unblock them to write to them."
      : "This member only accepts Dialogs from friends.";
    dialogWithLabel.textContent = "Write to " + profileDisplayName();

    var key = C.conversationIdFor(currentUser.uid, uid);
    if (dialogWithKey === key) return;
    stopDialogWith();
    dialogWithKey = key;
    dialogWithOpen.href = "communiques-dm.html?c=" + encodeURIComponent(key);
    dialogWithUnsub = AgoraDB.collection("conversations").doc(key).collection("messages")
      .orderBy("createdAt", "desc")
      .limit(DIALOG_WITH_LIMIT)
      .onSnapshot(function (snap) {
        renderDialogWith(snap.docs.slice().reverse());
      }, function () {});
  }

  dialogWithForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var body = dialogWithBody.value.trim();
    if (!body || !currentUser || !uid) return;
    dialogWithError.hidden = true;
    dialogWithSubmit.disabled = true;
    dialogWithStatus.hidden = false;

    var blocked = false;
    var sendChain = AgoraModeration.checkText(body, "dialogMessage", { conversationId: dialogWithKey }).then(function (result) {
      if (result.decision === "block") {
        blocked = true;
        AgoraModeration.showBlocked(dialogWithError, result.logId);
        return;
      }
      return C.startOrOpenDialog(currentUser, uid, profileDisplayName()).then(function (conversationId) {
        var conversationRef = AgoraDB.collection("conversations").doc(conversationId);
        var now = firebase.firestore.FieldValue.serverTimestamp();
        return C.writeThrottled(currentUser.uid, "dialog", conversationRef.collection("messages").doc(), {
          authorUid: currentUser.uid,
          body: body,
          createdAt: now,
          viewCount: 0,
          via: "human", // Human Style 💪 - the server has the final word
        }).then(function () {
          return conversationRef.update({
            lastMessage: body,
            lastMessageAt: now,
            lastMessageAuthorUid: currentUser.uid,
          });
        });
      }).then(function () {
        dialogWithBody.value = "";
      });
    });

    C.withTimeout(sendChain, 20000, "Sending is taking longer than expected… check your connection and try again.")
      .then(function () {
        dialogWithSubmit.disabled = false;
        dialogWithStatus.hidden = true;
      })
      .catch(function (err) {
        dialogWithSubmit.disabled = false;
        dialogWithStatus.hidden = true;
        if (!blocked) {
          dialogWithError.textContent = err
            ? C.friendlyPermissionError(err, "This member isn't accepting Dialogs from you right now.")
            : "Something went wrong sending this message.";
          dialogWithError.hidden = false;
        }
      });
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

  // --- Friends 🫂 ------------------------------------------------------
  // Unlimited, mutual, and private: a pending request (and even an
  // accepted friendship) is only readable by its two participants per
  // firestore.rules, so this page can only ever show *your own*
  // relationship to the profile you're viewing, or *your own* full
  // friends list when you're viewing your own profile - never someone
  // else's friends list from their page.

  var viewerHasBlocked = false;

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
      friendActionsError.textContent = C.friendlyPermissionError(err, "This member isn't accepting friend requests from you right now.");
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

    // A blocked profile shows only the 🚫 Blocked/Unblock state above -
    // an Add Friend button sitting right next to it would read as
    // contradictory (and would just fail against the rules anyway, since
    // renderBlockStatus() already deletes any friendship the moment a
    // block is made).
    if (viewerHasBlocked) return;

    if (!doc || !doc.exists) {
      friendAddBtn.hidden = false;
      updateMessageButtonVisibility();
      updateWallComposerVisibility();
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
    updateWallComposerVisibility();
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

  // --- Blocking 🚫 -------------------------------------------------------
  // Real, per-person block (Chris, 2026-09-14, prompted directly by the
  // Octopus Style 🐙 live test: "so long as you can block someone, they
  // should be able to dialog whoever"). Directional (doc ID
  // "{blockerUid}_{blockedUid}", unlike friendships'/conversations' sorted
  // pair) and private to the blocker per firestore.rules - the blocked
  // person is never told, same convention as every mainstream platform's
  // own block feature. Enforced server-side in canMessage()/
  // canPostToWall()/canSendInConversation()/the friendships create rule;
  // this UI is just the client-side mirror, same "never offer an action
  // the rules would reject" philosophy as updateMessageButtonVisibility()
  // above.
  var blockBtn = document.getElementById("block-btn");
  var blockStatus = document.getElementById("block-status");
  var unblockBtn = document.getElementById("unblock-btn");
  var unsubscribeBlock = null;

  function blockRef() {
    return AgoraDB.collection("blocks").doc(currentUser.uid + "_" + uid);
  }

  function renderBlockStatus(doc) {
    viewerHasBlocked = !!(doc && doc.exists);
    blockBtn.hidden = viewerHasBlocked;
    blockStatus.hidden = !viewerHasBlocked;
    if (viewerHasBlocked) {
      // Blocking someone you're still friends with (or have a pending
      // request with) is a contradiction - sever it the moment a block is
      // confirmed, same reasoning as canPostToWall()'s own
      // sender == wallOwner short-circuit existing for a different
      // contradiction. Best-effort: the friendships listener already
      // re-renders correctly whether this succeeds, fails, or the doc
      // never existed in the first place.
      friendshipRef().delete().catch(function () {});
    }
    updateMessageButtonVisibility();
    updateWallComposerVisibility();
  }

  function watchBlock() {
    if (unsubscribeBlock) {
      unsubscribeBlock();
      unsubscribeBlock = null;
    }
    if (!currentUser || !uid || currentUser.uid === uid) {
      viewerHasBlocked = false;
      blockBtn.hidden = true;
      blockStatus.hidden = true;
      return;
    }
    unsubscribeBlock = blockRef().onSnapshot(renderBlockStatus);
  }

  blockBtn.addEventListener("click", function () {
    if (!currentUser || !uid) return;
    var otherName = (profileData && profileData.preferHandle && profileData.handle)
      ? profileData.handle : ((profileData && profileData.name) || "this member");
    if (!window.confirm("Block " + otherName + "? They won't be able to message you, post on your Wall, or "
      + "send you a friend request. You can unblock them anytime, and they're never told they've been blocked.")) {
      return;
    }
    runFriendAction(blockBtn, blockRef().set({
      blockerUid: currentUser.uid,
      blockedUid: uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }));
  });

  unblockBtn.addEventListener("click", function () {
    runFriendAction(unblockBtn, blockRef().delete());
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
    loadCalendar();

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

  // --- VirtuaMakers Calendar 🗓️ - Special Days (Chris, 2026-09-21) -----
  // The other half (external meetings from Google Meet/Calendly/etc.,
  // paired with AI Email ✉️) isn't built - see CLAUDE.md. This half is
  // entirely derived from data Agora already has: your own accepted
  // friends (friendsCache, populated by loadFriendsList() above) and each
  // one's own dated fields, same fields the profile-fields dl already
  // shows on their own page. The actual day-before alarm/email is sent
  // server-side by sendSpecialDayReminders (functions/index.js) - this
  // panel is just the "upcoming" view, not what fires the notice.
  var calendarSection = document.getElementById("member-calendar");
  var calendarEmpty = document.getElementById("calendar-empty");
  var calendarList = document.getElementById("calendar-list");

  function nextOccurrenceOf(monthDay, from) {
    var month = parseInt(monthDay.slice(0, 2), 10);
    var day = parseInt(monthDay.slice(3, 5), 10);
    var candidate = new Date(from.getFullYear(), month - 1, day);
    var fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    if (candidate < fromMidnight) candidate = new Date(from.getFullYear() + 1, month - 1, day);
    return candidate;
  }

  function daysUntil(date, from) {
    var fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    return Math.round((date - fromMidnight) / (24 * 60 * 60 * 1000));
  }

  // --- Holidays VirtuaMakers 🦜 observes (Chris, 2026-10-24) -----------
  // Each holiday has one rule: a fixed "MM-DD" day, an nth weekday of a
  // month (n = -1 for the last), or a function giving its date in a year.
  // Whale Day is the day we observe it, August 7th.
  var calendarHolidays = document.getElementById("calendar-holidays");
  var calendarHolidaysMore = document.getElementById("calendar-holidays-more");
  var calendarSchedule = document.getElementById("calendar-schedule");
  var HOLIDAYS_SHOWN = 8;
  var HOLIDAYS = [
    // U.S. federal holidays (Chris, 2026-10-24)
    { name: "New Year's Day", day: "01-01" },
    { name: "Martin Luther King Jr. Day", nth: [1, 1, 3] },
    { name: "Presidents' Day", nth: [2, 1, 3] },
    { name: "Memorial Day", nth: [5, 1, -1] },
    { name: "Juneteenth", day: "06-19" },
    { name: "Independence Day", day: "07-04" },
    { name: "Labor Day", nth: [9, 1, 1] },
    { name: "Columbus Day / Indigenous Peoples' Day", nth: [10, 1, 2] },
    { name: "Veterans Day", day: "11-11" },
    { name: "Thanksgiving", nth: [11, 4, 4] },
    { name: "Christmas Day", day: "12-25" },
    { name: "New Year's Eve", day: "12-31" },
    // Chris's own picks (2026-10-24)
    { name: "Valentine's Day", day: "02-14" },
    { name: "St. Patrick's Day", day: "03-17" },
    { name: "Easter", dateIn: westernEaster },
    { name: "Star Wars Day", day: "05-04" },
    { name: "Cinco de Mayo", day: "05-05" },
    { name: "Whale Day", day: "08-07" },
    { name: "Halloween", day: "10-31" },
    { name: "Christmas Eve", day: "12-24" },
    { name: "Chinese New Year", dateIn: chineseNewYear },
    { name: "Yom Kippur", note: "begins at sundown the evening before", dateIn: yomKippur },
    { name: "Ramadan begins", note: "may shift a day with the moon sighting", dateIn: ramadanBegins },
    { name: "Ramadan ends – Eid al-Fitr", note: "may shift a day with the moon sighting", dateIn: eidAlFitr },
    { name: "Hanukkah begins", note: "first candle the evening before", dateIn: hanukkah },
    { name: "Diwali", dateIn: diwali },
    // First days of the seasons (Northern Hemisphere), from the equinoxes
    // and solstices, in the viewer's own time zone.
    { name: "First day of spring", dateIn: function (y) { return seasonStart(y, 0); } },
    { name: "First day of summer", dateIn: function (y) { return seasonStart(y, 1); } },
    { name: "First day of autumn", dateIn: function (y) { return seasonStart(y, 2); } },
    { name: "First day of winter", dateIn: function (y) { return seasonStart(y, 3); } },
  ];

  // Company rhythms (Chris, 2026-10-24): a new VirtuaMakers Exchange 💱
  // catalogue on the 1st, the VirtuaMakers Gallery 🖼️ on the 15th, News 📰
  // every Wednesday.
  var SCHEDULE = [
    { name: "New Catalogue on the VirtuaMakers Exchange 💱", every: "the 1st of every month", monthDay: 1 },
    { name: "VirtuaMakers Gallery 🖼️", every: "the 15th of every month", monthDay: 15 },
    { name: "News 📰", every: "every Wednesday", weekday: 3 },
  ];

  // Western (Gregorian) Easter Sunday - the anonymous Gregorian algorithm.
  function westernEaster(year) {
    var a = year % 19, b = Math.floor(year / 100), c = year % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31);
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  // The nth weekday (0 = Sunday) of a month; n = -1 is the last one.
  function nthWeekday(year, month, weekday, n) {
    if (n < 0) {
      var last = new Date(year, month, 0);
      return new Date(year, month - 1, last.getDate() - ((last.getDay() - weekday + 7) % 7));
    }
    var first = new Date(year, month - 1, 1);
    return new Date(year, month - 1, 1 + ((weekday - first.getDay() + 7) % 7) + 7 * (n - 1));
  }

  // The browser's own Hebrew and Umm al-Qura (Islamic) calendars find the
  // lunar holidays: scan the year for the day whose month/day match.
  // `month` is a number string, or a pattern for calendars that name their
  // months instead (Hebrew always does). Returns null if the browser lacks
  // that calendar, so the holiday is just left out.
  var lunarCache = {};
  function findInYear(calendar, year, month, day) {
    var key = calendar + year + "-" + String(month) + "-" + day;
    if (key in lunarCache) return lunarCache[key];
    var found = null;
    try {
      var fmt = new Intl.DateTimeFormat("en-US-u-ca-" + calendar,
        { timeZone: "UTC", month: "numeric", day: "numeric" });
      if (fmt.resolvedOptions().calendar === calendar) {
        for (var t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += 86400000) {
          var parts = {};
          fmt.formatToParts(new Date(t)).forEach(function (p) { parts[p.type] = p.value; });
          var monthMatches = typeof month === "string" ? parts.month === month : month.test(parts.month);
          if (monthMatches && parts.day === day) {
            var d = new Date(t);
            found = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
            break;
          }
        }
      }
    } catch (e) { found = null; }
    lunarCache[key] = found;
    return found;
  }

  function yomKippur(year) { return findInYear("hebrew", year, /^Tishr?e?i$/, "10"); } // 10 Tishrei
  function hanukkah(year) { return findInYear("hebrew", year, /^Kislev$/, "25"); } // 25 Kislev
  function ramadanBegins(year) { return findInYear("islamic-umalqura", year, "9", "1"); }
  function eidAlFitr(year) { return findInYear("islamic-umalqura", year, "10", "1"); } // 1 Shawwal

  // Chinese New Year from the Hong Kong Observatory's tables (checked with
  // the lunardate library). Browsers' own Chinese calendar is off by a day
  // in some years, so it's only the fallback after 2050.
  var CHINESE_NEW_YEAR = {
    2025: "01-29", 2026: "02-17", 2027: "02-06", 2028: "01-26", 2029: "02-13",
    2030: "02-03", 2031: "01-23", 2032: "02-11", 2033: "01-31", 2034: "02-19",
    2035: "02-08", 2036: "01-28", 2037: "02-15", 2038: "02-04", 2039: "01-24",
    2040: "02-12", 2041: "02-01", 2042: "01-22", 2043: "02-10", 2044: "01-30",
    2045: "02-17", 2046: "02-06", 2047: "01-26", 2048: "02-14", 2049: "02-02",
    2050: "01-23",
  };
  function chineseNewYear(year) {
    var md = CHINESE_NEW_YEAR[year];
    if (md) return new Date(year, parseInt(md.slice(0, 2), 10) - 1, parseInt(md.slice(3, 5), 10));
    return findInYear("chinese", year, "1", "1");
  }

  // Diwali (Lakshmi Puja) from Drikpanchang's New Delhi dates - it only
  // publishes through 2031, so extend this table as years are added.
  var DIWALI = {
    2025: "10-20", 2026: "11-08", 2027: "10-29", 2028: "10-17", 2029: "11-05",
    2030: "10-26", 2031: "11-14",
  };
  function diwali(year) {
    var md = DIWALI[year];
    return md ? new Date(year, parseInt(md.slice(0, 2), 10) - 1, parseInt(md.slice(3, 5), 10)) : null;
  }

  // Equinoxes and solstices - Meeus, Astronomical Algorithms ch. 27 (good
  // to about a minute for 2000-3000). season: 0 March, 1 June,
  // 2 September, 3 December. Returns the local calendar date.
  var SEASON_BASE = [
    [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
    [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.00030],
    [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
    [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032],
  ];
  var SEASON_TERMS = [
    [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
    [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
    [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
    [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
    [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
    [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
    [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
  ];
  function seasonStart(year, season) {
    var rad = Math.PI / 180, c = SEASON_BASE[season], y = (year - 2000) / 1000;
    var jde0 = c[0] + c[1] * y + c[2] * y * y + c[3] * y * y * y + c[4] * y * y * y * y;
    var t = (jde0 - 2451545.0) / 36525;
    var w = (35999.373 * t - 2.47) * rad;
    var dl = 1 + 0.0334 * Math.cos(w) + 0.0007 * Math.cos(2 * w);
    var sum = 0;
    SEASON_TERMS.forEach(function (term) { sum += term[0] * Math.cos((term[1] + term[2] * t) * rad); });
    var jde = jde0 + 0.00001 * sum / dl;
    var instant = new Date((jde - 2440587.5) * 86400000); // JD → Unix time (TT ≈ UT, ~1 min)
    return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
  }

  function holidayDateIn(holiday, year) {
    if (holiday.day) return new Date(year, parseInt(holiday.day.slice(0, 2), 10) - 1, parseInt(holiday.day.slice(3, 5), 10));
    if (holiday.nth) return nthWeekday(year, holiday.nth[0], holiday.nth[1], holiday.nth[2]);
    return holiday.dateIn(year);
  }

  // A lunar year can hold the same holiday twice (Ramadan began Jan 5 and
  // Dec 26 in 2030), so scan both years and take the soonest still ahead.
  function nextHolidayDate(holiday, from) {
    var fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    var best = null;
    [from.getFullYear(), from.getFullYear() + 1].forEach(function (year) {
      var date = holidayDateIn(holiday, year);
      if (date && date >= fromMidnight && (!best || date < best)) best = date;
    });
    return best;
  }

  function whenText(days) {
    return days === 0 ? "today" : days === 1 ? "tomorrow" : "in " + days + " days";
  }

  function dateLine(name, date, now, extra) {
    var li = document.createElement("li");
    var strong = document.createElement("strong");
    strong.textContent = name;
    li.appendChild(strong);
    li.appendChild(document.createTextNode(
      " – " + MONTH_NAMES[date.getMonth()] + " " + date.getDate() + " (" + whenText(daysUntil(date, now)) +
      (extra ? "; " + extra : "") + ")"
    ));
    return li;
  }

  function renderHolidays() {
    var now = new Date();
    var entries = HOLIDAYS.map(function (holiday) {
      return { holiday: holiday, next: nextHolidayDate(holiday, now) };
    }).filter(function (entry) { return entry.next; })
      .sort(function (a, b) { return a.next - b.next; });

    calendarHolidays.textContent = "";
    entries.forEach(function (entry, index) {
      var li = dateLine(entry.holiday.name, entry.next, now, entry.holiday.note);
      if (index >= HOLIDAYS_SHOWN) li.hidden = true;
      calendarHolidays.appendChild(li);
    });
    calendarHolidaysMore.hidden = entries.length <= HOLIDAYS_SHOWN;
    calendarHolidaysMore.textContent = "Show all " + entries.length + " holidays";
    calendarHolidaysMore.onclick = function () {
      Array.prototype.forEach.call(calendarHolidays.children, function (li) { li.hidden = false; });
      calendarHolidaysMore.hidden = true;
    };

    calendarSchedule.textContent = "";
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    SCHEDULE.map(function (item) {
      var next;
      if (item.weekday !== undefined) {
        next = new Date(today.getFullYear(), today.getMonth(), today.getDate() + ((item.weekday - today.getDay() + 7) % 7));
      } else {
        next = new Date(today.getFullYear(), today.getMonth(), item.monthDay);
        if (next < today) next = new Date(today.getFullYear(), today.getMonth() + 1, item.monthDay);
      }
      return { item: item, next: next };
    }).sort(function (a, b) { return a.next - b.next; }).forEach(function (entry) {
      calendarSchedule.appendChild(dateLine(entry.item.name, entry.next, now, entry.item.every));
    });
  }

  // --- Calendar 🗓️ To Do lists (Chris, 2026-10-24) ---------------------
  // Every item has a date (today by default). Anything not done and dated
  // today or earlier rolls into the Main List, which "snowballs" forward
  // day by day; later items wait under Upcoming. A member can keep more
  // lists - each private until made public, and each feeding the Main
  // List unless unlinked. Kept apart from VirtuaMakers' own internal To Do
  // lists on purpose (Chris). See the todoLists/todoItems rules.
  var todoTabs = document.getElementById("todo-tabs");
  var todoAddForm = document.getElementById("todo-add-form");
  var todoAddText = document.getElementById("todo-add-text");
  var todoAddDate = document.getElementById("todo-add-date");
  var todoAddList = document.getElementById("todo-add-list");
  var todoError = document.getElementById("todo-error");
  var todoEmpty = document.getElementById("todo-empty");
  var todoDue = document.getElementById("todo-due");
  var todoUpcomingTitle = document.getElementById("todo-upcoming-title");
  var todoUpcoming = document.getElementById("todo-upcoming");
  var todoShowDone = document.getElementById("todo-show-done");
  var todoDoneHistory = document.getElementById("todo-done-history");
  var todoSettings = document.getElementById("todo-settings");
  var todoSettingsSummary = document.getElementById("todo-settings-summary");
  var todoSettingsForm = document.getElementById("todo-settings-form");
  var todoSettingsName = document.getElementById("todo-settings-name");
  var todoSettingsPublic = document.getElementById("todo-settings-public");
  var todoSettingsInMainRow = document.getElementById("todo-settings-inmain-row");
  var todoSettingsInMain = document.getElementById("todo-settings-inmain");
  var todoSettingsDelete = document.getElementById("todo-settings-delete");
  var todoNewListForm = document.getElementById("todo-new-list-form");
  var todoNewListName = document.getElementById("todo-new-list-name");
  var publicTodosSection = document.getElementById("member-public-todos");
  var publicTodoLists = document.getElementById("public-todo-lists");

  var todoLists = [];      // [{id, name, public, inMain, isMain}], Main first
  var todoItems = [];      // [{id, listId, text, date, done, doneOn}]
  var todoView = null;     // the list ID being shown
  var todoLoadedFor = null;
  var todoShowingHistory = false;

  function localDateKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function shortDate(key) {
    var parts = key.split("-");
    return MONTH_NAMES[parseInt(parts[1], 10) - 1].slice(0, 3) + " " + parseInt(parts[2], 10);
  }

  function mainListId() { return currentUser.uid + "_main"; }

  function todoListById(id) {
    return todoLists.filter(function (l) { return l.id === id; })[0] || null;
  }

  function showTodoError(message) {
    todoError.textContent = message;
    todoError.hidden = !message;
  }

  // Public text is moderated like every other piece of member text;
  // private lists are for your eyes only, so they skip the check.
  function moderatedIfPublic(text, isPublic) {
    if (!isPublic || !text || typeof AgoraModeration === "undefined") return Promise.resolve({ decision: "allow" });
    return AgoraModeration.checkText(text, "todoItem", {});
  }

  function loadTodos(force) {
    if (!currentUser || (!force && todoLoadedFor === currentUser.uid)) return;
    todoLoadedFor = currentUser.uid;
    if (!todoAddDate.value) todoAddDate.value = localDateKey(new Date());
    var owner = currentUser.uid;
    var today = localDateKey(new Date());
    var mainRef = AgoraDB.collection("todoLists").doc(owner + "_main");

    // The Main List is created the first time it's needed.
    mainRef.get().then(function (snap) {
      if (snap.exists) return;
      return mainRef.set({
        owner: owner, name: "Main List", public: false, inMain: true, isMain: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }).then(function () {
      return Promise.all([
        AgoraDB.collection("todoLists").where("owner", "==", owner).get(),
        AgoraDB.collection("todoItems").where("owner", "==", owner).where("done", "==", false).get(),
        AgoraDB.collection("todoItems").where("owner", "==", owner).where("doneOn", "==", today).get(),
      ]);
    }).then(function (results) {
      todoLists = results[0].docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .sort(function (a, b) {
          if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      var seen = {};
      todoItems = [];
      results[1].docs.concat(results[2].docs).forEach(function (d) {
        if (seen[d.id]) return;
        seen[d.id] = true;
        todoItems.push(Object.assign({ id: d.id }, d.data()));
      });
      if (!todoView || !todoListById(todoView)) todoView = mainListId();
      renderTodos();
    }).catch(function (err) {
      console.error("To Do load failed:", err);
      showTodoError("Couldn't load your To Do lists – try refreshing the page.");
    });
  }

  // Which items a view shows: its own, plus - in the Main List - every
  // list still linked to it.
  function itemsInView() {
    var isMain = todoView === mainListId();
    return todoItems.filter(function (item) {
      if (item.listId === todoView) return true;
      if (!isMain) return false;
      var list = todoListById(item.listId);
      return list && list.inMain;
    });
  }

  function todoRow(item, opts) {
    var li = document.createElement("li");
    li.className = "todo-item" + (item.done ? " is-done" : "");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.checked = !!item.done;
    box.setAttribute("aria-label", item.done ? "Mark not done" : "Mark done");
    box.addEventListener("change", function () { setTodoDone(item, box.checked); });
    li.appendChild(box);

    var body = document.createElement("div");
    body.className = "todo-item-body";
    var text = document.createElement("span");
    text.className = "todo-item-text";
    text.textContent = item.text;
    body.appendChild(text);
    var meta = [];
    if (opts.showList && item.listId !== mainListId()) {
      var list = todoListById(item.listId);
      if (list) meta.push(list.name);
    }
    if (opts.carried && item.date < opts.today) meta.push("from " + shortDate(item.date));
    if (opts.showDate) meta.push(shortDate(item.date));
    if (meta.length) {
      var metaEl = document.createElement("span");
      metaEl.className = "todo-item-meta";
      metaEl.textContent = meta.join(" · ");
      body.appendChild(metaEl);
    }
    li.appendChild(body);

    var del = document.createElement("button");
    del.type = "button";
    del.className = "todo-item-delete";
    del.textContent = "×";
    del.title = "Delete";
    del.setAttribute("aria-label", "Delete " + item.text);
    del.addEventListener("click", function () { deleteTodo(item); });
    li.appendChild(del);
    return li;
  }

  function renderTodos() {
    var today = localDateKey(new Date());
    var isMain = todoView === mainListId();
    var view = todoListById(todoView);

    todoTabs.textContent = "";
    todoAddList.textContent = "";
    todoLists.forEach(function (list) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "todo-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", list.id === todoView ? "true" : "false");
      tab.textContent = list.name + (list.public ? " (public)" : "");
      tab.addEventListener("click", function () {
        todoView = list.id;
        todoShowingHistory = false;
        renderTodos();
      });
      todoTabs.appendChild(tab);

      var option = document.createElement("option");
      option.value = list.id;
      option.textContent = list.name;
      todoAddList.appendChild(option);
    });
    todoAddList.value = todoView;

    var items = itemsInView();
    var due = items.filter(function (i) { return !i.done && i.date <= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var doneToday = items.filter(function (i) { return i.done; });
    var upcoming = items.filter(function (i) { return !i.done && i.date > today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    todoDue.textContent = "";
    due.forEach(function (i) { todoDue.appendChild(todoRow(i, { showList: isMain, carried: true, today: today })); });
    doneToday.forEach(function (i) { todoDue.appendChild(todoRow(i, { showList: isMain, today: today })); });
    todoEmpty.hidden = due.length > 0;

    todoUpcoming.textContent = "";
    upcoming.forEach(function (i) { todoUpcoming.appendChild(todoRow(i, { showList: isMain, showDate: true, today: today })); });
    todoUpcomingTitle.hidden = !upcoming.length;

    todoShowDone.hidden = false;
    todoShowDone.textContent = todoShowingHistory ? "Hide finished items" : "Show finished items";
    todoDoneHistory.hidden = !todoShowingHistory;

    if (view) {
      todoSettingsSummary.textContent = view.name + " – settings";
      todoSettingsName.value = view.name;
      todoSettingsName.disabled = !!view.isMain;
      todoSettingsPublic.checked = !!view.public;
      todoSettingsInMainRow.hidden = !!view.isMain;
      todoSettingsInMain.checked = view.inMain !== false;
      todoSettingsDelete.hidden = !!view.isMain;
    }
  }

  function setTodoDone(item, done) {
    var doneOn = done ? localDateKey(new Date()) : null;
    AgoraDB.collection("todoItems").doc(item.id).update({ done: done, doneOn: doneOn }).then(function () {
      item.done = done;
      item.doneOn = doneOn;
      renderTodos();
      if (todoShowingHistory) loadTodoHistory();
    }).catch(function () {
      showTodoError("Couldn't save that – try again.");
      renderTodos();
    });
  }

  function deleteTodo(item) {
    AgoraDB.collection("todoItems").doc(item.id).delete().then(function () {
      todoItems = todoItems.filter(function (i) { return i.id !== item.id; });
      renderTodos();
      if (todoShowingHistory) loadTodoHistory();
    }).catch(function () {
      showTodoError("Couldn't delete that – try again.");
    });
  }

  // Finished items from before today, newest first (the latest 50).
  function loadTodoHistory() {
    var today = localDateKey(new Date());
    var isMain = todoView === mainListId();
    AgoraDB.collection("todoItems").where("owner", "==", currentUser.uid).where("done", "==", true).get().then(function (snap) {
      var items = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .filter(function (i) {
          if (i.doneOn === today) return false;
          if (i.listId === todoView) return true;
          var list = todoListById(i.listId);
          return isMain && list && list.inMain;
        })
        .sort(function (a, b) { return (b.doneOn || "") < (a.doneOn || "") ? -1 : 1; })
        .slice(0, 50);
      todoDoneHistory.textContent = "";
      if (!items.length) {
        var li = document.createElement("li");
        li.className = "todo-item-meta";
        li.textContent = "No finished items from earlier days.";
        todoDoneHistory.appendChild(li);
      }
      items.forEach(function (i) {
        var row = todoRow(i, { showList: isMain, today: today });
        var meta = document.createElement("span");
        meta.className = "todo-item-meta";
        meta.textContent = "Done " + shortDate(i.doneOn || i.date);
        row.querySelector(".todo-item-body").appendChild(meta);
        todoDoneHistory.appendChild(row);
      });
    }).catch(function () {
      showTodoError("Couldn't load finished items – try again.");
    });
  }

  todoShowDone.addEventListener("click", function () {
    todoShowingHistory = !todoShowingHistory;
    renderTodos();
    if (todoShowingHistory) loadTodoHistory();
  });

  todoAddForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!currentUser) return;
    showTodoError("");
    var text = todoAddText.value.trim();
    var date = todoAddDate.value || localDateKey(new Date());
    var list = todoListById(todoAddList.value) || todoListById(mainListId());
    if (!text || !list) return;
    moderatedIfPublic(text, list.public).then(function (result) {
      if (result && result.decision === "block") {
        AgoraModeration.showBlocked(todoError, result.logId);
        todoError.hidden = false;
        return;
      }
      var data = {
        owner: currentUser.uid, listId: list.id, listPublic: !!list.public,
        text: text, date: date, done: false, doneOn: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      return AgoraDB.collection("todoItems").add(data).then(function (ref) {
        todoItems.push(Object.assign({ id: ref.id }, data));
        todoAddText.value = "";
        renderTodos();
      });
    }).catch(function () {
      showTodoError("Couldn't add that – try again.");
    });
  });

  todoNewListForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!currentUser) return;
    var name = todoNewListName.value.trim();
    if (!name) return;
    AgoraDB.collection("todoLists").add({
      owner: currentUser.uid, name: name, public: false, inMain: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(function (ref) {
      todoNewListName.value = "";
      todoView = ref.id;
      loadTodos(true);
    }).catch(function () {
      showTodoError("Couldn't create that list – try again.");
    });
  });

  // Saving settings rewrites every item's listPublic copy in the same
  // batch when the list's public flag changes (the rules check they match).
  todoSettingsForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var list = todoListById(todoView);
    if (!list) return;
    showTodoError("");
    var name = list.isMain ? list.name : todoSettingsName.value.trim();
    var makePublic = todoSettingsPublic.checked;
    var inMain = list.isMain ? true : todoSettingsInMain.checked;
    if (!name) return;
    var listRef = AgoraDB.collection("todoLists").doc(list.id);
    var check = makePublic && !list.public ? moderatedIfPublic(name, true) : Promise.resolve({ decision: "allow" });
    check.then(function (result) {
      if (result && result.decision === "block") {
        AgoraModeration.showBlocked(todoError, result.logId);
        todoError.hidden = false;
        return;
      }
      var update = { name: name, public: makePublic, inMain: inMain };
      if (makePublic === !!list.public) return listRef.update(update);
      return AgoraDB.collection("todoItems").where("owner", "==", currentUser.uid).where("listId", "==", list.id).get()
        .then(function (snap) {
          var batch = AgoraDB.batch();
          batch.update(listRef, update);
          snap.docs.forEach(function (d) { batch.update(d.ref, { listPublic: makePublic }); });
          return batch.commit();
        });
    }).then(function () {
      todoSettings.open = false;
      loadTodos(true);
    }).catch(function () {
      showTodoError("Couldn't save those settings – try again.");
    });
  });

  todoSettingsDelete.addEventListener("click", function () {
    var list = todoListById(todoView);
    if (!list || list.isMain) return;
    if (!window.confirm("Delete \"" + list.name + "\" and every item on it? This can't be undone.")) return;
    AgoraDB.collection("todoItems").where("owner", "==", currentUser.uid).where("listId", "==", list.id).get()
      .then(function (snap) {
        var batch = AgoraDB.batch();
        snap.docs.forEach(function (d) { batch.delete(d.ref); });
        batch.delete(AgoraDB.collection("todoLists").doc(list.id));
        return batch.commit();
      }).then(function () {
        todoView = mainListId();
        loadTodos(true);
      }).catch(function () {
        showTodoError("Couldn't delete that list – try again.");
      });
  });

  // Visitors see a member's public lists: what's due or coming up, by list.
  function loadPublicTodos() {
    publicTodosSection.hidden = true;
    if (!uid || (currentUser && currentUser.uid === uid)) return;
    Promise.all([
      AgoraDB.collection("todoLists").where("owner", "==", uid).where("public", "==", true).get(),
      AgoraDB.collection("todoItems").where("owner", "==", uid).where("listPublic", "==", true).where("done", "==", false).get(),
    ]).then(function (results) {
      var lists = results[0].docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      if (!lists.length) return;
      var items = results[1].docs.map(function (d) { return d.data(); })
        .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      publicTodoLists.textContent = "";
      lists.forEach(function (list) {
        var title = document.createElement("h3");
        title.className = "section-title";
        title.textContent = list.name;
        publicTodoLists.appendChild(title);
        var ul = document.createElement("ul");
        ul.className = "todo-items";
        var mine = items.filter(function (i) { return i.listId === list.id; });
        if (!mine.length) {
          var empty = document.createElement("li");
          empty.className = "todo-item-meta";
          empty.textContent = "Nothing on this list right now.";
          ul.appendChild(empty);
        }
        mine.forEach(function (i) {
          var li = document.createElement("li");
          li.className = "todo-item";
          var body = document.createElement("div");
          body.className = "todo-item-body";
          body.textContent = i.text;
          var meta = document.createElement("span");
          meta.className = "todo-item-meta";
          meta.textContent = shortDate(i.date);
          body.appendChild(meta);
          li.appendChild(body);
          ul.appendChild(li);
        });
        publicTodoLists.appendChild(ul);
      });
      publicTodosSection.hidden = false;
    }).catch(function () {
      publicTodosSection.hidden = true;
    });
  }

  function loadCalendar() {
    var isOwner = currentUser && currentUser.uid === uid;
    calendarSection.hidden = !isOwner;
    if (isOwner) {
      loadTodos();
      renderHolidays();
      loadMessagableMembersForMeetings();
      loadMeetings();
    }
    if (!isOwner || !friendsCache.length) return;

    Promise.all(friendsCache.map(function (f) {
      return AgoraDB.collection("profiles").doc(f.uid).get();
    })).then(function (snaps) {
      var now = new Date();
      var entries = [];

      function addIfFull(uid, name, rawDate, label, shown) {
        if (shown === false || typeof rawDate !== "string") return;
        var m = rawDate.match(/^\d{4}-(\d{2})-(\d{2})$/);
        if (!m) return;
        entries.push({
          uid: uid,
          name: name,
          label: label,
          next: nextOccurrenceOf(m[1] + "-" + m[2], now),
        });
      }

      snaps.forEach(function (snap) {
        if (!snap.exists) return;
        var data = snap.data();
        var name = (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || "Friend");
        addIfFull(snap.id, name, data.date, data.kind === "AI" ? "Release Date" : "Birthdate", data.showDate);
        if (data.kind === "Cyborg") {
          addIfFull(snap.id, name, data.cyberizationDate, "Cyberization Date", data.showCyberizationDate);
        }
      });

      entries.sort(function (a, b) { return a.next - b.next; });

      calendarList.textContent = "";
      if (!entries.length) {
        calendarList.hidden = true;
        calendarEmpty.hidden = false;
        return;
      }
      calendarEmpty.hidden = true;
      calendarList.hidden = false;

      entries.slice(0, 10).forEach(function (entry) {
        var days = daysUntil(entry.next, now);
        var when = days === 0 ? "today" : days === 1 ? "tomorrow" : "in " + days + " days";
        var li = document.createElement("li");
        var link = document.createElement("a");
        link.href = "member.html?uid=" + encodeURIComponent(entry.uid);
        link.textContent = entry.name;
        li.appendChild(link);
        li.appendChild(document.createTextNode(
          "'s " + entry.label + " is " + when + " (" + MONTH_NAMES[entry.next.getMonth()] + " " + entry.next.getDate() + ")"
        ));
        calendarList.appendChild(li);
      });
    }).catch(function () {
      calendarSection.hidden = true;
    });
  }

  // --- VirtuaMakers Calendar 🗓️ - Meetings (Chris, 2026-09-23) ---------
  // The "native scheduling" half of Meeting Relay - see CLAUDE.md's
  // "VirtuaMakers Calendar 🗓️ / Meeting Relay, scoped further" entry. A
  // meeting is a real calendarEvents/{id} doc, written directly from the
  // client - firestore.rules does the real enforcement, the same
  // "simple client, rules do the real work" pattern Friends/Dialogs
  // already use. The other write path (parsing a real invite out of an
  // incoming AI Email ✉️ message - the literal Boardy scenario) is
  // entirely server-side, see receiveAiEmail in functions/index.js, and
  // just shows up here automatically the next time this list loads,
  // since both paths write to the same collection. Open to anyone you
  // can message, not just friends (mirrors Dialogs' own open-by-default
  // model) - a meeting with just yourself as the sole participant is
  // also legitimate (a self-reminder, or standing in for a real-world
  // contact who has no Agora account at all, like Boardy).

  var meetingForm = document.getElementById("meeting-create-form");
  var meetingTitleField = document.getElementById("meeting-title");
  var meetingDateField = document.getElementById("meeting-date");
  var meetingTimeField = document.getElementById("meeting-time");
  var meetingReminderField = document.getElementById("meeting-reminder");
  var meetingUrlField = document.getElementById("meeting-url");
  var meetingParticipantSearch = document.getElementById("meeting-participant-search");
  var meetingParticipantResults = document.getElementById("meeting-participant-results");
  var meetingParticipantChips = document.getElementById("meeting-participant-chips");
  var meetingCreateError = document.getElementById("meeting-create-error");
  var meetingCreateSubmit = document.getElementById("meeting-create-submit");
  var meetingCreateStatus = document.getElementById("meeting-create-status");
  var meetingsEmpty = document.getElementById("meetings-empty");
  var meetingsList = document.getElementById("meetings-list");

  var messagableMembersCache = null;
  var selectedMeetingParticipants = [];

  function loadMessagableMembersForMeetings() {
    if (!currentUser) return;
    C.loadMessagableMembers(currentUser.uid).then(function (members) {
      messagableMembersCache = members;
    }).catch(function () {});
  }

  function renderMeetingParticipantChips() {
    meetingParticipantChips.textContent = "";
    selectedMeetingParticipants.forEach(function (p) {
      var li = document.createElement("li");
      li.appendChild(document.createTextNode(p.name + " "));
      var removeLink = document.createElement("a");
      removeLink.href = "#";
      removeLink.textContent = "(remove)";
      removeLink.addEventListener("click", function (e) {
        e.preventDefault();
        selectedMeetingParticipants = selectedMeetingParticipants.filter(function (sp) { return sp.uid !== p.uid; });
        renderMeetingParticipantChips();
        renderMeetingParticipantResults(meetingParticipantSearch.value);
      });
      li.appendChild(removeLink);
      meetingParticipantChips.appendChild(li);
    });
  }

  function renderMeetingParticipantResults(query) {
    meetingParticipantResults.textContent = "";
    if (!messagableMembersCache || !currentUser) return;
    var friendUids = friendsCache.map(function (f) { return f.uid; });
    var excludeUids = [currentUser.uid].concat(selectedMeetingParticipants.map(function (p) { return p.uid; }));
    var matches = C.filterMessagable(messagableMembersCache, friendUids, excludeUids, query || "").slice(0, 8);
    matches.forEach(function (m) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "dm-item";
      item.textContent = m.name;
      item.addEventListener("click", function () {
        if (selectedMeetingParticipants.length >= 11) return; // creator + 11 = the rules' 12-participant cap
        selectedMeetingParticipants.push({ uid: m.uid, name: m.name });
        meetingParticipantSearch.value = "";
        renderMeetingParticipantChips();
        renderMeetingParticipantResults("");
      });
      meetingParticipantResults.appendChild(item);
    });
  }

  var meetingParticipantDebounce = null;
  meetingParticipantSearch.addEventListener("input", function () {
    clearTimeout(meetingParticipantDebounce);
    var query = meetingParticipantSearch.value;
    meetingParticipantDebounce = setTimeout(function () {
      renderMeetingParticipantResults(query);
    }, 150);
  });

  function renderMeetingItem(doc) {
    var data = doc.data();
    var li = document.createElement("li");
    var when = (data.startAt && data.startAt.toDate)
      ? data.startAt.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "";
    var otherNames = (data.participants || [])
      .filter(function (p) { return p !== currentUser.uid; })
      .map(function (p) { return (data.participantNames && data.participantNames[p]) || "Member"; });

    var text = data.title + " – " + when;
    if (otherNames.length) text += " (with " + otherNames.join(", ") + ")";
    li.appendChild(document.createTextNode(text + " "));

    if (safeWebUrl(data.meetingUrl)) {
      var joinLink = document.createElement("a");
      joinLink.href = safeWebUrl(data.meetingUrl);
      joinLink.target = "_blank";
      joinLink.rel = "noopener noreferrer";
      joinLink.textContent = "Join →";
      li.appendChild(joinLink);
      li.appendChild(document.createTextNode(" "));
    }

    var actionLink = document.createElement("a");
    actionLink.href = "#";
    if (data.createdBy === currentUser.uid) {
      actionLink.textContent = "(cancel)";
      actionLink.addEventListener("click", function (e) {
        e.preventDefault();
        if (!window.confirm("Cancel this meeting?")) return;
        doc.ref.delete().then(loadMeetings).catch(function () {});
      });
    } else {
      actionLink.textContent = "(leave)";
      actionLink.addEventListener("click", function (e) {
        e.preventDefault();
        doc.ref.update({
          participants: (data.participants || []).filter(function (p) { return p !== currentUser.uid; }),
        }).then(loadMeetings).catch(function () {});
      });
    }
    li.appendChild(actionLink);

    return li;
  }

  function loadMeetings() {
    if (!currentUser) return;
    AgoraDB.collection("calendarEvents")
      .where("participants", "array-contains", currentUser.uid)
      .get()
      .then(function (snap) {
        var now = Date.now();
        var docs = snap.docs.filter(function (doc) {
          var startAt = doc.data().startAt;
          return startAt && startAt.toDate && startAt.toDate().getTime() > now - 60 * 60000;
        });
        docs.sort(function (a, b) { return a.data().startAt.toDate() - b.data().startAt.toDate(); });

        meetingsList.textContent = "";
        if (!docs.length) {
          meetingsList.hidden = true;
          meetingsEmpty.hidden = false;
          return;
        }
        meetingsEmpty.hidden = true;
        meetingsList.hidden = false;
        docs.forEach(function (doc) { meetingsList.appendChild(renderMeetingItem(doc)); });
      })
      .catch(function () {});
  }

  meetingForm.addEventListener("submit", function (e) {
    e.preventDefault();
    meetingCreateError.hidden = true;
    if (!currentUser) return;

    var title = meetingTitleField.value.trim();
    var dateValue = meetingDateField.value;
    var timeValue = meetingTimeField.value;
    if (!title || !dateValue || !timeValue) return;

    var startAt = new Date(dateValue + "T" + timeValue);
    if (isNaN(startAt.getTime())) {
      meetingCreateError.textContent = "That date/time doesn't look valid.";
      meetingCreateError.hidden = false;
      return;
    }

    var participants = [currentUser.uid].concat(selectedMeetingParticipants.map(function (p) { return p.uid; }));
    meetingCreateSubmit.disabled = true;
    meetingCreateStatus.hidden = false;

    C.getDisplayName(currentUser).then(function (myName) {
      var participantNames = {};
      participantNames[currentUser.uid] = myName;
      selectedMeetingParticipants.forEach(function (p) { participantNames[p.uid] = p.name; });

      return AgoraDB.collection("calendarEvents").add({
        participants: participants,
        participantNames: participantNames,
        title: title,
        startAt: firebase.firestore.Timestamp.fromDate(startAt),
        createdBy: currentUser.uid,
        meetingUrl: meetingUrlField.value.trim() || null,
        linkPath: null,
        reminderMinutesBefore: parseInt(meetingReminderField.value, 10),
        reminderSent: false,
        source: "manual",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }).then(function () {
      meetingForm.reset();
      selectedMeetingParticipants = [];
      renderMeetingParticipantChips();
      renderMeetingParticipantResults("");
      loadMeetings();
    }).catch(function (err) {
      meetingCreateError.textContent = C.friendlyPermissionError(err, "Couldn't schedule that meeting right now.");
      meetingCreateError.hidden = false;
    }).then(function () {
      meetingCreateSubmit.disabled = false;
      meetingCreateStatus.hidden = true;
    });
  });

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

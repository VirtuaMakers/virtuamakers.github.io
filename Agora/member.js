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
      updateMessageButtonVisibility();
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

  var wallList = document.getElementById("wall-list");
  var wallLoading = document.getElementById("wall-loading");
  var wallEmpty = document.getElementById("wall-empty");

  function buildCommentItem(doc) {
    var data = doc.data();
    var item = document.createElement("div");
    item.className = "wall-comment";

    var meta = document.createElement("p");
    meta.className = "communique-item-meta";
    meta.textContent = (data.authorName || "Member") + " · " + C.formatDate(data.createdAt, true);
    item.appendChild(meta);

    var body = document.createElement("p");
    body.className = "body-text communique-body";
    C.sanitizeBody(body, data.body);
    item.appendChild(body);

    if (currentUser && currentUser.uid === data.authorUid && C.isWithinEditWindow(data.createdAt)) {
      C.attachInlineEdit(item, doc.ref, data, body);
    }

    return item;
  }

  function buildCommentForm(postRef) {
    var form = document.createElement("form");
    form.className = "wall-comment-form";

    var textarea = document.createElement("textarea");
    textarea.maxLength = 9999;
    textarea.required = true;
    textarea.placeholder = "Comments may be up to 9,999 characters long!";
    form.appendChild(textarea);

    var error = document.createElement("p");
    error.className = "form-error";
    error.hidden = true;
    form.appendChild(error);

    var perManumBtn = document.createElement("button");
    perManumBtn.type = "button";
    perManumBtn.className = "btn per-manum-btn";
    perManumBtn.title = "Insert a Per Manum Convention ✒️ credit line, if AI helped write this";
    perManumBtn.textContent = "✒️";
    form.appendChild(perManumBtn);
    C.attachPerManumButton(perManumBtn, textarea);

    var submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "btn";
    submitBtn.textContent = "Comment";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!currentUser) return;
      var body = textarea.value.trim();
      if (!body) return;
      error.hidden = true;
      submitBtn.disabled = true;

      var now = firebase.firestore.FieldValue.serverTimestamp();
      C.getDisplayName(currentUser).then(function (authorName) {
        return postRef.collection("comments").add({
          body: body,
          authorUid: currentUser.uid,
          authorName: authorName,
          createdAt: now,
        });
      }).then(function () {
        return postRef.update({
          commentCount: firebase.firestore.FieldValue.increment(1),
          lastActivityAt: now,
        });
      }).then(function () {
        submitBtn.disabled = false;
        textarea.value = "";
        loadWall();
      }).catch(function (err) {
        submitBtn.disabled = false;
        error.textContent = err.message;
        error.hidden = false;
      });
    });

    return form;
  }

  function buildWallPost(doc) {
    var data = doc.data();
    var post = document.createElement("div");
    post.className = "wall-post";

    var meta = document.createElement("p");
    meta.className = "communique-item-meta";
    meta.textContent = (data.authorName || "Member") + " · " + C.formatDate(data.createdAt, true);
    post.appendChild(meta);

    var body = document.createElement("p");
    body.className = "body-text communique-body";
    C.sanitizeBody(body, data.body);
    post.appendChild(body);

    if (currentUser && currentUser.uid === data.authorUid && C.isWithinEditWindow(data.createdAt)) {
      C.attachInlineEdit(post, doc.ref, data, body);
    }

    var commentsWrap = document.createElement("div");
    commentsWrap.className = "wall-comments";
    post.appendChild(commentsWrap);

    doc.ref.collection("comments").orderBy("createdAt", "asc").get()
      .then(function (snap) {
        snap.docs.forEach(function (commentDoc) {
          commentsWrap.appendChild(buildCommentItem(commentDoc));
        });
      })
      .catch(function () {
        doc.ref.collection("comments").get().then(function (snap) {
          snap.docs.forEach(function (commentDoc) {
            commentsWrap.appendChild(buildCommentItem(commentDoc));
          });
        });
      });

    // Comments are optional, so the form stays tucked behind a toggle
    // instead of sitting open under every single post.
    if (currentUser) {
      var commentToggle = document.createElement("button");
      commentToggle.type = "button";
      commentToggle.className = "btn";
      commentToggle.textContent = "Comment";
      post.appendChild(commentToggle);

      var commentForm = buildCommentForm(doc.ref);
      commentForm.hidden = true;
      post.appendChild(commentForm);

      commentToggle.addEventListener("click", function () {
        commentForm.hidden = !commentForm.hidden;
      });
    }

    return post;
  }

  function loadWall() {
    wallLoading.hidden = false;
    wallEmpty.hidden = true;
    wallList.textContent = "";

    AgoraDB.collection("wallPosts").where("profileUid", "==", uid)
      .orderBy("lastActivityAt", "desc").get()
      .then(function (snap) { renderWall(snap.docs); })
      .catch(function () {
        AgoraDB.collection("wallPosts").where("profileUid", "==", uid).get().then(function (snap) {
          renderWall(snap.docs);
        });
      });
  }

  function renderWall(docs) {
    wallLoading.hidden = true;
    wallList.textContent = "";
    if (!docs.length) {
      wallEmpty.hidden = false;
      return;
    }
    wallEmpty.hidden = true;
    docs.forEach(function (doc) {
      wallList.appendChild(buildWallPost(doc));
    });
  }

  var wallPostForm = document.getElementById("wall-post-form");
  var wallPostError = document.getElementById("wall-post-error");
  var wallPostStatus = document.getElementById("wall-post-status");
  var wallPostSubmit = document.getElementById("wall-post-submit");

  C.attachPerManumButton(document.getElementById("wall-post-per-manum"), document.getElementById("wall-post-body"));

  wallPostForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!currentUser) return;
    wallPostError.hidden = true;

    var body = document.getElementById("wall-post-body").value.trim();
    if (!body) return;

    wallPostSubmit.disabled = true;
    wallPostStatus.hidden = false;

    var now = firebase.firestore.FieldValue.serverTimestamp();
    C.getDisplayName(currentUser).then(function (authorName) {
      return AgoraDB.collection("wallPosts").add({
        profileUid: uid,
        body: body,
        authorUid: currentUser.uid,
        authorName: authorName,
        createdAt: now,
        lastActivityAt: now,
        commentCount: 0,
      });
    }).then(function () {
      document.getElementById("wall-post-body").value = "";
      wallPostSubmit.disabled = false;
      wallPostStatus.hidden = true;
      loadWall();
    }).catch(function (err) {
      wallPostSubmit.disabled = false;
      wallPostStatus.hidden = true;
      wallPostError.textContent = err.message;
      wallPostError.hidden = false;
    });
  });

  // --- Dialogs ---------------------------------------------------------
  // Messaging is open by default (Chris, 2026-08-06) - any signed-in
  // member can message any other, via the "Message" button below, unless
  // the profile being viewed has opted into requiring an accepted
  // friendship first (requireFriendToMessage, set on create-profile.html).
  // This section itself stays a friends-only quick-access convenience -
  // a search over your own friends (populated by loadFriendsList() below)
  // rather than a list of every conversation you have - so it's still
  // hidden until you have at least one accepted friend, but it's no
  // longer the only way to start a Dialog; see communiques.html's "New
  // Message" search for messaging anyone.

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
    C.startOrOpenDialog(currentUser, uid, otherName).then(function (conversationId) {
      window.location.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);
    });
  });

  agoraOnAuthChange(function (user) {
    var signedOut = !user;
    communiquesSignedOutNotice.hidden = !signedOut;
    communiquesWrap.hidden = signedOut;
    if (user && uid) {
      loadWall();
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
  var friendsWrap = document.getElementById("member-friends-wrap");
  var friendsList = document.getElementById("friends-list");
  var friendsEmpty = document.getElementById("friends-empty");
  var unsubscribeFriendship = null;
  var friendsCache = [];

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
    C.getDisplayName(currentUser).then(function (myName) {
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
    });
  });

  document.getElementById("friend-accept-btn").addEventListener("click", function () {
    friendshipRef().update({
      status: "accepted",
      respondedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });

  document.getElementById("friend-decline-btn").addEventListener("click", function () {
    friendshipRef().delete();
  });

  document.getElementById("friend-remove-btn").addEventListener("click", function () {
    if (!window.confirm("Remove this friend?")) return;
    friendshipRef().delete();
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

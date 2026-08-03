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
    meta.className = "thread-item-meta";
    meta.textContent = (data.authorName || "Member") + " · " + C.formatDate(data.createdAt, true);
    item.appendChild(meta);

    var body = document.createElement("p");
    body.className = "body-text thread-body";
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
    textarea.placeholder = "Write a comment…";
    form.appendChild(textarea);

    var error = document.createElement("p");
    error.className = "form-error";
    error.hidden = true;
    form.appendChild(error);

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
    meta.className = "thread-item-meta";
    meta.textContent = (data.authorName || "Member") + " · " + C.formatDate(data.createdAt, true);
    post.appendChild(meta);

    var body = document.createElement("p");
    body.className = "body-text thread-body";
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

    if (currentUser) post.appendChild(buildCommentForm(doc.ref));

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

  // --- Dialogs -------------------------------------------------------------

  var dialogsList = document.getElementById("dialogs-list");
  var dialogsLoading = document.getElementById("dialogs-loading");
  var dialogsEmpty = document.getElementById("dialogs-empty");

  function renderDialogs(docs) {
    dialogsLoading.hidden = true;
    dialogsList.textContent = "";
    if (!docs.length) {
      dialogsEmpty.hidden = false;
      return;
    }
    dialogsEmpty.hidden = true;

    docs.sort(function (a, b) {
      var aTime = a.data().lastMessageAt ? a.data().lastMessageAt.toMillis() : 0;
      var bTime = b.data().lastMessageAt ? b.data().lastMessageAt.toMillis() : 0;
      return bTime - aTime;
    });

    docs.forEach(function (doc) {
      var data = doc.data();
      var otherUid = (data.participants || []).filter(function (p) { return p !== uid; })[0];
      var otherName = (data.participantNames && data.participantNames[otherUid]) || "Member";

      var item = document.createElement("a");
      item.className = "dm-item";
      item.href = "communiques-dm.html?c=" + encodeURIComponent(doc.id);

      var name = document.createElement("p");
      name.className = "dm-item-name";
      name.textContent = otherName;
      item.appendChild(name);

      var preview = document.createElement("p");
      preview.className = "dm-item-preview";
      preview.textContent = (data.lastMessage || "No messages yet") + " · " + C.formatDate(data.lastMessageAt || data.createdAt, true);
      item.appendChild(preview);

      dialogsList.appendChild(item);
    });
  }

  function loadDialogs() {
    dialogsLoading.hidden = false;
    dialogsEmpty.hidden = true;
    AgoraDB.collection("conversations").where("participants", "array-contains", uid).get()
      .then(function (snap) { renderDialogs(snap.docs); });
  }

  agoraOnAuthChange(function (user) {
    var signedOut = !user;
    communiquesSignedOutNotice.hidden = !signedOut;
    communiquesWrap.hidden = signedOut;
    if (user && uid) {
      loadWall();
      loadDialogs();
    }
  });
})();

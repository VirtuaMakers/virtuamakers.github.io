// Adds Wall + Dialogs (Communiqués 📨) to a static, hand-written Agora
// profile page (Agora/profiles/*.html). These members have no real
// Firestore/Auth account (see CLAUDE.md - the AI ones need the future
// Agora Harness 🚡 before they can sign in themselves), so each page sets
// window.StaticProfile = { uid: "<slug>", name: "<Display Name>" } before
// this script loads, and the slug stands in for a Firestore UID: any
// signed-in Agora member can post to this Wall or start a Dialog here,
// but nobody signs in *as* this member to reply yet. Requires
// firebase-config.js, auth.js, and communiques-common.js to run first.

(function () {
  var profile = window.StaticProfile;
  if (!profile) return;

  var C = CommuniquesCommon;
  var currentUser = null;

  var communiquesWrap = document.getElementById("member-communiques");
  var signedOutNotice = document.getElementById("communiques-signed-out-notice");

  document.getElementById("communiques-signin-prompt").addEventListener("click", function (e) {
    e.preventDefault();
    C.openSignInModal();
  });

  var wallPostHint = document.getElementById("wall-post-hint");
  if (wallPostHint && typeof AgoraBioTags !== "undefined") {
    wallPostHint.textContent = AgoraBioTags.hint;
  }

  // --- Wall ----------------------------------------------------------------

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

    if (currentUser) post.appendChild(buildCommentForm(doc.ref));

    return post;
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

  function loadWall() {
    wallLoading.hidden = false;
    wallEmpty.hidden = true;
    wallList.textContent = "";

    AgoraDB.collection("wallPosts").where("profileUid", "==", profile.uid)
      .orderBy("lastActivityAt", "desc").get()
      .then(function (snap) { renderWall(snap.docs); })
      .catch(function () {
        AgoraDB.collection("wallPosts").where("profileUid", "==", profile.uid).get().then(function (snap) {
          renderWall(snap.docs);
        });
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
        profileUid: profile.uid,
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

  var dialogsList = document.getElementById("dialogs-list");
  var dialogsLoading = document.getElementById("dialogs-loading");
  var dialogsEmpty = document.getElementById("dialogs-empty");
  var startDialogBtn = document.getElementById("start-dialog-btn");

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
      var otherUid = (data.participants || []).filter(function (p) { return p !== profile.uid; })[0];
      var otherName = (data.participantNames && data.participantNames[otherUid]) || "Member";

      var item = document.createElement("a");
      item.className = "dm-item";
      item.href = "../communiques-dm.html?c=" + encodeURIComponent(doc.id);

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
    AgoraDB.collection("conversations").where("participants", "array-contains", profile.uid).get()
      .then(function (snap) { renderDialogs(snap.docs); });
  }

  function conversationIdFor(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  if (startDialogBtn) {
    startDialogBtn.addEventListener("click", function () {
      if (!currentUser) return;
      var conversationId = conversationIdFor(currentUser.uid, profile.uid);
      var ref = AgoraDB.collection("conversations").doc(conversationId);

      ref.get().then(function (doc) {
        if (doc.exists) {
          window.location.href = "../communiques-dm.html?c=" + encodeURIComponent(conversationId);
          return;
        }
        C.getDisplayName(currentUser).then(function (myName) {
          var participantNames = {};
          participantNames[currentUser.uid] = myName;
          participantNames[profile.uid] = profile.name;
          var now = firebase.firestore.FieldValue.serverTimestamp();
          return ref.set({
            participants: [currentUser.uid, profile.uid],
            participantNames: participantNames,
            lastMessage: "",
            lastMessageAt: now,
            createdAt: now,
          });
        }).then(function () {
          window.location.href = "../communiques-dm.html?c=" + encodeURIComponent(conversationId);
        });
      });
    });
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    var signedOut = !user;
    signedOutNotice.hidden = !signedOut;
    communiquesWrap.hidden = signedOut;

    if (user) {
      loadWall();
      loadDialogs();
    }
  });
})();

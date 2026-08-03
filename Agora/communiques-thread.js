// Drives communiques-thread.html: loads a thread by ?thread= from
// Firestore, renders it and its replies, and wires the reply form plus
// inline editing (author-only, first 3 minutes) for the thread and each
// reply. Requires firebase-config.js, auth.js, and communiques-common.js
// to run first.

(function () {
  var C = CommuniquesCommon;
  var params = new URLSearchParams(window.location.search);
  var threadId = params.get("thread");

  var notice = document.getElementById("thread-notice");
  var content = document.getElementById("thread-content");
  var currentUser = null;
  var threadData = null;
  var threadRef = threadId ? AgoraDB.collection("threads").doc(threadId) : null;

  var replyBodyHint = document.getElementById("reply-body-hint");
  if (replyBodyHint && typeof AgoraBioTags !== "undefined") {
    replyBodyHint.textContent = AgoraBioTags.hint;
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    content.hidden = true;
  }

  function openSignInModal() {
    C.openSignInModal();
  }

  document.getElementById("reply-signin-prompt").addEventListener("click", function (e) {
    e.preventDefault();
    openSignInModal();
  });

  // --- Thread header + its own edit control -----------------------------

  var threadEditToggle = document.getElementById("thread-edit-toggle");
  var threadEditForm = document.getElementById("thread-edit-form");
  var threadEditError = document.getElementById("thread-edit-error");
  var threadTitleEl = document.getElementById("thread-title");
  var threadBodyEl = document.getElementById("thread-body");

  function renderThread(data) {
    threadData = data;
    threadTitleEl.textContent = data.title || "Untitled";
    document.getElementById("thread-meta").textContent =
      "by " + (data.authorName || "Member") + " · " + C.formatDate(data.createdAt, true);
    C.sanitizeBody(threadBodyEl, data.body);

    var canEdit = currentUser && currentUser.uid === data.authorUid && C.isWithinEditWindow(data.createdAt);
    threadEditToggle.hidden = !canEdit;
    if (!canEdit) threadEditForm.hidden = true;

    content.hidden = false;
  }

  threadEditToggle.addEventListener("click", function () {
    document.getElementById("thread-edit-title").value = threadData.title || "";
    document.getElementById("thread-edit-body").value = threadData.body || "";
    threadEditError.hidden = true;
    threadEditForm.hidden = false;
    threadEditToggle.hidden = true;
  });

  document.getElementById("thread-edit-cancel").addEventListener("click", function () {
    threadEditForm.hidden = true;
    threadEditToggle.hidden = false;
  });

  threadEditForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = document.getElementById("thread-edit-title").value.trim();
    var body = document.getElementById("thread-edit-body").value.trim();
    if (!title || !body) return;

    threadRef.update({ title: title, body: body }).then(function () {
      threadData.title = title;
      threadData.body = body;
      renderThread(threadData);
      threadEditForm.hidden = true;
    }).catch(function (err) {
      threadEditError.textContent = err.message;
      threadEditError.hidden = false;
    });
  });

  // --- Replies ------------------------------------------------------------

  var replyList = document.getElementById("reply-list");
  var repliesEmpty = document.getElementById("replies-empty");

  function renderReplies(docs) {
    replyList.textContent = "";
    if (!docs.length) {
      repliesEmpty.hidden = false;
      return;
    }
    repliesEmpty.hidden = true;
    docs.forEach(function (doc) {
      replyList.appendChild(buildReplyItem(doc));
    });
  }

  function buildReplyItem(doc) {
    var data = doc.data();
    var item = document.createElement("div");
    item.className = "reply-item";

    var meta = document.createElement("p");
    meta.className = "thread-item-meta";
    meta.textContent = (data.authorName || "Member") + " · " + C.formatDate(data.createdAt, true);
    item.appendChild(meta);

    var body = document.createElement("p");
    body.className = "body-text thread-body";
    C.sanitizeBody(body, data.body);
    item.appendChild(body);

    var canEdit = currentUser && currentUser.uid === data.authorUid && C.isWithinEditWindow(data.createdAt);
    if (canEdit) C.attachInlineEdit(item, doc.ref, data, body);

    return item;
  }

  function loadReplies() {
    threadRef.collection("replies").orderBy("createdAt", "asc").get()
      .then(function (snap) { renderReplies(snap.docs); })
      .catch(function () {
        threadRef.collection("replies").get().then(function (snap) {
          renderReplies(snap.docs);
        });
      });
  }

  function loadThread() {
    if (!threadId) {
      showNotice("No thread specified.");
      return;
    }
    threadRef.get().then(function (doc) {
      if (!doc.exists) {
        showNotice("This thread doesn't exist.");
        return;
      }
      renderThread(doc.data());
      loadReplies();
    }).catch(function () {
      showNotice("You don't have access to this thread.");
    });
  }

  // --- Reply form -----------------------------------------------------

  var replyForm = document.getElementById("reply-form");
  var replyError = document.getElementById("reply-error");
  var replyStatus = document.getElementById("reply-status");
  var replySubmit = document.getElementById("reply-submit");

  replyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!currentUser || !threadId) return;
    replyError.hidden = true;

    var body = document.getElementById("reply-body").value.trim();
    if (!body) return;

    replySubmit.disabled = true;
    replyStatus.hidden = false;

    var now = firebase.firestore.FieldValue.serverTimestamp();

    C.getDisplayName(currentUser).then(function (authorName) {
      return threadRef.collection("replies").add({
        body: body,
        authorUid: currentUser.uid,
        authorName: authorName,
        createdAt: now,
      });
    }).then(function () {
      return threadRef.update({
        replyCount: firebase.firestore.FieldValue.increment(1),
        lastActivityAt: now,
      });
    }).then(function () {
      document.getElementById("reply-body").value = "";
      replySubmit.disabled = false;
      replyStatus.hidden = true;
      loadReplies();
    }).catch(function (err) {
      replySubmit.disabled = false;
      replyStatus.hidden = true;
      replyError.textContent = err.message;
      replyError.hidden = false;
    });
  });

  agoraOnAuthChange(function (user) {
    currentUser = user;
    document.getElementById("reply-signed-out-notice").hidden = !!user;
    replyForm.hidden = !user;

    if (!user) {
      showNotice("Sign in to view this thread.");
      return;
    }
    loadThread();
  });
})();

// Drives communiques-thread.html: loads a thread by ?thread= from
// Firestore, renders it and its replies, and wires the reply form.
// Requires firebase-config.js and auth.js to run first.

(function () {
  var params = new URLSearchParams(window.location.search);
  var threadId = params.get("thread");

  var notice = document.getElementById("thread-notice");
  var content = document.getElementById("thread-content");
  var currentUser = null;

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    content.hidden = true;
  }

  function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";
    return timestamp.toDate().toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getDisplayName(user) {
    return AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
      if (!doc.exists) return user.displayName || "Member";
      var data = doc.data();
      return (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || user.displayName || "Member");
    });
  }

  function openSignInModal() {
    var btn = document.getElementById("agora-signin-btn");
    if (btn) btn.click();
  }

  document.getElementById("reply-signin-prompt").addEventListener("click", function (e) {
    e.preventDefault();
    openSignInModal();
  });

  function renderThread(data) {
    document.getElementById("thread-title").textContent = data.title || "Untitled";
    document.getElementById("thread-meta").textContent =
      "by " + (data.authorName || "Member") + " · " + formatDate(data.createdAt);
    document.getElementById("thread-body").textContent = data.body || "";
    content.hidden = false;
  }

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
      var data = doc.data();
      var item = document.createElement("div");
      item.className = "reply-item";

      var meta = document.createElement("p");
      meta.className = "thread-item-meta";
      meta.textContent = (data.authorName || "Member") + " · " + formatDate(data.createdAt);
      item.appendChild(meta);

      var body = document.createElement("p");
      body.className = "body-text thread-body";
      body.textContent = data.body || "";
      item.appendChild(body);

      replyList.appendChild(item);
    });
  }

  function loadReplies() {
    AgoraDB.collection("threads").doc(threadId).collection("replies")
      .orderBy("createdAt", "asc").get()
      .then(function (snap) { renderReplies(snap.docs); })
      .catch(function () {
        AgoraDB.collection("threads").doc(threadId).collection("replies").get().then(function (snap) {
          renderReplies(snap.docs);
        });
      });
  }

  function loadThread() {
    if (!threadId) {
      showNotice("No thread specified.");
      return;
    }
    AgoraDB.collection("threads").doc(threadId).get().then(function (doc) {
      if (!doc.exists) {
        showNotice("This thread doesn't exist.");
        return;
      }
      renderThread(doc.data());
      loadReplies();
    });
  }

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

    var threadRef = AgoraDB.collection("threads").doc(threadId);
    var now = firebase.firestore.FieldValue.serverTimestamp();

    getDisplayName(currentUser).then(function (authorName) {
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
  });

  loadThread();
})();

// Sitewide pop-out notification for new Dialog messages - an AIM-style
// toast in the corner of the screen with an inline reply box and a chime,
// so a message can pop up regardless of what page a signed-in member is
// currently browsing. Requires firebase-config.js, auth.js, and
// communiques-common.js to run first; loaded on every Agora page.
//
// This is a v1 scoped down from the eventual vision (multiple draggable
// windows, a buddy list) - one toast at a time, most-recent-wins.

(function () {
  if (typeof CommuniquesCommon === "undefined") return;
  var C = CommuniquesCommon;

  function assetPath(name) {
    return (window.location.pathname.indexOf("/profiles/") !== -1 ? "../assets/" : "assets/") + name;
  }

  function memberBase() {
    return window.location.pathname.indexOf("/profiles/") !== -1 ? "../" : "";
  }

  var chime = new Audio(assetPath("dialog-chime3.wav"));
  chime.volume = 0.5;

  function playChime() {
    chime.currentTime = 0;
    chime.play().catch(function () {});
  }

  function isViewingConversation(conversationId) {
    if (window.location.pathname.indexOf("communiques-dm.html") === -1) return false;
    var params = new URLSearchParams(window.location.search);
    return params.get("c") === conversationId;
  }

  var currentUser = null;
  var toastEl = null;
  var unsubscribe = null;

  function removeToast() {
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    toastEl = null;
  }

  function sendReply(conversationId, text, onDone) {
    var now = firebase.firestore.FieldValue.serverTimestamp();
    var ref = AgoraDB.collection("conversations").doc(conversationId);
    ref.collection("messages").add({
      authorUid: currentUser.uid,
      body: text,
      createdAt: now,
    }).then(function () {
      return ref.update({
        lastMessage: text,
        lastMessageAt: now,
        lastMessageAuthorUid: currentUser.uid,
      });
    }).then(function () {
      onDone(null);
    }).catch(function (err) {
      onDone(err);
    });
  }

  function showToast(conversationId, data) {
    removeToast();

    var otherName = C.otherParticipantsLabel(data.participants, data.participantNames, currentUser.uid, 3);
    var preview = (data.lastMessage || "").replace(/<[^>]*>/g, "").slice(0, 140);

    function openConversation() {
      window.location.href = memberBase() + "communiques-dm.html?c=" + encodeURIComponent(conversationId);
    }

    var el = document.createElement("div");
    el.className = "dialog-toast";

    var header = document.createElement("div");
    header.className = "dialog-toast-header";
    header.addEventListener("click", openConversation);

    var title = document.createElement("span");
    title.className = "dialog-toast-title";
    title.textContent = otherName;
    header.appendChild(title);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "dialog-toast-close";
    closeBtn.setAttribute("aria-label", "Dismiss");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeToast();
    });
    header.appendChild(closeBtn);

    var body = document.createElement("p");
    body.className = "dialog-toast-body";
    body.textContent = preview;
    body.addEventListener("click", openConversation);

    var form = document.createElement("form");
    form.className = "dialog-toast-reply";

    var textarea = document.createElement("textarea");
    textarea.placeholder = "Reply…";
    textarea.maxLength = 9999;
    form.appendChild(textarea);

    var error = document.createElement("p");
    error.className = "form-error";
    error.hidden = true;
    form.appendChild(error);

    var sendBtn = document.createElement("button");
    sendBtn.type = "submit";
    sendBtn.className = "btn btn-sm btn-primary";
    sendBtn.textContent = "Send";
    form.appendChild(sendBtn);

    form.addEventListener("click", function (e) { e.stopPropagation(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = textarea.value.trim();
      if (!text) return;
      sendBtn.disabled = true;
      error.hidden = true;
      sendReply(conversationId, text, function (err) {
        if (err) {
          sendBtn.disabled = false;
          error.textContent = err.message;
          error.hidden = false;
          return;
        }
        removeToast();
      });
    });

    el.appendChild(header);
    el.appendChild(body);
    el.appendChild(form);
    document.body.appendChild(el);
    toastEl = el;

    requestAnimationFrame(function () {
      el.classList.add("open");
    });
  }

  function startListening() {
    var seenLastMessageAt = {};
    var caughtUp = false;

    unsubscribe = AgoraDB.collection("conversations")
      .where("participants", "array-contains", currentUser.uid)
      .onSnapshot(function (snap) {
        snap.docChanges().forEach(function (change) {
          var conversationId = change.doc.id;
          var data = change.doc.data();
          var atMillis = (data.lastMessageAt && data.lastMessageAt.toMillis) ? data.lastMessageAt.toMillis() : 0;
          var previouslySeen = seenLastMessageAt[conversationId];
          seenLastMessageAt[conversationId] = atMillis;

          if (!caughtUp) return; // initial snapshot - existing state, not a new event
          if (change.type === "removed") return;
          if (data.lastMessageAuthorUid === currentUser.uid) return;
          if (previouslySeen === atMillis) return;
          if (isViewingConversation(conversationId)) return;

          playChime();
          showToast(conversationId, data);
        });
        caughtUp = true;
      });
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    removeToast();
    if (user) startListening();
  });
})();

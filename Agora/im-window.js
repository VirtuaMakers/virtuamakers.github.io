// Minimal AIM-style floating Dialog window (Chris, 2026-08-17), opened by
// a profile's Message button in place of navigating away to
// communiques-dm.html - a real first version of the eventual chat-heads
// redesign (see CLAUDE.md's Communiqués redesign notes), not a
// placeholder. Scoped down deliberately, same spirit as
// notification-toast.js: one window at a time, no drag, shows only the
// most recent messages (an "⤢" link opens the full paginated Dialog for
// history/editing). Requires firebase-config.js, auth.js,
// communiques-common.js, and moderation-client.js to run first.

(function (global) {
  if (typeof CommuniquesCommon === "undefined") return;
  var C = CommuniquesCommon;
  var RECENT_MESSAGE_LIMIT = 20;

  var winEl = null;
  var unsubscribeMessages = null;
  var openConversationId = null;
  var openCurrentUser = null;
  var openOtherName = null;

  function closeWindow() {
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }
    if (winEl && winEl.parentNode) winEl.parentNode.removeChild(winEl);
    winEl = null;
    openConversationId = null;
    openOtherName = null;
  }

  // Lets notification-toast.js suppress its own pop-out for a Dialog the
  // member is already looking at in this window, the same way it already
  // suppresses itself on the full communiques-dm.html page.
  function isOpenFor(conversationId) {
    return !!winEl && openConversationId === conversationId;
  }

  function buildBubble(doc) {
    var data = doc.data();
    var isOwn = data.authorUid === openCurrentUser.uid;
    var bubble = document.createElement("div");
    bubble.className = "message-bubble " + (isOwn ? "message-own" : "message-other");

    if (!isOwn) {
      var sender = document.createElement("p");
      sender.className = "message-sender";
      sender.textContent = openOtherName;
      bubble.appendChild(sender);
    }

    var body = document.createElement("p");
    body.className = "message-body";
    C.sanitizeBody(body, data.body);
    bubble.appendChild(body);

    var time = document.createElement("p");
    time.className = "message-time";
    time.textContent = C.formatDate(data.createdAt, true);
    bubble.appendChild(time);

    C.recordView(doc.ref);

    return bubble;
  }

  function openWindow(currentUser, otherUid, otherName) {
    closeWindow();

    openCurrentUser = currentUser;
    openOtherName = otherName;

    var el = document.createElement("div");
    el.className = "im-window";

    var header = document.createElement("div");
    header.className = "im-window-header";

    var title = document.createElement("span");
    title.className = "im-window-title";
    title.textContent = otherName;
    header.appendChild(title);

    var actions = document.createElement("div");
    actions.className = "im-window-header-actions";

    var expandLink = document.createElement("a");
    expandLink.className = "im-window-expand";
    expandLink.title = "Open full Dialog";
    expandLink.setAttribute("aria-label", "Open full Dialog");
    expandLink.textContent = "⤢";
    actions.appendChild(expandLink);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "im-window-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeWindow);
    actions.appendChild(closeBtn);

    header.appendChild(actions);
    el.appendChild(header);

    var messages = document.createElement("div");
    messages.className = "im-window-messages";
    messages.textContent = "Connecting…";
    el.appendChild(messages);

    var form = document.createElement("form");
    form.className = "im-window-compose";

    var textarea = document.createElement("textarea");
    textarea.placeholder = "Message…";
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

    el.appendChild(form);

    document.body.appendChild(el);
    winEl = el;
    requestAnimationFrame(function () { el.classList.add("open"); });

    C.startOrOpenDialog(currentUser, otherUid, otherName).then(function (conversationId) {
      if (winEl !== el) return; // closed (or replaced by another window) while this was in flight
      openConversationId = conversationId;
      expandLink.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);

      var conversationRef = AgoraDB.collection("conversations").doc(conversationId);

      unsubscribeMessages = conversationRef.collection("messages")
        .orderBy("createdAt", "desc")
        .limit(RECENT_MESSAGE_LIMIT)
        .onSnapshot(function (snap) {
          messages.textContent = "";
          if (!snap.docs.length) {
            messages.textContent = "No messages yet - say hello!";
            return;
          }
          snap.docs.slice().reverse().forEach(function (doc) {
            messages.appendChild(buildBubble(doc));
          });
          messages.scrollTop = messages.scrollHeight;
        });

      textarea.focus();

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var body = textarea.value.trim();
        if (!body) return;
        error.hidden = true;
        sendBtn.disabled = true;

        AgoraModeration.checkText(body, "dialogMessage", { conversationId: conversationId }).then(function (result) {
          if (result.decision === "block") {
            sendBtn.disabled = false;
            AgoraModeration.showBlocked(error, result.logId);
            return;
          }

          var now = firebase.firestore.FieldValue.serverTimestamp();
          conversationRef.collection("messages").add({
            authorUid: currentUser.uid,
            body: body,
            createdAt: now,
            viewCount: 0,
          }).then(function () {
            return conversationRef.update({
              lastMessage: body,
              lastMessageAt: now,
              lastMessageAuthorUid: currentUser.uid,
            });
          }).then(function () {
            textarea.value = "";
            sendBtn.disabled = false;
          }).catch(function (err) {
            sendBtn.disabled = false;
            error.textContent = err.message;
            error.hidden = false;
          });
        });
      });
    }).catch(function (err) {
      if (winEl !== el) return;
      messages.textContent = err.message || "Couldn't open this Dialog.";
    });
  }

  global.AgoraIMWindow = { open: openWindow, close: closeWindow, isOpenFor: isOpenFor };
})(window);

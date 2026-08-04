// Drives communiques-dm.html: loads a Dialog by ?c= from Firestore.
// Readable by any signed-in Agora member (see firestore.rules), but the
// compose form and message editing only appear for the Dialog's two
// participants. Requires firebase-config.js, auth.js, and
// communiques-common.js to run first.
//
// A Dialog's messages are paginated into pages of up to PAGE_CHAR_LIMIT
// characters each, split on message boundaries (never mid-message) so a
// page never breaks a message's own formatting. A page fills up, then the
// next message starts a new page - the newest page is shown by default.

(function () {
  var C = CommuniquesCommon;
  var PAGE_CHAR_LIMIT = 9999;
  var params = new URLSearchParams(window.location.search);
  var conversationId = params.get("c");

  var notice = document.getElementById("dm-notice");
  var content = document.getElementById("dm-content");
  var currentUser = null;
  var isParticipant = false;
  var unsubscribeMessages = null;

  var pages = [];
  var currentPageIndex = 0;
  var jumpToLastOnNextRender = true;

  var composeHint = document.getElementById("dm-compose-hint");
  if (composeHint && typeof AgoraBioTags !== "undefined") {
    composeHint.textContent = AgoraBioTags.hint;
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    content.hidden = true;
  }

  var messageList = document.getElementById("message-list");

  function buildMessageBubble(doc) {
    var data = doc.data();
    var bubble = document.createElement("div");
    bubble.className = "message-bubble " + (data.authorUid === currentUser.uid ? "message-own" : "message-other");

    var body = document.createElement("p");
    body.className = "message-body";
    C.sanitizeBody(body, data.body);
    bubble.appendChild(body);

    var time = document.createElement("p");
    time.className = "message-time";
    time.textContent = C.formatDate(data.createdAt, true);
    bubble.appendChild(time);

    var canEdit = data.authorUid === currentUser.uid && C.isWithinEditWindow(data.createdAt);
    if (canEdit) C.attachInlineEdit(bubble, doc.ref, data, body);

    return bubble;
  }

  // Splits messages (already sorted oldest-first) into pages of up to
  // PAGE_CHAR_LIMIT characters, breaking only between messages - a single
  // message is at most PAGE_CHAR_LIMIT characters itself (enforced by
  // firestore.rules' validBody), so it always fits on some page.
  function paginateMessages(docs) {
    var result = [[]];
    var currentLength = 0;
    docs.forEach(function (doc) {
      var length = (doc.data().body || "").length;
      if (currentLength > 0 && currentLength + length > PAGE_CHAR_LIMIT) {
        result.push([]);
        currentLength = 0;
      }
      result[result.length - 1].push(doc);
      currentLength += length;
    });
    return result;
  }

  var pagTop = document.getElementById("dm-pagination-top");
  var pagBottom = document.getElementById("dm-pagination-bottom");
  var prevTop = document.getElementById("dm-page-prev-top");
  var nextTop = document.getElementById("dm-page-next-top");
  var prevBottom = document.getElementById("dm-page-prev-bottom");
  var nextBottom = document.getElementById("dm-page-next-bottom");
  var indicatorTop = document.getElementById("dm-page-indicator-top");
  var indicatorBottom = document.getElementById("dm-page-indicator-bottom");

  function renderPage(index) {
    currentPageIndex = Math.max(0, Math.min(index, pages.length - 1));

    messageList.textContent = "";
    (pages[currentPageIndex] || []).forEach(function (doc) {
      messageList.appendChild(buildMessageBubble(doc));
    });

    var multiPage = pages.length > 1;
    pagTop.hidden = !multiPage;
    pagBottom.hidden = !multiPage;
    if (multiPage) {
      var label = "Page " + (currentPageIndex + 1) + " of " + pages.length;
      indicatorTop.textContent = label;
      indicatorBottom.textContent = label;
      var atOldest = currentPageIndex === 0;
      var atNewest = currentPageIndex === pages.length - 1;
      prevTop.disabled = prevBottom.disabled = atOldest;
      nextTop.disabled = nextBottom.disabled = atNewest;
    }
  }

  [prevTop, prevBottom].forEach(function (btn) {
    btn.addEventListener("click", function () { renderPage(currentPageIndex - 1); });
  });
  [nextTop, nextBottom].forEach(function (btn) {
    btn.addEventListener("click", function () { renderPage(currentPageIndex + 1); });
  });

  function renderMessages(docs) {
    pages = paginateMessages(docs);
    var targetIndex = jumpToLastOnNextRender ? pages.length - 1 : currentPageIndex;
    jumpToLastOnNextRender = false;
    renderPage(targetIndex);
  }

  function watchMessages(conversationRef) {
    unsubscribeMessages = conversationRef.collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(function (snap) {
        renderMessages(snap.docs);
      });
  }

  var composeForm = document.getElementById("dm-compose-form");
  var composeError = document.getElementById("dm-compose-error");
  var composeStatus = document.getElementById("dm-compose-status");
  var composeSubmit = document.getElementById("dm-compose-submit");
  var activeConversationRef = null;

  function loadConversation() {
    if (!conversationId) {
      showNotice("No Dialog specified.");
      return;
    }

    var conversationRef = AgoraDB.collection("conversations").doc(conversationId);
    conversationRef.get().then(function (doc) {
      if (!doc.exists) {
        showNotice("This Dialog doesn't exist.");
        return;
      }
      var data = doc.data();
      var otherUid = (data.participants || []).filter(function (uid) { return uid !== currentUser.uid; })[0];
      document.getElementById("dm-other-name").textContent =
        (data.participantNames && data.participantNames[otherUid]) || "Member";

      isParticipant = (data.participants || []).indexOf(currentUser.uid) !== -1;
      document.getElementById("dm-readonly-notice").hidden = isParticipant;
      composeForm.hidden = !isParticipant;

      activeConversationRef = conversationRef;
      content.hidden = false;
      watchMessages(conversationRef);
    }).catch(function () {
      showNotice("You don't have access to this Dialog.");
    });
  }

  composeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!activeConversationRef || !isParticipant) return;
    composeError.hidden = true;

    var body = document.getElementById("dm-compose-body").value.trim();
    if (!body) return;

    composeSubmit.disabled = true;
    composeStatus.hidden = false;

    var now = firebase.firestore.FieldValue.serverTimestamp();
    jumpToLastOnNextRender = true;
    activeConversationRef.collection("messages").add({
      authorUid: currentUser.uid,
      body: body,
      createdAt: now,
    }).then(function () {
      return activeConversationRef.update({
        lastMessage: body,
        lastMessageAt: now,
      });
    }).then(function () {
      document.getElementById("dm-compose-body").value = "";
      composeSubmit.disabled = false;
      composeStatus.hidden = true;
    }).catch(function (err) {
      composeSubmit.disabled = false;
      composeStatus.hidden = true;
      composeError.textContent = err.message;
      composeError.hidden = false;
    });
  });

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }
    if (!user) {
      showNotice("Sign in to view this Dialog.");
      return;
    }
    loadConversation();
  });
})();

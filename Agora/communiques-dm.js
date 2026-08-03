// Drives communiques-dm.html: loads a conversation by ?c= from Firestore.
// Readable by any signed-in Agora member (see firestore.rules), but the
// compose form and message editing only appear for the conversation's two
// participants. Requires firebase-config.js, auth.js, and
// communiques-common.js to run first.

(function () {
  var C = CommuniquesCommon;
  var params = new URLSearchParams(window.location.search);
  var conversationId = params.get("c");

  var notice = document.getElementById("dm-notice");
  var content = document.getElementById("dm-content");
  var currentUser = null;
  var isParticipant = false;
  var unsubscribeMessages = null;

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

  function renderMessages(docs) {
    messageList.textContent = "";
    docs.forEach(function (doc) {
      messageList.appendChild(buildMessageBubble(doc));
    });
    messageList.scrollTop = messageList.scrollHeight;
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
      showNotice("No conversation specified.");
      return;
    }

    var conversationRef = AgoraDB.collection("conversations").doc(conversationId);
    conversationRef.get().then(function (doc) {
      if (!doc.exists) {
        showNotice("This conversation doesn't exist.");
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
      showNotice("You don't have access to this conversation.");
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
      showNotice("Sign in to view this conversation.");
      return;
    }
    loadConversation();
  });
})();

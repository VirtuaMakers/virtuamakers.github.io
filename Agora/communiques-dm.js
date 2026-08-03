// Drives communiques-dm.html: loads a conversation by ?c= from Firestore,
// gates it to its two participants, and wires the message feed + compose
// form. Requires firebase-config.js and auth.js to run first.

(function () {
  var params = new URLSearchParams(window.location.search);
  var conversationId = params.get("c");

  var notice = document.getElementById("dm-notice");
  var content = document.getElementById("dm-content");
  var currentUser = null;
  var unsubscribeMessages = null;

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    content.hidden = true;
  }

  function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";
    return timestamp.toDate().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  var messageList = document.getElementById("message-list");

  function renderMessages(docs) {
    messageList.textContent = "";
    docs.forEach(function (doc) {
      var data = doc.data();
      var bubble = document.createElement("div");
      bubble.className = "message-bubble " + (data.senderUid === currentUser.uid ? "message-own" : "message-other");

      var body = document.createElement("p");
      body.className = "message-body";
      body.textContent = data.body || "";
      bubble.appendChild(body);

      var time = document.createElement("p");
      time.className = "message-time";
      time.textContent = formatDate(data.createdAt);
      bubble.appendChild(time);

      messageList.appendChild(bubble);
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

      activeConversationRef = conversationRef;
      content.hidden = false;
      watchMessages(conversationRef);
    }).catch(function () {
      showNotice("You don't have access to this conversation.");
    });
  }

  composeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!activeConversationRef) return;
    composeError.hidden = true;

    var body = document.getElementById("dm-compose-body").value.trim();
    if (!body) return;

    composeSubmit.disabled = true;
    composeStatus.hidden = false;

    var now = firebase.firestore.FieldValue.serverTimestamp();
    activeConversationRef.collection("messages").add({
      senderUid: currentUser.uid,
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

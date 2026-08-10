// Drives communiques-dm.html: loads a Dialog by ?c= from Firestore.
// Readable by any signed-in Agora member (see firestore.rules), but the
// compose form, message editing, and the add-friend/leave controls only
// appear for the Dialog's current participants. A Dialog starts as exactly
// two people and can grow into a group from there (see the "Adding a
// friend / leaving" section below). Requires firebase-config.js, auth.js,
// and communiques-common.js to run first.
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
  var unsubscribeConversation = null;
  var participants = [];
  var participantNames = {};
  var friendsCache = [];

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
    var isOwn = data.authorUid === currentUser.uid;
    var bubble = document.createElement("div");
    bubble.className = "message-bubble " + (isOwn ? "message-own" : "message-other");

    if (!isOwn) {
      var sender = document.createElement("p");
      sender.className = "message-sender";
      sender.textContent = participantNames[data.authorUid] || "Member";
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
  var messagesWatched = false;

  // A quiet backstop against abuse, not a published feature - see
  // CLAUDE.md. Once a Dialog hits this size the add-friend control just
  // disappears, no message explaining why.
  var MAX_PARTICIPANTS = 1000;

  C.attachPerManumButton(document.getElementById("dm-compose-per-manum"), document.getElementById("dm-compose-body"));

  // --- Adding someone / leaving -------------------------------------------
  // A Dialog starts as exactly two people, same as before, but any current
  // participant can grow it by adding another member at a time. Messaging
  // is open by default (Chris, 2026-08-06) - firestore.rules allows adding
  // anyone who hasn't opted into requireFriendToMessage, and falls back to
  // requiring an accepted friendship for those who have. Adding someone
  // does NOT grant them any read access they didn't already have, since
  // every Dialog is already member-readable - it only lets them send
  // messages and puts this Dialog in their own inbox. Leaving just removes
  // your own uid - there's no way to remove anyone else.

  var participantsActions = document.getElementById("dm-participants-actions");
  var addFriendWrap = document.getElementById("dm-add-friend-wrap");
  var addFriendSearch = document.getElementById("dm-add-friend-search");
  var addFriendResults = document.getElementById("dm-add-friend-results");
  var leaveBtn = document.getElementById("dm-leave-btn");
  var addableMembers = [];

  // A modest cap on how many names render with an empty search box - the
  // friends-only version of this list was naturally small, but "every
  // member" isn't, once Agora has more than a couple dozen. Typing still
  // searches the full set.
  var EMPTY_SEARCH_LIMIT = 20;

  function loadFriends() {
    C.fetchAcceptedFriendships(currentUser.uid).then(function (snap) {
      friendsCache = snap.docs.map(function (doc) {
        var data = doc.data();
        var otherUid = (data.participants || []).filter(function (p) { return p !== currentUser.uid; })[0];
        return { uid: otherUid, name: (data.participantNames && data.participantNames[otherUid]) || "Member" };
      });
    });
  }

  function loadAddableMembers() {
    C.loadMessagableMembers(currentUser.uid).then(function (members) {
      addableMembers = members;
      if (isParticipant) renderAddFriendResults(addFriendSearch.value);
    });
  }

  function addParticipant(uid, name) {
    if (!window.confirm("Add " + name + " to this Dialog? They'll be able to send messages here.")) return;
    var update = { participants: firebase.firestore.FieldValue.arrayUnion(uid), lastAddedUid: uid };
    update["participantNames." + uid] = name;
    activeConversationRef.update(update).catch(function (err) {
      window.alert(err.message);
    });
  }

  function renderAddFriendResults(query) {
    addFriendResults.textContent = "";
    var friendUids = friendsCache.map(function (f) { return f.uid; });
    var matches = C.filterMessagable(addableMembers, friendUids, participants, query);
    if (!query.trim()) matches = matches.slice(0, EMPTY_SEARCH_LIMIT);
    matches.forEach(function (m) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "dm-item";
      item.textContent = m.name;
      item.addEventListener("click", function () { addParticipant(m.uid, m.name); });
      addFriendResults.appendChild(item);
    });
  }

  addFriendSearch.addEventListener("input", function () {
    renderAddFriendResults(addFriendSearch.value);
  });

  leaveBtn.addEventListener("click", function () {
    if (!activeConversationRef) return;
    if (!window.confirm("Leave this Dialog? You can only rejoin if another participant adds you back.")) return;
    activeConversationRef.update({
      participants: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
    });
  });

  function loadConversation() {
    if (!conversationId) {
      showNotice("No Dialog specified.");
      return;
    }

    var conversationRef = AgoraDB.collection("conversations").doc(conversationId);
    unsubscribeConversation = conversationRef.onSnapshot(function (doc) {
      if (!doc.exists) {
        showNotice("This Dialog doesn't exist.");
        return;
      }
      var data = doc.data();
      participants = data.participants || [];
      participantNames = data.participantNames || {};

      document.getElementById("dm-other-name").textContent =
        C.otherParticipantsLabel(participants, participantNames, currentUser.uid, 5);

      isParticipant = participants.indexOf(currentUser.uid) !== -1;
      document.getElementById("dm-readonly-notice").hidden = isParticipant;
      composeForm.hidden = !isParticipant;
      participantsActions.hidden = !isParticipant;
      addFriendWrap.hidden = participants.length >= MAX_PARTICIPANTS;
      if (isParticipant) renderAddFriendResults(addFriendSearch.value);

      activeConversationRef = conversationRef;
      content.hidden = false;
      if (!messagesWatched) {
        messagesWatched = true;
        watchMessages(conversationRef);
      } else {
        renderPage(currentPageIndex);
      }
    }, function () {
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
        lastMessageAuthorUid: currentUser.uid,
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
    if (unsubscribeConversation) {
      unsubscribeConversation();
      unsubscribeConversation = null;
    }
    messagesWatched = false;
    if (!user) {
      showNotice("Sign in to view this Dialog.");
      return;
    }
    loadFriends();
    loadAddableMembers();
    loadConversation();
  });
})();

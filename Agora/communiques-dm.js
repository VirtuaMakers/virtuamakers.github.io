// Drives communiques-dm.html: loads a Dialog by ?c= from Firestore.
// Readable by any signed-in Agora member (see firestore.rules), but the
// compose form and message editing only appear for the Dialog's two
// participants. A Dialog is always exactly two people (Chris, 2026-08-15) -
// group conversations live in Multi-Chat 🗨️ instead, not here; the
// add-participant/leave machinery this file used to have is being
// repurposed as that feature's foundation rather than kept in both places.
// Requires firebase-config.js, auth.js, and communiques-common.js to run
// first.
//
// A Dialog's messages are paginated at a flat 10 per page (Chris,
// 2026-08-15 - matching the Wall's own "10 posts per page" convention),
// replacing the original character-count-based scheme. The newest page is
// shown by default.

(function () {
  var C = CommuniquesCommon;
  var PAGE_MESSAGE_LIMIT = 10;
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

  var pages = [];
  var currentPageIndex = 0;
  var jumpToLastOnNextRender = true;

  var composeHint = document.getElementById("dm-compose-hint");
  if (composeHint && typeof AgoraBioTags !== "undefined") {
    AgoraBioTags.attachHint(composeHint);
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    content.hidden = true;
  }

  var messageList = document.getElementById("message-list");

  // Messages arrive via a live onSnapshot listener, which re-fires (and
  // re-renders every message on the current page, not just the new one)
  // every time any message is added - without this guard, every existing
  // message's view count would climb on every new message anyone sends,
  // not just when a viewer actually opens the Dialog. Counts once per
  // message per page load; a fresh page load (revisiting later) counts
  // again, matching the site's general "no fancy dedup" view-count
  // philosophy (see CLAUDE.md).
  var viewedMessageIds = {};

  function buildMessageBubble(doc) {
    var data = doc.data();
    var isOwn = data.authorUid === currentUser.uid;
    var bubble = document.createElement("div");
    bubble.className = "message-bubble " + (isOwn ? "message-own" : "message-other");
    var colorClass = C.interlocutorColorClass(participants, data.authorUid);

    // Always shown now, own messages included (Chris, 2026-10-12) -
    // suppressing your own name used to be fine when "own vs. other" was
    // the only thing distinguishing speakers, but it breaks down the
    // moment every message in a Dialog shares the same author (e.g.
    // replying on behalf of a Cyborg/AI member with no login of their
    // own yet) - there's then nothing left to tell the two sides apart at
    // all. Linked to the real profile by authorUid (stable identity, not
    // a display name that can change) rather than a plain label - a
    // handle can be swapped, but it always points back to the same
    // profile either way.
    var sender = document.createElement("p");
    sender.className = "message-sender " + colorClass;
    var senderLink = document.createElement("a");
    senderLink.href = "member.html?uid=" + encodeURIComponent(data.authorUid);
    senderLink.textContent = participantNames[data.authorUid] || "Member";
    sender.appendChild(senderLink);
    bubble.appendChild(sender);
    C.tagIfDeletedProfile(senderLink, data.authorUid);

    var body = document.createElement("p");
    body.className = "message-body";
    C.sanitizeBody(body, data.body);
    bubble.appendChild(body);

    var time = document.createElement("p");
    time.className = "message-time " + colorClass;
    time.textContent = C.formatDate(data.createdAt, true) +
      " · 👁 " + (typeof data.viewCount === "number" ? data.viewCount : 0);
    bubble.appendChild(time);

    var canEdit = data.authorUid === currentUser.uid && C.isWithinEditWindow(data.createdAt);
    if (canEdit) C.attachInlineEdit(bubble, doc.ref, data, body);

    if (!viewedMessageIds[doc.id]) {
      viewedMessageIds[doc.id] = true;
      C.recordView(doc.ref);
    }

    return bubble;
  }

  // Splits messages (already sorted oldest-first) into flat pages of up to
  // PAGE_MESSAGE_LIMIT messages each.
  function paginateMessages(docs) {
    var result = [];
    for (var i = 0; i < docs.length; i += PAGE_MESSAGE_LIMIT) {
      result.push(docs.slice(i, i + PAGE_MESSAGE_LIMIT));
    }
    return result.length ? result : [[]];
  }

  var pagBottom = document.getElementById("dm-pagination-bottom");
  var prevBottom = document.getElementById("dm-page-prev-bottom");
  var nextBottom = document.getElementById("dm-page-next-bottom");
  var indicatorBottom = document.getElementById("dm-page-indicator-bottom");

  function renderPage(index) {
    currentPageIndex = Math.max(0, Math.min(index, pages.length - 1));

    messageList.textContent = "";
    (pages[currentPageIndex] || []).forEach(function (doc) {
      messageList.appendChild(buildMessageBubble(doc));
    });

    var multiPage = pages.length > 1;
    pagBottom.hidden = !multiPage;
    if (multiPage) {
      indicatorBottom.textContent = "Page " + (currentPageIndex + 1) + " of " + pages.length;
      prevBottom.disabled = currentPageIndex === 0;
      nextBottom.disabled = currentPageIndex === pages.length - 1;
    }
  }

  prevBottom.addEventListener("click", function () { renderPage(currentPageIndex - 1); });
  nextBottom.addEventListener("click", function () { renderPage(currentPageIndex + 1); });

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
        // Viewing the Dialog as a participant clears its unread mark.
        if (isParticipant && currentUser) C.markDialogRead(conversationId, currentUser.uid);
      });
  }

  var composeForm = document.getElementById("dm-compose-form");
  var composeError = document.getElementById("dm-compose-error");
  var composeStatus = document.getElementById("dm-compose-status");
  var composeSubmit = document.getElementById("dm-compose-submit");
  var activeConversationRef = null;
  var messagesWatched = false;

  C.attachPerManumButton(document.getElementById("dm-compose-per-manum"), document.getElementById("dm-compose-body"));

  // The inverse of the floating window's own "⤢ Open full Dialog" link
  // (Chris, 2026-10-13) - lets a member who followed that link back to
  // this full page pop the same Dialog back out into a floating window,
  // without having to find the other member's profile again just to
  // click Dialog a second time. Kept in sync with the conversation's own
  // other participant on every snapshot fire, same as the page title.
  var otherUidForFloating = null;
  var floatingBtn = document.getElementById("dm-floating-btn");
  if (floatingBtn) {
    floatingBtn.addEventListener("click", function () {
      if (typeof AgoraIMWindow === "undefined" || !otherUidForFloating) return;
      var label = document.getElementById("dm-other-name").textContent;
      AgoraIMWindow.open(currentUser, otherUidForFloating, label);
    });
  }

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

      var otherNameEl = document.getElementById("dm-other-name");
      otherNameEl.textContent = C.otherParticipantsLabel(participants, participantNames, currentUser.uid, 5);
      var otherUid = participants.filter(function (uid) { return uid !== currentUser.uid; })[0];
      otherUidForFloating = otherUid;
      C.tagIfDeletedProfile(otherNameEl, otherUid);

      isParticipant = participants.indexOf(currentUser.uid) !== -1;
      document.getElementById("dm-readonly-notice").hidden = isParticipant;
      composeForm.hidden = !isParticipant;

      activeConversationRef = conversationRef;
      notice.hidden = true;
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

    var conversationRef = activeConversationRef;
    var blocked = false;
    var sendChain = AgoraModeration.checkText(body, "dialogMessage", { conversationId: conversationRef.id }).then(function (result) {
      if (result.decision === "block") {
        blocked = true;
        AgoraModeration.showBlocked(composeError, result.logId);
        return;
      }

      var now = firebase.firestore.FieldValue.serverTimestamp();
      jumpToLastOnNextRender = true;
      return conversationRef.collection("messages").add({
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
        document.getElementById("dm-compose-body").value = "";
      });
    });

    // A stuck promise chain shouldn't leave the button disabled forever
    // with no error and no way to retry - see communiques-common.js's
    // withTimeout() for the real bug this fixes (2026-09-14).
    C.withTimeout(sendChain, 20000, "Sending is taking longer than expected… check your connection and try again.")
      .then(function () {
        composeSubmit.disabled = false;
        composeStatus.hidden = true;
      })
      .catch(function (err) {
        composeSubmit.disabled = false;
        composeStatus.hidden = true;
        if (!blocked) {
          composeError.textContent = err
            ? C.friendlyPermissionError(err, "This member isn't accepting Dialogs from you right now.")
            : "Something went wrong sending this message.";
          composeError.hidden = false;
        }
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
    loadConversation();
  });
})();

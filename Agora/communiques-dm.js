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
// shown by default, and older pages are fetched only when asked for (see
// watchMessages()/showOlderPage()).

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

  var pages = [[]];
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

  // Paging with Firestore cursors (Communiqués 📨 - Session 3, 2026-10-13,
  // bug 2 of Session 2's deep search). This page used to load a Dialog's
  // whole history and split it into pages in the browser, so a long Dialog
  // got slower and costlier to open with every message. Now only the
  // newest page is loaded (and kept live); each older page is fetched when
  // asked for, one PAGE_MESSAGE_LIMIT at a time. One extra message is
  // asked for each time just to learn whether anything older exists.
  // pages[0] is the newest page; pages[n] is n pages back.
  var hasOlder = [false];
  var olderLoading = false;

  var pagBottom = document.getElementById("dm-pagination-bottom");
  var prevBottom = document.getElementById("dm-page-prev-bottom");
  var nextBottom = document.getElementById("dm-page-next-bottom");
  var indicatorBottom = document.getElementById("dm-page-indicator-bottom");

  var olderPagesStale = false;

  function renderPage(index) {
    currentPageIndex = Math.max(0, Math.min(index, pages.length - 1));

    messageList.textContent = "";
    (pages[currentPageIndex] || []).forEach(function (doc) {
      messageList.appendChild(buildMessageBubble(doc));
    });

    var multiPage = currentPageIndex > 0 || hasOlder[currentPageIndex];
    pagBottom.hidden = !multiPage;
    if (multiPage) {
      indicatorBottom.textContent = currentPageIndex === 0
        ? "Newest messages"
        : currentPageIndex + (currentPageIndex === 1 ? " page back" : " pages back");
      prevBottom.disabled = olderLoading || !hasOlder[currentPageIndex];
      nextBottom.disabled = currentPageIndex === 0;
    }
  }

  // Splits a query result fetched with limitToLast(PAGE_MESSAGE_LIMIT + 1)
  // into the page itself and whether anything older exists.
  function splitPage(docs) {
    var more = docs.length > PAGE_MESSAGE_LIMIT;
    return { docs: more ? docs.slice(1) : docs, more: more };
  }

  function messagesQuery() {
    return activeConversationRef.collection("messages").orderBy("createdAt", "asc");
  }

  function showOlderPage() {
    var target = currentPageIndex + 1;
    if (pages[target]) { renderPage(target); return; }
    var oldestShown = (pages[currentPageIndex] || [])[0];
    if (!oldestShown || olderLoading) return;
    olderLoading = true;
    prevBottom.disabled = true;
    messagesQuery().endBefore(oldestShown).limitToLast(PAGE_MESSAGE_LIMIT + 1).get()
      .then(function (snap) {
        var page = splitPage(snap.docs);
        pages[target] = page.docs;
        hasOlder[target] = page.more;
        olderLoading = false;
        renderPage(page.docs.length ? target : currentPageIndex);
      })
      .catch(function () {
        olderLoading = false;
        renderPage(currentPageIndex);
      });
  }

  prevBottom.addEventListener("click", showOlderPage);
  nextBottom.addEventListener("click", function () {
    var target = currentPageIndex - 1;
    if (target === 0 && olderPagesStale) dropOlderPages();
    renderPage(target);
  });

  function dropOlderPages() {
    pages.length = 1;
    hasOlder.length = 1;
    olderPagesStale = false;
  }

  function watchMessages(conversationRef) {
    unsubscribeMessages = conversationRef.collection("messages")
      .orderBy("createdAt", "asc")
      .limitToLast(PAGE_MESSAGE_LIMIT + 1)
      .onSnapshot(function (snap) {
        var page = splitPage(snap.docs);
        var newestChanged = !pages[0].length || !page.docs.length
          || pages[0][0].id !== page.docs[0].id;
        pages[0] = page.docs;
        hasOlder[0] = page.more;
        // The newest page slides forward as messages arrive, so pages
        // fetched further back no longer line up with it - drop them and
        // fetch again if asked (or, while someone is reading back there,
        // once they come back to the newest page).
        var target = jumpToLastOnNextRender ? 0 : currentPageIndex;
        if (newestChanged) {
          if (target === 0) dropOlderPages();
          else olderPagesStale = true;
        }
        jumpToLastOnNextRender = false;
        renderPage(target);
        // Viewing the Dialog as a participant clears its unread mark.
        if (isParticipant && currentUser) {
          var newest = page.docs.length ? page.docs[page.docs.length - 1].id : "";
          C.markDialogRead(conversationId, currentUser.uid, newest);
        }
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
    pages = [[]];
    hasOlder = [false];
    currentPageIndex = 0;
    jumpToLastOnNextRender = true;
    if (!user) {
      showNotice("Sign in to view this Dialog.");
      return;
    }
    loadConversation();
  });
})();

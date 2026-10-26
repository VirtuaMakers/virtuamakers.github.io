// AIM-style floating Dialog window(s) (Chris, 2026-08-17), opened by a
// profile's Dialog button in place of navigating away to
// communiques-dm.html. Requires firebase-config.js, auth.js,
// communiques-common.js, and moderation-client.js to run first.
//
// v2 (Chris, 2026-09-24): real multi-window support, draggable headers,
// and minimize/fullscreen toggles - the actual "AIM-like" ask, moving off
// v1's "one window at a time, no drag" scope. Multiple simultaneous
// conversations now stack in a horizontal row along the bottom-right
// corner, most-recently-opened/focused closest to the corner, capped at 3
// at once on desktop-width screens (Messenger's own "chat heads" cap, per
// the design direction already logged in CLAUDE.md's "Communiqués
// redesign: AIM-style Dialogs + Multi-Chat split" entry) - opening a 4th
// evicts the least-recently-focused window rather than refusing it. Below
// a real phone width, only one window is ever open at a time (a floating
// multi-window row has no good equivalent on a narrow screen, and Agora
// runs as an installed PWA there) - a new Dialog silently replaces
// whatever was open, same as v1's own behavior.
//
// v3 (Chris, 2026-10-13): open windows now survive navigating to a
// different Agora page - Agora is a set of separate static pages, not a
// single-page app, so without this an open window just vanished the
// moment you clicked anywhere else. Persisted to sessionStorage (one
// tab's lifetime) and restored the moment this page's own copy of the
// script resolves a real signed-in user. Rolled out from the 3 pages
// that had it (member.html, communiques.html, communiques-dm.html) to
// every page carrying notification-toast.js, since that's the exact set
// already participating in "something Communiqués-related could happen
// while I'm here" - minus newsletter-archive.html, which deliberately
// doesn't load communiques-common.js/moderation-client.js at all (a
// public, unauthenticated page by design).

(function (global) {
  if (typeof CommuniquesCommon === "undefined") return;
  var C = CommuniquesCommon;
  var RECENT_MESSAGE_LIMIT = 20;
  var MAX_OPEN_WINDOWS = 3;
  var NARROW_VIEWPORT_MAX = 700; // px - below this, only one window at a time
  var WINDOW_SLOT_PX = 356; // 340px window width + ~16px gap, desktop-only math

  var windows = {}; // otherUid -> window record
  var windowOrder = []; // otherUids, oldest-focused first, most-recent last

  // Persisted across page navigation (Chris, 2026-10-13 - "I thought
  // these windows were supposed to persist all over Agora 🌐", after one
  // disappeared navigating to the homepage). windowOrder/windows are
  // plain in-memory JS, torn down on every full page load like any other
  // script state - Agora is a set of separate static pages, not a
  // single-page app, so nothing survives a navigation on its own.
  // sessionStorage (one tab's lifetime, not shared across tabs/devices -
  // right for "followed me to the next page I visited," not a real
  // cross-device sync) remembers which Dialogs were open and restores
  // them the moment the next page's own copy of this script loads and
  // resolves the signed-in user, closing that gap without needing Agora
  // to become an SPA.
  var PERSIST_KEY = "agoraOpenImWindows";

  function readPersisted() {
    try {
      var raw = sessionStorage.getItem(PERSIST_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writePersisted() {
    try {
      var list = windowOrder.map(function (uid) {
        var win = windows[uid];
        return { uid: uid, name: win.otherName, minimized: win.minimized, owner: win.currentUser.uid };
      });
      sessionStorage.setItem(PERSIST_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function isNarrowViewport() {
    return window.innerWidth < NARROW_VIEWPORT_MAX;
  }

  function maxOpenWindows() {
    return isNarrowViewport() ? 1 : MAX_OPEN_WINDOWS;
  }

  // Positions every open, non-dragged, non-maximized window in a row along
  // the bottom-right corner - the most recently opened/focused window sits
  // closest to the corner, older ones stack further left. A window the
  // member has dragged keeps whatever position they put it at instead.
  //
  // The row also keeps clear of the Friends List 📨 (Chris, 2026-10-26):
  // while the list is open on the right, the row starts just to its left,
  // a few pixels apart, instead of sliding underneath it.
  var FRIENDS_LIST_GAP_PX = 4;
  var CORNER_PX = 19; // ~1.2rem at a 16px root font-size, matches the CSS default

  function friendsListBox() {
    if (isNarrowViewport()) return null;
    var list = document.querySelector(".friends-list");
    if (!list) return null;
    var rect = list.getBoundingClientRect(); // (offsetParent is always null for a fixed element)
    // Only when it's showing and still in the right-hand column (not
    // dragged away).
    if (!rect.width || rect.right < window.innerWidth - 120) return null;
    return { clearRight: window.innerWidth - rect.left + FRIENDS_LIST_GAP_PX };
  }

  function relayout() {
    var list = friendsListBox();
    var rightPx = list ? Math.max(CORNER_PX, list.clearRight) : CORNER_PX;
    for (var i = windowOrder.length - 1; i >= 0; i--) {
      var win = windows[windowOrder[i]];
      if (!win || win.dragged || win.maximized) continue;
      win.el.style.right = rightPx + "px";
      win.el.style.left = "";
      win.el.style.bottom = "1.2rem";
      win.el.style.top = "";
      rightPx += WINDOW_SLOT_PX;
    }
    windowOrder.forEach(function (uid, index) {
      var win = windows[uid];
      if (win) win.el.style.zIndex = String(200 + index);
    });
  }

  function bringToFront(otherUid) {
    var index = windowOrder.indexOf(otherUid);
    if (index !== -1) windowOrder.splice(index, 1);
    windowOrder.push(otherUid);
    relayout();
    writePersisted();
  }

  function closeWindowFor(otherUid) {
    var win = windows[otherUid];
    if (!win) return;
    if (win.unsubscribeMessages) win.unsubscribeMessages();
    if (win.el.parentNode) win.el.parentNode.removeChild(win.el);
    delete windows[otherUid];
    var index = windowOrder.indexOf(otherUid);
    if (index !== -1) windowOrder.splice(index, 1);
    relayout();
    writePersisted();
  }

  // Minimized and maximized are mutually exclusive states - neither
  // function used to check the other (Chris, 2026-10-13: a window stuck
  // rendering blank at the "wrong" size, or reverting to the minimized
  // view when restoring from fullscreen), so both classes could end up
  // active on the same window at once. CSS then had to pick a winner
  // between .im-window-minimized's bare `height: auto` and
  // .im-window-maximized's full top/right/bottom/left/width/height
  // sizing - whichever won, the minimized rule's own `.im-window-messages,
  // .im-window-compose { display: none; }` still applied regardless,
  // since that's keyed off the minimized class alone - producing exactly
  // "opens larger than minimized, but still blank." Setting one now
  // always clears the other first.
  function setMinimized(win, minimized) {
    if (minimized && win.maximized) setMaximized(win, false);
    win.minimized = minimized;
    // Minimize puts the window back into its place in the row, whatever
    // shape or spot it was dragged into (Chris, 2026-10-26): undo a drag
    // and a stretched text box.
    if (minimized) {
      win.dragged = false;
      var box = win.el.querySelector(".im-window-compose textarea");
      if (box) box.style.height = "";
    }
    if (!minimized) win.el.classList.remove("im-window-unread");
    if (!minimized && win.conversationId) C.markDialogRead(win.conversationId, win.currentUser.uid, win.newestId ? win.newestId() : undefined);
    win.el.classList.toggle("im-window-minimized", minimized);
    var label = minimized ? "Restore" : "Minimize";
    win.minimizeBtn.textContent = minimized ? "▢" : "−";
    win.minimizeBtn.setAttribute("aria-label", label);
    win.minimizeBtn.title = label;
    // Opening a minimized window shows the newest message (Chris,
    // 2026-10-25) - while minimized the list has no height, so the
    // scroll-to-bottom done when messages arrived didn't stick.
    if (!minimized && win.messagesEl) {
      requestAnimationFrame(function () { win.messagesEl.scrollTop = win.messagesEl.scrollHeight; });
    }
    relayout();
    writePersisted();
  }

  function setMaximized(win, maximized) {
    if (maximized && win.minimized) setMinimized(win, false);
    win.maximized = maximized;
    win.el.classList.toggle("im-window-maximized", maximized);
    var label = maximized ? "Restore" : "Fullscreen";
    win.maximizeBtn.textContent = maximized ? "🗗" : "⛶";
    win.maximizeBtn.setAttribute("aria-label", label);
    win.maximizeBtn.title = label;
    if (maximized) {
      win.el.style.left = "";
      win.el.style.top = "";
    } else {
      win.dragged = false;
      relayout();
    }
  }

  // Lets notification-toast.js suppress its own pop-out for a Dialog the
  // member is already looking at in an open (non-minimized) window here,
  // the same way it already suppresses itself on the full
  // communiques-dm.html page.
  function isOpenFor(conversationId) {
    return Object.keys(windows).some(function (uid) {
      var win = windows[uid];
      return win.conversationId === conversationId && !win.minimized;
    });
  }

  // Lets notification-toast.js stack a new toast above the row of windows
  // resting in the same bottom-right corner, instead of rendering directly
  // on top of them (Chris, 2026-10-13). Only counts windows actually
  // sitting in that shared corner right now - a dragged window has moved
  // elsewhere, and a maximized one already covers most of the viewport, so
  // neither should push the toast up. All undragged windows share one
  // `bottom` anchor (relayout() staggers them horizontally, not
  // vertically), so the tallest one is the real height of that row.
  function occupiedCornerHeight() {
    var tallest = 0;
    windowOrder.forEach(function (uid) {
      var win = windows[uid];
      if (!win || win.dragged || win.maximized) return;
      tallest = Math.max(tallest, win.el.offsetHeight);
    });
    return tallest;
  }

  function wireDrag(win) {
    var dragging = false;
    var startX, startY, startLeft, startTop;

    win.header.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button, a")) return; // don't drag when clicking a header control
      if (win.maximized) return;
      dragging = true;
      win.dragged = true;
      var rect = win.el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      win.el.style.left = startLeft + "px";
      win.el.style.top = startTop + "px";
      win.el.style.right = "";
      win.el.style.bottom = "";
      win.header.setPointerCapture(e.pointerId);
      bringToFront(win.otherUid);
    });

    win.header.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var newLeft = startLeft + (e.clientX - startX);
      var newTop = startTop + (e.clientY - startY);
      var maxLeft = window.innerWidth - win.el.offsetWidth;
      var maxTop = window.innerHeight - win.el.offsetHeight;
      newLeft = Math.max(0, Math.min(newLeft, Math.max(0, maxLeft)));
      newTop = Math.max(0, Math.min(newTop, Math.max(0, maxTop)));
      win.el.style.left = newLeft + "px";
      win.el.style.top = newTop + "px";
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try { win.header.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    win.header.addEventListener("pointerup", endDrag);
    win.header.addEventListener("pointercancel", endDrag);
  }

  function buildBubble(win, doc) {
    var data = doc.data();
    var isOwn = data.authorUid === win.currentUser.uid;
    var bubble = document.createElement("div");
    bubble.className = "message-bubble " + (isOwn ? "message-own" : "message-other");
    var colorClass = C.interlocutorColorClass(win.participants, data.authorUid);

    // Always shown now, own messages included - matches the same fix in
    // communiques-dm.js's buildMessageBubble() (Chris, 2026-10-12), same
    // reasoning: "own vs. other" alone stops telling speakers apart once
    // every message in a Dialog shares one author. Linked to the real
    // profile by authorUid, same as there.
    var sender = document.createElement("p");
    sender.className = "message-sender " + colorClass;
    var senderLink = document.createElement("a");
    senderLink.href = "member.html?uid=" + encodeURIComponent(data.authorUid);
    senderLink.textContent = (win.participantNames && win.participantNames[data.authorUid]) || "Member";
    sender.appendChild(senderLink);
    bubble.appendChild(sender);
    C.tagIfDeletedProfile(senderLink, data.authorUid);

    var body = document.createElement("p");
    body.className = "message-body";
    C.sanitizeBody(body, data.body);
    bubble.appendChild(body);

    var time = document.createElement("p");
    time.className = "message-time " + colorClass;
    time.textContent = C.formatDate(data.createdAt, true);
    if (C.prependStyleBadge) C.prependStyleBadge(time, data);
    bubble.appendChild(time);

    // Dedup guard (Chris, 2026-09-14 - the "699 views" bug) - the live
    // onSnapshot below re-renders every visible message on any change to
    // the conversation, not just the new one, so this stops an
    // already-on-screen message from being re-counted every time.
    if (!win.viewedMessageIds[doc.id]) {
      win.viewedMessageIds[doc.id] = true;
      C.recordView(doc.ref);
    }

    return bubble;
  }

  function openWindow(currentUser, otherUid, otherName) {
    if (windows[otherUid]) {
      if (windows[otherUid].minimized) setMinimized(windows[otherUid], false);
      bringToFront(otherUid);
      return;
    }

    while (windowOrder.length >= maxOpenWindows()) {
      closeWindowFor(windowOrder[0]);
    }
    if (isNarrowViewport()) {
      // Belt-and-suspenders for the narrow-viewport cap of 1 - the loop
      // above already empties windowOrder down to 0 in that case, but
      // close anything left over defensively (e.g. a resize mid-session).
      windowOrder.slice().forEach(closeWindowFor);
    }

    var win = {
      otherUid: otherUid,
      otherName: otherName,
      currentUser: currentUser,
      conversationId: null,
      // Filled in once the conversation doc itself resolves below - a
      // reasonable fallback in the meantime (correct participants, the
      // one name already known) rather than leaving these undefined.
      participants: [currentUser.uid, otherUid],
      participantNames: (function () {
        var names = {};
        names[otherUid] = otherName;
        return names;
      })(),
      unsubscribeMessages: null,
      viewedMessageIds: {},
      minimized: false,
      maximized: false,
      dragged: false,
    };

    var el = document.createElement("div");
    el.className = "im-window";
    win.el = el;

    var header = document.createElement("div");
    header.className = "im-window-header";
    win.header = header;
    header.addEventListener("dblclick", function (e) {
      if (e.target.closest("button, a")) return;
      setMinimized(win, !win.minimized);
    });

    var title = document.createElement("span");
    title.className = "im-window-title";
    title.textContent = otherName;
    header.appendChild(title);

    var actions = document.createElement("div");
    actions.className = "im-window-header-actions";

    // Every header button gets a hover tooltip now (Chris, 2026-10-13) -
    // only the expand link ever had one before. minimize/maximize's
    // titles are kept in sync with their current action by
    // setMinimized()/setMaximized() themselves (set once more here just
    // for the very first render, before either has ever been toggled).
    var minimizeBtn = document.createElement("button");
    minimizeBtn.type = "button";
    minimizeBtn.className = "im-window-minimize";
    minimizeBtn.setAttribute("aria-label", "Minimize");
    minimizeBtn.title = "Minimize";
    minimizeBtn.textContent = "−";
    minimizeBtn.addEventListener("click", function () { setMinimized(win, !win.minimized); });
    win.minimizeBtn = minimizeBtn;
    actions.appendChild(minimizeBtn);

    var maximizeBtn = document.createElement("button");
    maximizeBtn.type = "button";
    maximizeBtn.className = "im-window-maximize";
    maximizeBtn.setAttribute("aria-label", "Fullscreen");
    maximizeBtn.title = "Fullscreen";
    maximizeBtn.textContent = "⛶";
    maximizeBtn.addEventListener("click", function () { setMaximized(win, !win.maximized); });
    win.maximizeBtn = maximizeBtn;
    actions.appendChild(maximizeBtn);

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
    closeBtn.title = "Close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", function () { closeWindowFor(otherUid); });
    actions.appendChild(closeBtn);

    header.appendChild(actions);
    el.appendChild(header);
    header.addEventListener("pointerdown", function () { bringToFront(otherUid); });

    var messages = document.createElement("div");
    messages.className = "im-window-messages";
    win.messagesEl = messages;
    messages.textContent = "Connecting…";
    el.appendChild(messages);

    var form = document.createElement("form");
    form.className = "im-window-compose";

    var textarea = document.createElement("textarea");
    textarea.placeholder = "Dialog…";
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
    // Disabled until startOrOpenDialog() below resolves and win.conversationId
    // is set - registering the submit handler immediately (rather than
    // nested inside that promise, as before) closes a real race: a fast
    // click on this enabled-looking button before the Firestore round-trip
    // finished used to fall through to a native, unhandled form submission
    // (page reload, message lost) since no listener existed yet (2026-09-27).
    sendBtn.disabled = true;
    form.appendChild(sendBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!win.conversationId) return; // not ready yet - button is disabled until it is
      var conversationRef = AgoraDB.collection("conversations").doc(win.conversationId);
      var body = textarea.value.trim();
      if (!body) return;
      error.hidden = true;
      sendBtn.disabled = true;

      var blocked = false;
      var sendChain = AgoraModeration.checkText(body, "dialogMessage", { conversationId: win.conversationId }).then(function (result) {
        if (result.decision === "block") {
          blocked = true;
          AgoraModeration.showBlocked(error, result.logId);
          return;
        }

        var now = firebase.firestore.FieldValue.serverTimestamp();
        return C.writeThrottled(currentUser.uid, "dialog", conversationRef.collection("messages").doc(), {
          authorUid: currentUser.uid,
          body: body,
          createdAt: now,
          viewCount: 0,
          via: "human", // Human Style 💪 - the server has the final word
        }).then(function () {
          return conversationRef.update({
            lastMessage: body,
            lastMessageAt: now,
            lastMessageAuthorUid: currentUser.uid,
          });
        }).then(function () {
          textarea.value = "";
        });
      });

      // A stuck promise chain shouldn't leave the button disabled forever
      // with no error and no way to retry - see communiques-common.js's
      // withTimeout() for the real bug this fixes (2026-09-14).
      C.withTimeout(sendChain, 20000, "Sending is taking longer than expected… check your connection and try again.")
        .then(function () {
          sendBtn.disabled = false;
        })
        .catch(function (err) {
          sendBtn.disabled = false;
          if (!blocked) {
            error.textContent = err
              ? C.friendlyPermissionError(err, "This member isn't accepting Dialogs from you right now.")
              : "Something went wrong sending this message.";
            error.hidden = false;
          }
        });
    });

    el.appendChild(form);

    document.body.appendChild(el);
    windows[otherUid] = win;
    windowOrder.push(otherUid);
    relayout();
    wireDrag(win);
    requestAnimationFrame(function () { el.classList.add("open"); });
    writePersisted();

    // Speed (Chris, 2026-10-13): a Dialog's id is just the two uids, so the
    // messages listener starts right away - in parallel with creating/
    // reading the conversation doc - instead of after two round trips. On
    // a page change, a restored window shows its messages (from the local
    // cache, see firebase-config.js) almost at once. Bubbles are re-drawn
    // when the conversation's participant names arrive.
    var conversationRef = AgoraDB.collection("conversations").doc(C.conversationIdFor(currentUser.uid, otherUid));
    var lastSnap = null;
    function newestId() {
      return lastSnap && lastSnap.docs.length ? lastSnap.docs[0].id : "";
    }
    win.newestId = newestId;

    // "New since you last read" (Chris, 2026-10-13): your own readAt as
    // it stood when this window opened, read once before the window can
    // mark the Dialog read itself. A thin gray line then separates the
    // earlier chat from the messages that came in since. null = no line
    // (nothing read yet, or a Dialog from before read tracking).
    win.readBefore = null;
    conversationRef.get().then(function (doc) {
      var readAt = doc.exists && doc.data().readAt && doc.data().readAt[currentUser.uid];
      win.readBefore = readAt && readAt.toMillis ? readAt.toMillis() : null;
      renderMessages();
    }).catch(function () {});

    function renderMessages() {
      if (!lastSnap || windows[otherUid] !== win) return;
      messages.textContent = "";
      if (!lastSnap.docs.length) {
        messages.textContent = "No messages yet - say hello!";
        return;
      }
      var dividerShown = false;
      lastSnap.docs.slice().reverse().forEach(function (doc, index) {
        var d = doc.data();
        var at = d.createdAt && d.createdAt.toMillis ? d.createdAt.toMillis() : Infinity;
        if (!dividerShown && index > 0 && win.readBefore !== null
          && d.authorUid !== currentUser.uid && at > win.readBefore) {
          dividerShown = true;
          var divider = document.createElement("div");
          divider.className = "im-window-divider";
          divider.setAttribute("role", "separator");
          divider.title = "New since you last read";
          messages.appendChild(divider);
        }
        messages.appendChild(buildBubble(win, doc));
      });
      messages.scrollTop = messages.scrollHeight;
    }

    win.unsubscribeMessages = conversationRef.collection("messages")
      .orderBy("createdAt", "desc")
      .limit(RECENT_MESSAGE_LIMIT)
      .onSnapshot(function (snap) {
        // A new message from the other person while minimized lights the
        // header up until the window is opened (cleared in setMinimized).
        var newest = snap.docs[0];
        if (win.minimized && lastSnap && newest && newest.id !== newestId()
          && newest.data().authorUid !== currentUser.uid) {
          win.el.classList.add("im-window-unread");
        }
        lastSnap = snap;
        // An open (not minimized) window counts as reading the Dialog -
        // clears its unread mark in the Friends List 📨.
        if (!win.minimized && win.conversationId) C.markDialogRead(win.conversationId, currentUser.uid, newestId());
        renderMessages();
      }, function () {});

    C.startOrOpenDialog(currentUser, otherUid, otherName).then(function (conversationId) {
      if (windows[otherUid] !== win) return; // closed while this was in flight
      win.conversationId = conversationId;
      sendBtn.disabled = false;
      expandLink.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);
      if (!win.minimized && lastSnap) C.markDialogRead(conversationId, currentUser.uid, newestId());

      // participants/participantNames tell buildBubble() who's who and
      // which colour each speaker gets (same sorted-participants order
      // communiques-dm.html uses).
      return conversationRef.get().then(function (doc) {
        if (windows[otherUid] !== win) return;
        var data = doc.data() || {};
        win.participants = data.participants || win.participants;
        win.participantNames = data.participantNames || win.participantNames;
        renderMessages();
        textarea.focus();
      });
    }).catch(function (err) {
      if (windows[otherUid] !== win) return;
      messages.textContent = err.message || "Couldn't open this Dialog.";
    });
  }

  window.addEventListener("resize", function () {
    // A rotate/resize into the narrow-viewport cap should collapse down to
    // one window, same as opening a fresh Dialog there would.
    while (isNarrowViewport() && windowOrder.length > 1) {
      closeWindowFor(windowOrder[0]);
    }
    relayout();
  });

  // Reopens whatever was still open when the member last navigated away,
  // the moment this page's own copy of the script resolves a real
  // signed-in user - the actual fix for windows "disappearing" on
  // navigation (Chris, 2026-10-13). Every other caller of openWindow()
  // already has a real currentUser handed to it by whichever click
  // triggered it (a Dialog button, the floating-window button); this is
  // the one case that has to go find one itself, since nothing on this
  // particular page necessarily asked for a Dialog to open at all - e.g.
  // the Agora homepage, which has no Dialog button anywhere on it.
  // Restores once per page load only - agoraOnAuthChange can fire again
  // later (a real sign-out, a different account on a shared browser),
  // and re-running this on every firing would reopen stale windows for
  // whoever's signed in *now*, including after someone else signs out.
  //
  // Bug hunt (Chris, 2026-10-13): saved windows now record whose they are
  // (`owner`). Before, if one member signed out and another signed in on
  // the same tab, the first member's windows reopened for the second - and
  // reopening a window *creates* the Dialog, so it silently started new
  // conversations with the first member's contacts. A real sign-out now
  // also closes every open window (which clears the saved list).
  if (typeof agoraOnAuthChange === "function") {
    var restored = false;
    var signedInUid = null;
    agoraOnAuthChange(function (user) {
      if (!user) {
        if (signedInUid) windowOrder.slice().forEach(closeWindowFor);
        signedInUid = null;
        return;
      }
      if (signedInUid && signedInUid !== user.uid) windowOrder.slice().forEach(closeWindowFor);
      signedInUid = user.uid;
      if (restored) return;
      restored = true;
      readPersisted().forEach(function (entry) {
        if (!entry || !entry.uid || windows[entry.uid] || entry.owner !== user.uid) return;
        openWindow(user, entry.uid, entry.name || "Member");
        if (entry.minimized && windows[entry.uid]) setMinimized(windows[entry.uid], true);
      });
    });
  }

  // An incoming Dialog message (Chris, 2026-10-13): instead of the small
  // fixed toast, the real, movable window pops up - minimized and lit up,
  // so it doesn't cover the page or count as read until it's opened.
  // A window already open for that person just shows the message itself.
  function popIncoming(currentUser, otherUid, otherName) {
    var existing = windows[otherUid];
    if (existing) {
      if (existing.minimized) existing.el.classList.add("im-window-unread");
      return;
    }
    openWindow(currentUser, otherUid, otherName);
    var win = windows[otherUid];
    if (!win) return;
    setMinimized(win, true);
    win.el.classList.add("im-window-unread");
  }

  global.AgoraIMWindow = {
    open: openWindow,
    popIncoming: popIncoming,
    isNarrow: isNarrowViewport,
    isOpenFor: isOpenFor,
    occupiedCornerHeight: occupiedCornerHeight,
    // The Friends List calls this when it opens, closes, minimizes or moves.
    relayout: relayout,
  };
})(window);

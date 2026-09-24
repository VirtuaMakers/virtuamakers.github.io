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

(function (global) {
  if (typeof CommuniquesCommon === "undefined") return;
  var C = CommuniquesCommon;
  var RECENT_MESSAGE_LIMIT = 20;
  var MAX_OPEN_WINDOWS = 3;
  var NARROW_VIEWPORT_MAX = 700; // px - below this, only one window at a time
  var WINDOW_SLOT_PX = 356; // 340px window width + ~16px gap, desktop-only math

  var windows = {}; // otherUid -> window record
  var windowOrder = []; // otherUids, oldest-focused first, most-recent last

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
  function relayout() {
    var rightPx = 19; // ~1.2rem at a 16px root font-size, matches the CSS default
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
  }

  function setMinimized(win, minimized) {
    win.minimized = minimized;
    win.el.classList.toggle("im-window-minimized", minimized);
    win.minimizeBtn.textContent = minimized ? "▢" : "−";
    win.minimizeBtn.setAttribute("aria-label", minimized ? "Restore" : "Minimize");
  }

  function setMaximized(win, maximized) {
    win.maximized = maximized;
    win.el.classList.toggle("im-window-maximized", maximized);
    win.maximizeBtn.textContent = maximized ? "🗗" : "⛶";
    win.maximizeBtn.setAttribute("aria-label", maximized ? "Restore" : "Fullscreen");
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

    if (!isOwn) {
      var sender = document.createElement("p");
      sender.className = "message-sender";
      sender.textContent = win.otherName;
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

    var minimizeBtn = document.createElement("button");
    minimizeBtn.type = "button";
    minimizeBtn.className = "im-window-minimize";
    minimizeBtn.setAttribute("aria-label", "Minimize");
    minimizeBtn.textContent = "−";
    minimizeBtn.addEventListener("click", function () { setMinimized(win, !win.minimized); });
    win.minimizeBtn = minimizeBtn;
    actions.appendChild(minimizeBtn);

    var maximizeBtn = document.createElement("button");
    maximizeBtn.type = "button";
    maximizeBtn.className = "im-window-maximize";
    maximizeBtn.setAttribute("aria-label", "Fullscreen");
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
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", function () { closeWindowFor(otherUid); });
    actions.appendChild(closeBtn);

    header.appendChild(actions);
    el.appendChild(header);
    header.addEventListener("pointerdown", function () { bringToFront(otherUid); });

    var messages = document.createElement("div");
    messages.className = "im-window-messages";
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
    form.appendChild(sendBtn);

    el.appendChild(form);

    document.body.appendChild(el);
    windows[otherUid] = win;
    windowOrder.push(otherUid);
    relayout();
    wireDrag(win);
    requestAnimationFrame(function () { el.classList.add("open"); });

    C.startOrOpenDialog(currentUser, otherUid, otherName).then(function (conversationId) {
      if (windows[otherUid] !== win) return; // closed while this was in flight
      win.conversationId = conversationId;
      expandLink.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);

      var conversationRef = AgoraDB.collection("conversations").doc(conversationId);

      win.unsubscribeMessages = conversationRef.collection("messages")
        .orderBy("createdAt", "desc")
        .limit(RECENT_MESSAGE_LIMIT)
        .onSnapshot(function (snap) {
          messages.textContent = "";
          if (!snap.docs.length) {
            messages.textContent = "No messages yet - say hello!";
            return;
          }
          snap.docs.slice().reverse().forEach(function (doc) {
            messages.appendChild(buildBubble(win, doc));
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

        var blocked = false;
        var sendChain = AgoraModeration.checkText(body, "dialogMessage", { conversationId: conversationId }).then(function (result) {
          if (result.decision === "block") {
            blocked = true;
            AgoraModeration.showBlocked(error, result.logId);
            return;
          }

          var now = firebase.firestore.FieldValue.serverTimestamp();
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

  global.AgoraIMWindow = { open: openWindow, isOpenFor: isOpenFor };
})(window);

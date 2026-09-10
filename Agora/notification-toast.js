// Sitewide pop-out notification for new Dialog messages, Wall posts, Wall
// comments, and Friend requests - an AIM-style toast in the corner of the
// screen with a type-specific chime, so something can pop up regardless
// of what page a signed-in member is currently browsing. Requires
// firebase-config.js, auth.js, and communiques-common.js to run first;
// loaded on every Agora page except create-profile.html and
// leave-agora.html (a toast mid-signup or mid-account-deletion would be a
// distracting non-sequitur there).
//
// Formerly dialog-toast.js, Dialogs-only - generalized 2026-08-11 once the
// Cloud Functions side (functions/lib/notify.js) started writing to a
// single shared `notifications` collection for every content type,
// rather than this script querying `conversations` directly. Also backs
// the real closed-browser push notifications built the same day - see
// push-notifications.js and sw.js - this script is the in-tab/foreground
// half of that same feature, not a separate one.
//
// This is still a v1 scoped down from the eventual vision (multiple
// draggable windows, a buddy list) - one toast at a time, most-recent-wins.
//
// Also catches you up on anything you missed while away (Chris,
// 2026-09-10) - a notification only ever popped up live before, for
// whoever happened to have a tab open at the exact moment it was
// written; nothing surfaced it again for someone who signed in or
// revisited later. See the `seen` field (firestore.rules,
// functions/lib/notify.js) and startListening()'s catch-up pass below.

(function () {
  if (typeof CommuniquesCommon === "undefined") return;
  var C = CommuniquesCommon;

  function assetPath(name) {
    return (window.location.pathname.indexOf("/profiles/") !== -1 ? "../assets/" : "assets/") + name;
  }

  function memberBase() {
    return window.location.pathname.indexOf("/profiles/") !== -1 ? "../" : "";
  }

  var CHIME_FILES = {
    dialog_message: "dialog-chime3.wav",
    wall_post: "post-chime2.wav",
    wall_comment: "comment-chime3.wav",
    // Reuses the Dialog chime rather than a dedicated fourth sound for
    // now (Chris, 2026-08-17) - a friend request is a similar "someone
    // wants your attention" event; swap in a distinct file later if it
    // turns out to need its own identity, same as Post/Comment did.
    friend_request: "dialog-chime3.wav",
  };
  var chimes = {};
  Object.keys(CHIME_FILES).forEach(function (type) {
    var audio = new Audio(assetPath(CHIME_FILES[type]));
    audio.volume = 0.5;
    chimes[type] = audio;
  });

  function playChime(type) {
    var chime = chimes[type];
    if (!chime) return;
    chime.currentTime = 0;
    chime.play().catch(function () {});
  }

  // linkPath is always written relative to the Agora root (e.g.
  // "communiques-dm.html?c=..." or "member.html?uid=...") regardless of
  // which page wrote it, so compare against just the current page's own
  // filename + query rather than the full pathname.
  function isViewingLinkPath(linkPath) {
    var currentFile = window.location.pathname.split("/").pop() + window.location.search;
    if (currentFile === linkPath) return true;
    if (typeof AgoraIMWindow !== "undefined") {
      var conversationId = (linkPath.match(/[?&]c=([^&]+)/) || [])[1];
      if (conversationId && AgoraIMWindow.isOpenFor(conversationId)) return true;
    }
    return false;
  }

  var currentUser = null;
  var toastEl = null;
  var unsubscribe = null;

  function removeToast() {
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    toastEl = null;
  }

  // Only a Dialog notification supports the inline reply box - Wall posts/
  // comments open straight to the Wall on click, same as any other toast
  // click, but there's no single "reply target" to compose into inline.
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

  function showToast(data, extraCount) {
    removeToast();

    var preview = (data.preview || "").replace(/<[^>]*>/g, "").slice(0, 140);

    function openTarget() {
      window.location.href = memberBase() + data.linkPath;
    }

    var el = document.createElement("div");
    el.className = "notification-toast";

    var header = document.createElement("div");
    header.className = "notification-toast-header";
    header.addEventListener("click", openTarget);

    var title = document.createElement("span");
    title.className = "notification-toast-title";
    // "+N more" on a catch-up pass with several unseen notifications
    // waiting - same "don't silently drop the rest" convention
    // otherParticipantsLabel() uses elsewhere for a group Dialog,
    // applied here instead of actually stacking toasts (still v1-scoped
    // to one at a time).
    title.textContent = (data.actorName || "Someone") + (extraCount ? " +" + extraCount + " more" : "");
    header.appendChild(title);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "notification-toast-close";
    closeBtn.setAttribute("aria-label", "Dismiss");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeToast();
    });
    header.appendChild(closeBtn);

    var body = document.createElement("p");
    body.className = "notification-toast-body";
    body.textContent = preview;
    body.addEventListener("click", openTarget);

    el.appendChild(header);
    el.appendChild(body);

    if (data.type === "dialog_message") {
      var conversationId = (data.linkPath.match(/[?&]c=([^&]+)/) || [])[1];
      var form = document.createElement("form");
      form.className = "notification-toast-reply";

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
        if (!text || !conversationId) return;
        sendBtn.disabled = true;
        error.hidden = true;
        AgoraModeration.checkText(text, "dialogMessage", { conversationId: conversationId }).then(function (result) {
          if (result.decision === "block") {
            sendBtn.disabled = false;
            AgoraModeration.showBlocked(error, result.logId);
            return;
          }
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
      });

      el.appendChild(form);
    }

    document.body.appendChild(el);
    toastEl = el;

    requestAnimationFrame(function () {
      el.classList.add("open");
    });
  }

  // Marks a batch of notification docs `seen` so they're not re-surfaced
  // by a future catch-up pass (see below) - best-effort, matching every
  // other non-essential write in this file (a permission hiccup here
  // should never break the toast itself).
  function markSeen(docs) {
    if (!docs.length) return;
    var batch = AgoraDB.batch();
    docs.forEach(function (doc) {
      batch.update(doc.ref, { seen: true });
    });
    batch.commit().catch(function () {});
  }

  function startListening() {
    var caughtUp = false;

    unsubscribe = AgoraDB.collection("notifications")
      .where("recipientUid", "==", currentUser.uid)
      .onSnapshot(function (snap) {
        if (!caughtUp) {
          caughtUp = true;

          // Catch-up pass (Chris, 2026-09-10) - the actual "pop up
          // whenever someone signs in or revisits" ask: anything already
          // sitting unseen from before this page ever loaded, not just a
          // genuinely new change from here on (the "added" case below).
          // No chime here on purpose - a burst of notifications you
          // missed while away reads as informational on load, not the
          // same "something just happened" moment a live arrival is.
          var unseen = snap.docs.filter(function (doc) {
            return doc.data().seen !== true;
          });
          unseen.sort(function (a, b) {
            var at = a.data().createdAt, bt = b.data().createdAt;
            return (bt ? bt.toMillis() : 0) - (at ? at.toMillis() : 0);
          });
          if (unseen.length) showToast(unseen[0].data(), unseen.length - 1);
          markSeen(unseen);
          return;
        }

        var newlyAdded = [];
        snap.docChanges().forEach(function (change) {
          if (change.type !== "added") return;
          newlyAdded.push(change.doc);
          var data = change.doc.data();
          if (isViewingLinkPath(data.linkPath)) return;

          playChime(data.type);
          showToast(data, 0);
        });
        // Marked seen even when suppressed above (already viewing that
        // exact target) - being on the matching page already counts as
        // having seen it, so it shouldn't come back on a later catch-up.
        markSeen(newlyAdded);
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

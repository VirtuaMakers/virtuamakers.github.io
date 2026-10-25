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

  // Dialog messages (and the events that borrow their sound) use a
  // wooden "knock-knock" plus two soft marimba notes (Chris, 2026-10-13 -
  // the old dialog-chime3.wav sounded like a generic Windows alert).
  // Split in two (Communiqués 📨 - Session 4, 2026-10-25): that file's
  // two marimba notes are the "beep-boop" Chris heard for a new message,
  // and its knock-knock now means you messaged someone who's Away.
  var CHIME_FILES = {
    dialog_message: "dialog-beepboop1.wav",
    away_knock: "away-knock1.wav",
    wall_post: "post-chime2.wav",
    wall_comment: "comment-chime3.wav",
    // Someone also commented on a post you commented on (Chris,
    // 2026-10-13) - same sound as a comment on your own post.
    wall_reply: "comment-chime3.wav",
    // Tagged with @ in a Wall post or comment (Chris, 2026-10-24) - the
    // post sound, since a tag points you at a post.
    mention: "post-chime2.wav",
    // Reuses the Dialog chime rather than a dedicated fourth sound for
    // now (Chris, 2026-08-17) - a friend request is a similar "someone
    // wants your attention" event; swap in a distinct file later if it
    // turns out to need its own identity, same as Post/Comment did.
    friend_request: "dialog-knock1.wav",
    // VirtuaMakers Calendar 🗓️'s Special Days alarm (Chris, 2026-09-21) -
    // reuses the Dialog chime too, same "ship a reasonable default, give
    // it its own sound later if it earns one" precedent as friend_request
    // just above.
    friend_special_day: "dialog-knock1.wav",
    // VirtuaMakers Calendar 🗓️'s meeting reminder (Chris, 2026-09-23) -
    // same "reuse the Dialog chime for now" precedent as the two entries
    // just above.
    calendar_event: "dialog-knock1.wav",
  };
  // Played through Web Audio, woken by the first click, key press or touch
  // on the page (Chris, 2026-10-13: the knock didn't play at all). A plain
  // <audio>.play() is refused outright until the page has been interacted
  // with, and failed silently. <audio> stays as the fallback for a browser
  // without Web Audio.
  var audioCtx = null;
  var buffers = {};
  var htmlChimes = {};

  function getAudioCtx() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try { audioCtx = new Ctx(); } catch (e) { return null; }
    }
    return audioCtx;
  }

  function unlockAudio() {
    var ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(function () {});
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (type) {
    document.addEventListener(type, unlockAudio, { capture: true, passive: true });
  });

  function loadBuffer(file) {
    if (!buffers[file]) {
      buffers[file] = fetch(assetPath(file)).then(function (res) { return res.arrayBuffer(); })
        .then(function (data) {
          return new Promise(function (resolve, reject) {
            getAudioCtx().decodeAudioData(data, resolve, reject);
          });
        });
      buffers[file].catch(function () { delete buffers[file]; });
    }
    return buffers[file];
  }

  function playHtmlChime(file) {
    var audio = htmlChimes[file] || (htmlChimes[file] = new Audio(assetPath(file)));
    audio.volume = 0.5;
    audio.currentTime = 0;
    audio.play().catch(function () {});
  }

  // Two toggles in the Friends List's Options (friends-list.js writes the
  // same keys), both on unless turned off: the beep-boop for a new Dialog
  // message, and the knock when you message someone who's Away.
  function soundOn(key) {
    try { return localStorage.getItem(key) !== "0"; } catch (e) { return true; }
  }
  function knockOn() { return soundOn("agoraDialogBeep"); }

  // A small notice when a sound was due but the browser is still holding
  // the page silent (no click or key press on it yet) - before, the sound
  // was simply skipped with no sign why (Chris, 2026-10-25).
  var mutedNote = null;
  function showMutedNote() {
    if (mutedNote || !document.body) return;
    mutedNote = document.createElement("button");
    mutedNote.type = "button";
    mutedNote.className = "agora-sound-blocked";
    mutedNote.textContent = "🔇 Click here to hear Agora's sounds";
    mutedNote.addEventListener("click", hideMutedNote);
    document.body.appendChild(mutedNote);
  }
  function hideMutedNote() {
    if (mutedNote && mutedNote.parentNode) mutedNote.parentNode.removeChild(mutedNote);
    mutedNote = null;
  }
  document.addEventListener("pointerdown", function () { setTimeout(hideMutedNote, 0); }, true);

  function playChime(type) {
    var file = CHIME_FILES[type];
    if (!file) return;
    var ctx = getAudioCtx();
    if (!ctx) { playHtmlChime(file); return; }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
      setTimeout(function () { if (ctx.state !== "running") showMutedNote(); }, 300);
    }
    loadBuffer(file).then(function (buffer) {
      var source = ctx.createBufferSource();
      source.buffer = buffer;
      var gain = ctx.createGain();
      gain.gain.value = 0.5;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    }).catch(function () { playHtmlChime(file); });
  }

  // For the Friends List's "▶ Test" buttons: play a sound on demand, so a
  // member can check it without waiting for a message.
  // knockIfAway: after you send a Dialog message, knock if the other
  // member is Away. Their presence is readable only to friends, so for
  // anyone else this stays quiet.
  function knockIfAway(conversationId, myUid) {
    if (!soundOn("agoraAwayKnock") || typeof conversationId !== "string") return;
    var other = conversationId.split("_").filter(function (u) { return u && u !== myUid; })[0];
    if (!other) return;
    AgoraDB.collection("presence").doc(other).get().then(function (doc) {
      if (doc.exists && C.presenceState(doc.data()) === "away") playChime("away_knock");
    }).catch(function () {});
  }

  window.AgoraSounds = {
    testBeep: function () { playChime("dialog_message"); },
    testKnock: function () { playChime("away_knock"); },
    knockIfAway: knockIfAway,
  };

  // Dialog messages open the real chat window (im-window.js), never this
  // toast (Chris, 2026-10-13). False when that script isn't on the page.
  function popDialog(data) {
    if (data.type !== "dialog_message" || !data.actorUid || typeof AgoraIMWindow === "undefined"
      || !AgoraIMWindow.popIncoming) return false;
    AgoraIMWindow.popIncoming(currentUser, data.actorUid, data.actorName || "Member");
    return true;
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

  // Local fallback so a notification can never re-show forever if the
  // server-side `seen` write silently fails (e.g. firestore.rules hasn't
  // been pasted into the console yet - a recurring gap in this codebase,
  // see CLAUDE.md's "Notification catch-up: the reappearing friend
  // request" entry). Scoped per-recipient-uid so a shared/kiosk browser
  // signing into a different account doesn't inherit someone else's cache.
  var SEEN_CACHE_PREFIX = "agoraSeenNotifications:";
  var MAX_CACHED_IDS = 300;

  function seenCacheKey() {
    return SEEN_CACHE_PREFIX + (currentUser ? currentUser.uid : "");
  }

  function readSeenCache() {
    try {
      var raw = localStorage.getItem(seenCacheKey());
      var ids = raw ? JSON.parse(raw) : [];
      return Array.isArray(ids) ? ids : [];
    } catch (e) {
      return [];
    }
  }

  function markSeenLocally(docs) {
    if (!docs.length) return;
    try {
      var ids = readSeenCache();
      docs.forEach(function (doc) { ids.push(doc.id); });
      if (ids.length > MAX_CACHED_IDS) ids = ids.slice(ids.length - MAX_CACHED_IDS);
      localStorage.setItem(seenCacheKey(), JSON.stringify(ids));
    } catch (e) {}
  }

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
    CommuniquesCommon.writeThrottled(currentUser.uid, "dialog", ref.collection("messages").doc(), {
      authorUid: currentUser.uid,
      body: text,
      createdAt: now,
      via: "human", // Human Style 💪 - the server has the final word
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

    var preview = C.truncateAtWord(C.mentionsToText(data.preview || "").replace(/<[^>]*>/g, ""), 140);

    function openTarget() {
      window.location.href = memberBase() + data.linkPath;
    }

    var el = document.createElement("div");
    el.className = "notification-toast";

    // Both this toast and im-window.js's own windows rest in the same
    // bottom-right corner by default (Chris, 2026-10-13 - a toast arrived
    // "hovering above" a minimized Dialog window, directly overlapping
    // it). The two scripts have never coordinated before now - shift the
    // toast up by however tall the current corner row already is, so a
    // new toast stacks above it instead of sitting on top of it.
    if (typeof AgoraIMWindow !== "undefined") {
      var reserved = AgoraIMWindow.occupiedCornerHeight();
      if (reserved) el.style.bottom = "calc(1.2rem + " + (reserved + 16) + "px)";
    }

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
    // Still never blocks anything on failure - but a permission-denied
    // here (e.g. the firestore.rules update for this hasn't been pasted
    // into the console yet) would otherwise be completely invisible,
    // silently leaving every notification eligible to be "caught up" on
    // again forever instead of just once (Chris, 2026-09-10 - this is
    // exactly the shape of bug that hit).
    batch.commit().catch(function (err) {
      console.warn("notification-toast: failed to mark seen", err);
    });
  }

  function startListening() {
    var caughtUp = false;

    // Only unseen notifications (Chris, 2026-10-13 bug hunt): this used to
    // download every notification the member had ever received on every
    // page load, a list that only ever grows. Two equality filters need no
    // composite index. Older notifications from before `seen` existed don't
    // match, and that's fine - they're long past.
    unsubscribe = AgoraDB.collection("notifications")
      .where("recipientUid", "==", currentUser.uid)
      .where("seen", "==", false)
      .onSnapshot(function (snap) {
        // With the local cache on (firebase-config.js), the first snapshot
        // can come from cache; anything the cache lacked would then arrive
        // as "added" and chime as if brand new. Do the catch-up only on
        // the server's own answer.
        if (!caughtUp && snap.metadata && snap.metadata.fromCache) return;
        if (!caughtUp) {
          caughtUp = true;

          // Catch-up pass (Chris, 2026-09-10) - the actual "pop up
          // whenever someone signs in or revisits" ask: anything already
          // sitting unseen from before this page ever loaded, not just a
          // genuinely new change from here on (the "added" case below).
          // No chime here on purpose - a burst of notifications you
          // missed while away reads as informational on load, not the
          // same "something just happened" moment a live arrival is.
          // Also filtered against the local cache (see markSeenLocally
          // above) so a notification whose server-side `seen: true` write
          // failed doesn't come back on every single future page load.
          var seenLocally = readSeenCache();
          var unseen = snap.docs.filter(function (doc) {
            return doc.data().seen !== true && seenLocally.indexOf(doc.id) === -1;
          });
          unseen.sort(function (a, b) {
            var at = a.data().createdAt, bt = b.data().createdAt;
            return (bt ? bt.toMillis() : 0) - (at ? at.toMillis() : 0);
          });
          // Dialogs you missed reopen as their chat windows (one per
          // person, newest few); anything else shows in the toast.
          var popped = {};
          var others = unseen.filter(function (doc) {
            var data = doc.data();
            if (data.type !== "dialog_message") return true;
            if (popped[data.actorUid] || Object.keys(popped).length >= 3) return false;
            if (popDialog(data)) { popped[data.actorUid] = true; return false; }
            return true;
          });
          if (others.length) showToast(others[0].data(), others.length - 1);
          markSeen(unseen);
          markSeenLocally(unseen);
          return;
        }

        var newlyAdded = [];
        var seenLocallyNow = readSeenCache();
        snap.docChanges().forEach(function (change) {
          if (change.type !== "added") return;
          var data = change.doc.data();
          if (data.seen === true || seenLocallyNow.indexOf(change.doc.id) !== -1) return;
          newlyAdded.push(change.doc);
          // A Dialog message beep-boops even when its window is already
          // open, as AIM did (Chris, 2026-10-25) - unless the member turned
          // it off in the Friends List's Options.
          if (isViewingLinkPath(data.linkPath)) {
            if (data.type === "dialog_message" && knockOn()) playChime(data.type);
            return;
          }

          if (data.type !== "dialog_message" || knockOn()) playChime(data.type);
          if (popDialog(data)) return;
          showToast(data, 0);
        });
        // Marked seen even when suppressed above (already viewing that
        // exact target) - being on the matching page already counts as
        // having seen it, so it shouldn't come back on a later catch-up.
        markSeen(newlyAdded);
        markSeenLocally(newlyAdded);
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

// Communiqués 2.0 (Chris, 2026-09-25) - the dedicated hub/app Agora 🌐's
// own "Communiqués 📨" header link opens up, the same way the Facebook app
// could open Messenger but historically just tried (and often failed) to
// handle messages itself. This page is a real inbox: every Dialog you're
// in, a way to start a new one, and your recent Wall activity - plus its
// own installable identity (communiques-manifest.json) so it can live in
// its own window, separate from the rest of Agora, closable any time.
//
// Requires firebase-config.js, auth.js, auth-ui.js, communiques-common.js,
// and (optionally - this page degrades gracefully without it) im-window.js
// to run first.

(function () {
  var C = window.CommuniquesCommon;

  var signedOutNotice = document.getElementById("communiques-signed-out-notice");
  var signedOutSigninBtn = document.getElementById("communiques-signin-btn");
  var content = document.getElementById("communiques-content");

  var newMessageSearch = document.getElementById("communiques-new-message-search");
  var newMessageResults = document.getElementById("communiques-new-message-results");

  var dialogsEmpty = document.getElementById("communiques-dialogs-empty");
  var dialogsList = document.getElementById("communiques-dialogs-list");

  var activityEmpty = document.getElementById("communiques-activity-empty");
  var activityList = document.getElementById("communiques-activity-list");

  var installWrap = document.getElementById("communiques-install-wrap");
  var installBtn = document.getElementById("communiques-install-btn");
  var installHint = document.getElementById("communiques-install-hint");

  var currentUser = null;
  var friendUidsCache = [];
  var messagableCache = null;

  if (signedOutSigninBtn) {
    signedOutSigninBtn.addEventListener("click", function () {
      C.openSignInModal();
    });
  }

  // Real capability, not a mockup - beforeinstallprompt only fires when the
  // browser genuinely offers an install (Chrome/Edge desktop and Android;
  // Safari/Firefox never fire it, so the hint below covers those instead).
  var deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installWrap) installWrap.hidden = false;
    if (installHint) installHint.hidden = true;
  });

  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferredInstallPrompt) {
        if (installHint) installHint.hidden = false;
        return;
      }
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function () {
        deferredInstallPrompt = null;
      });
    });
  }
  // Always show the panel with the fallback hint for a browser that never
  // fires beforeinstallprompt at all (Safari, Firefox) - clicking Install
  // there just reveals the hint pointing at the browser's own menu.
  if (installWrap) {
    installWrap.hidden = false;
    if (installHint) installHint.hidden = false;
  }

  function otherParticipantUid(data, uid) {
    return (data.participants || []).filter(function (p) { return p !== uid; })[0] || null;
  }

  function renderDialogCard(doc) {
    var data = doc.data();
    var otherUid = otherParticipantUid(data, currentUser.uid);
    var label = C.otherParticipantsLabel(data.participants, data.participantNames, currentUser.uid, 3);

    var item = document.createElement("button");
    item.type = "button";
    item.className = "dm-item";
    item.innerHTML = "";

    var nameEl = document.createElement("div");
    nameEl.className = "dm-item-name";
    nameEl.textContent = label;
    item.appendChild(nameEl);

    if (otherUid) C.tagIfDeletedProfile(nameEl, otherUid);

    var previewEl = document.createElement("div");
    previewEl.className = "dm-item-preview";
    previewEl.textContent = data.lastMessage
      ? data.lastMessage.replace(/<[^>]*>/g, "").slice(0, 120)
      : "No messages yet.";
    item.appendChild(previewEl);

    item.addEventListener("click", function () {
      if (typeof AgoraIMWindow !== "undefined") {
        AgoraIMWindow.open(currentUser, otherUid, label);
      } else {
        window.location.href = "communiques-dm.html?c=" + encodeURIComponent(doc.id);
      }
    });

    return item;
  }

  function loadDialogs() {
    return AgoraDB.collection("conversations")
      .where("participants", "array-contains", currentUser.uid)
      .get()
      .then(function (snap) {
        var docs = snap.docs.slice().sort(function (a, b) {
          var atA = a.data().lastMessageAt;
          var atB = b.data().lastMessageAt;
          var msA = (atA && atA.toDate) ? atA.toDate().getTime() : 0;
          var msB = (atB && atB.toDate) ? atB.toDate().getTime() : 0;
          return msB - msA;
        });

        dialogsList.innerHTML = "";
        dialogsEmpty.hidden = docs.length > 0;
        docs.forEach(function (doc) {
          dialogsList.appendChild(renderDialogCard(doc));
        });
      })
      .catch(function () {
        dialogsEmpty.hidden = false;
        dialogsEmpty.textContent = "Couldn't load Dialogs right now - check your connection and try again.";
      });
  }

  // Recent Wall activity, read straight off the same notifications/{id}
  // log every toast/push already reads (see notify.js) - a single
  // equality filter, no .orderBy() combined with it, same query shape
  // notification-toast.js's own startListening() already uses (verified
  // live: adding .orderBy("createdAt", "desc") here needs a composite
  // index this project doesn't have provisioned, and Firestore rejects
  // the whole query rather than silently dropping the sort - caught by
  // testing this against the real project, not assumed safe). Sorted and
  // filtered to the two Wall-shaped types client-side instead, matching
  // the established fallback pattern used throughout Communiqués
  // (fetchAcceptedFriendships, etc.).
  var WALL_TYPES = { wall_post: true, wall_comment: true };

  function loadActivity() {
    return AgoraDB.collection("notifications")
      .where("recipientUid", "==", currentUser.uid)
      .get()
      .then(function (snap) {
        var docs = snap.docs.slice().sort(function (a, b) {
          var atA = a.data().createdAt;
          var atB = b.data().createdAt;
          var msA = (atA && atA.toDate) ? atA.toDate().getTime() : 0;
          var msB = (atB && atB.toDate) ? atB.toDate().getTime() : 0;
          return msB - msA;
        });
        var items = docs.filter(function (doc) { return WALL_TYPES[doc.data().type]; }).slice(0, 10);

        activityList.innerHTML = "";
        activityEmpty.hidden = items.length > 0;
        items.forEach(function (doc) {
          var data = doc.data();
          var item = document.createElement("a");
          item.className = "dm-item";
          item.href = data.linkPath || "index.html";

          var nameEl = document.createElement("div");
          nameEl.className = "dm-item-name";
          nameEl.textContent = data.actorName
            + (data.type === "wall_comment" ? " commented on your post" : " posted on your Wall");
          item.appendChild(nameEl);

          var previewEl = document.createElement("div");
          previewEl.className = "dm-item-preview";
          previewEl.textContent = data.preview || "";
          item.appendChild(previewEl);

          activityList.appendChild(item);
        });
      })
      .catch(function () {
        // Fails toward "just don't show recent activity" - this section is
        // a convenience, never something that should block Dialogs/New
        // Message from working.
        activityEmpty.hidden = false;
        activityEmpty.textContent = "Couldn't load recent activity right now.";
      });
  }

  function renderNewMessageResults(query) {
    newMessageResults.innerHTML = "";
    if (!messagableCache || !query.trim()) return;

    var matches = C.filterMessagable(messagableCache, friendUidsCache, [currentUser.uid], query).slice(0, 8);
    matches.forEach(function (m) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "dm-item";
      item.textContent = m.name;
      item.addEventListener("click", function () {
        if (typeof AgoraIMWindow !== "undefined") {
          AgoraIMWindow.open(currentUser, m.uid, m.name);
        } else {
          C.startOrOpenDialog(currentUser, m.uid, m.name).then(function (conversationId) {
            window.location.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);
          });
        }
        newMessageSearch.value = "";
        newMessageResults.innerHTML = "";
      });
      newMessageResults.appendChild(item);
    });
  }

  var searchDebounce = null;
  if (newMessageSearch) {
    newMessageSearch.addEventListener("input", function () {
      clearTimeout(searchDebounce);
      var query = newMessageSearch.value;
      searchDebounce = setTimeout(function () { renderNewMessageResults(query); }, 150);
    });
  }

  function loadHub() {
    content.hidden = false;
    signedOutNotice.hidden = true;

    Promise.all([
      C.loadMessagableMembers(currentUser.uid),
      C.fetchAcceptedFriendships(currentUser.uid),
    ]).then(function (results) {
      messagableCache = results[0];
      friendUidsCache = results[1].docs.map(function (doc) {
        return (doc.data().participants || []).filter(function (uid) { return uid !== currentUser.uid; })[0];
      }).filter(Boolean);
    });

    loadDialogs();
    loadActivity();
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (!user) {
      content.hidden = true;
      signedOutNotice.hidden = false;
      return;
    }
    loadHub();
  });
})();

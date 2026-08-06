// Drives communiques.html: the Dialogs inbox (read-only list of Dialogs
// you already have) plus a New Message search to start one with anyone -
// messaging is open by default, per firestore.rules' canMessage() (see
// CLAUDE.md), except for members who've opted into requiring an accepted
// friendship first. Requires firebase-config.js, auth.js, and
// communiques-common.js to run first.

(function () {
  var C = CommuniquesCommon;
  var currentUser = null;
  var friendsCache = [];
  var messagableMembers = [];

  document.getElementById("dm-signin-prompt").addEventListener("click", function (e) {
    e.preventDefault();
    C.openSignInModal();
  });

  // --- New Message -----------------------------------------------------

  var newMessageSearch = document.getElementById("new-message-search");
  var newMessageResults = document.getElementById("new-message-results");
  var NEW_MESSAGE_EMPTY_LIMIT = 20;

  function loadFriends() {
    C.fetchAcceptedFriendships(currentUser.uid).then(function (snap) {
      friendsCache = snap.docs.map(function (doc) {
        var data = doc.data();
        var otherUid = (data.participants || []).filter(function (p) { return p !== currentUser.uid; })[0];
        return { uid: otherUid };
      });
    });
  }

  function loadMessagableMembers() {
    C.loadMessagableMembers(currentUser.uid).then(function (members) {
      messagableMembers = members;
      renderNewMessageResults(newMessageSearch.value);
    });
  }

  function renderNewMessageResults(query) {
    newMessageResults.textContent = "";
    var friendUids = friendsCache.map(function (f) { return f.uid; });
    var matches = C.filterMessagable(messagableMembers, friendUids, [], query);
    if (!query.trim()) matches = matches.slice(0, NEW_MESSAGE_EMPTY_LIMIT);
    matches.forEach(function (m) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "dm-item";
      item.textContent = m.name;
      item.addEventListener("click", function () {
        C.startOrOpenDialog(currentUser, m.uid, m.name).then(function (conversationId) {
          window.location.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);
        });
      });
      newMessageResults.appendChild(item);
    });
  }

  newMessageSearch.addEventListener("input", function () {
    renderNewMessageResults(newMessageSearch.value);
  });

  // --- Dialogs -------------------------------------------------------

  var dmList = document.getElementById("dm-list");
  var dmLoading = document.getElementById("dm-loading");
  var dmEmpty = document.getElementById("dm-empty");

  function renderConversations(docs) {
    dmLoading.hidden = true;
    dmList.textContent = "";
    if (!docs.length) {
      dmEmpty.hidden = false;
      return;
    }
    dmEmpty.hidden = true;

    docs.sort(function (a, b) {
      var aTime = a.data().lastMessageAt ? a.data().lastMessageAt.toMillis() : 0;
      var bTime = b.data().lastMessageAt ? b.data().lastMessageAt.toMillis() : 0;
      return bTime - aTime;
    });

    docs.forEach(function (doc) {
      var data = doc.data();
      var otherLabel = C.otherParticipantsLabel(data.participants, data.participantNames, currentUser.uid, 3);

      var item = document.createElement("a");
      item.className = "dm-item";
      item.href = "communiques-dm.html?c=" + encodeURIComponent(doc.id);

      var name = document.createElement("p");
      name.className = "dm-item-name";
      name.textContent = otherLabel;
      item.appendChild(name);

      var preview = document.createElement("p");
      preview.className = "dm-item-preview";
      preview.textContent = (data.lastMessage || "No messages yet") + " · " + C.formatDate(data.lastMessageAt || data.createdAt, true);
      item.appendChild(preview);

      dmList.appendChild(item);
    });
  }

  function loadConversations() {
    dmLoading.hidden = false;
    dmEmpty.hidden = true;
    AgoraDB.collection("conversations")
      .where("participants", "array-contains", currentUser.uid)
      .get()
      .then(function (snap) { renderConversations(snap.docs); });
  }

  // --- Auth-driven visibility --------------------------------------------

  agoraOnAuthChange(function (user) {
    currentUser = user;

    var signedOut = !user;
    document.getElementById("dm-signed-out-notice").hidden = !signedOut;
    document.getElementById("dm-wrap").hidden = signedOut;

    if (user) {
      loadFriends();
      loadMessagableMembers();
      loadConversations();
    }
  });
})();

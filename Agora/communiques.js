// Drives communiques.html: the Dialogs inbox + new-Dialog recipient picker.
// Requires firebase-config.js, auth.js, and communiques-common.js to run
// first.

(function () {
  var C = CommuniquesCommon;
  var currentUser = null;
  var profileCache = null; // loaded once, lazily, for the DM recipient picker

  document.getElementById("dm-signin-prompt").addEventListener("click", function (e) {
    e.preventDefault();
    C.openSignInModal();
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
      var otherUid = (data.participants || []).filter(function (uid) { return uid !== currentUser.uid; })[0];
      var otherName = (data.participantNames && data.participantNames[otherUid]) || "Member";

      var item = document.createElement("a");
      item.className = "dm-item";
      item.href = "communiques-dm.html?c=" + encodeURIComponent(doc.id);

      var name = document.createElement("p");
      name.className = "dm-item-name";
      name.textContent = otherName;
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

  var newDmToggle = document.getElementById("new-dm-toggle");
  var newDmPicker = document.getElementById("new-dm-picker");
  var dmSearch = document.getElementById("dm-recipient-search");
  var dmResults = document.getElementById("dm-picker-results");

  newDmToggle.addEventListener("click", function () {
    newDmPicker.hidden = !newDmPicker.hidden;
    if (!newDmPicker.hidden) loadProfilesForPicker();
  });

  function loadProfilesForPicker() {
    if (profileCache) return;
    AgoraDB.collection("profiles").get().then(function (snap) {
      profileCache = snap.docs
        .filter(function (doc) { return doc.id !== currentUser.uid; })
        .map(function (doc) {
          var data = doc.data();
          var name = (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || "Member");
          return { uid: doc.id, name: name, handle: data.handle || "" };
        });
    });
  }

  function conversationIdFor(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  function openOrCreateConversation(other) {
    var conversationId = conversationIdFor(currentUser.uid, other.uid);
    var ref = AgoraDB.collection("conversations").doc(conversationId);

    ref.get().then(function (doc) {
      if (doc.exists) {
        window.location.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);
        return;
      }
      C.getDisplayName(currentUser).then(function (myName) {
        var participantNames = {};
        participantNames[currentUser.uid] = myName;
        participantNames[other.uid] = other.name;
        var now = firebase.firestore.FieldValue.serverTimestamp();
        return ref.set({
          participants: [currentUser.uid, other.uid],
          participantNames: participantNames,
          lastMessage: "",
          lastMessageAt: now,
          createdAt: now,
        });
      }).then(function () {
        window.location.href = "communiques-dm.html?c=" + encodeURIComponent(conversationId);
      });
    });
  }

  function renderPickerResults(query) {
    dmResults.textContent = "";
    if (!profileCache || !query) return;
    var q = query.toLowerCase();
    var matches = profileCache.filter(function (p) {
      return p.name.toLowerCase().indexOf(q) !== -1 || p.handle.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);

    matches.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dm-picker-result";
      btn.textContent = p.name;
      btn.addEventListener("click", function () {
        openOrCreateConversation(p);
      });
      dmResults.appendChild(btn);
    });
  }

  dmSearch.addEventListener("input", function () {
    renderPickerResults(dmSearch.value.trim());
  });

  // --- Auth-driven visibility --------------------------------------------

  agoraOnAuthChange(function (user) {
    currentUser = user;

    var signedOut = !user;
    document.getElementById("dm-signed-out-notice").hidden = !signedOut;
    document.getElementById("dm-wrap").hidden = signedOut;

    if (user) {
      loadConversations();
    }
  });
})();

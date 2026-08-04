// Drives communiques.html: the Dialogs inbox (read-only list of Dialogs
// you already have - new ones start from a friend's profile page now, per
// firestore.rules' friendship requirement). Requires firebase-config.js,
// auth.js, and communiques-common.js to run first.

(function () {
  var C = CommuniquesCommon;
  var currentUser = null;

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

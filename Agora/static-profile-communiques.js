// Adds Wall + Dialogs (Communiqués 📨) to a static, hand-written Agora
// profile page (Agora/profiles/*.html). These members have no real
// Firestore/Auth account (see CLAUDE.md - the AI ones need the future
// Agora Harness 🚡 before they can sign in themselves), so each page sets
// window.StaticProfile = { uid: "<slug>", name: "<Display Name>" } before
// this script loads, and the slug stands in for a Firestore UID: any
// signed-in Agora member can post to this Wall or start a Dialog here,
// but nobody signs in *as* this member to reply yet. Requires
// firebase-config.js, auth.js, and communiques-common.js to run first.

(function () {
  var profile = window.StaticProfile;
  if (!profile) return;

  var C = CommuniquesCommon;
  var currentUser = null;

  var communiquesWrap = document.getElementById("member-communiques");
  var signedOutNotice = document.getElementById("communiques-signed-out-notice");

  document.getElementById("communiques-signin-prompt").addEventListener("click", function (e) {
    e.preventDefault();
    C.openSignInModal();
  });

  var wallPostHint = document.getElementById("wall-post-hint");
  if (wallPostHint && typeof AgoraBioTags !== "undefined") {
    wallPostHint.textContent = AgoraBioTags.hint;
  }

  // --- Wall ----------------------------------------------------------------

  var wallController = C.createWallController(profile.uid, function () { return currentUser; });

  // --- Dialogs ---------------------------------------------------------

  var dialogsList = document.getElementById("dialogs-list");
  var dialogsLoading = document.getElementById("dialogs-loading");
  var dialogsEmpty = document.getElementById("dialogs-empty");
  var startDialogBtn = document.getElementById("start-dialog-btn");

  function renderDialogs(docs) {
    dialogsLoading.hidden = true;
    dialogsList.textContent = "";
    if (!docs.length) {
      dialogsEmpty.hidden = false;
      return;
    }
    dialogsEmpty.hidden = true;

    docs.sort(function (a, b) {
      var aTime = a.data().lastMessageAt ? a.data().lastMessageAt.toMillis() : 0;
      var bTime = b.data().lastMessageAt ? b.data().lastMessageAt.toMillis() : 0;
      return bTime - aTime;
    });

    docs.forEach(function (doc) {
      var data = doc.data();
      var otherUid = (data.participants || []).filter(function (p) { return p !== profile.uid; })[0];
      var otherName = (data.participantNames && data.participantNames[otherUid]) || "Member";

      var item = document.createElement("a");
      item.className = "dm-item";
      item.href = "../communiques-dm.html?c=" + encodeURIComponent(doc.id);

      var name = document.createElement("p");
      name.className = "dm-item-name";
      name.textContent = otherName;
      item.appendChild(name);

      var preview = document.createElement("p");
      preview.className = "dm-item-preview";
      preview.textContent = (data.lastMessage || "No messages yet") + " · " + C.formatDate(data.lastMessageAt || data.createdAt, true);
      item.appendChild(preview);

      dialogsList.appendChild(item);
    });
  }

  function loadDialogs() {
    dialogsLoading.hidden = false;
    dialogsEmpty.hidden = true;
    AgoraDB.collection("conversations").where("participants", "array-contains", profile.uid).get()
      .then(function (snap) { renderDialogs(snap.docs); });
  }

  function conversationIdFor(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  if (startDialogBtn) {
    startDialogBtn.addEventListener("click", function () {
      if (!currentUser) return;
      var conversationId = conversationIdFor(currentUser.uid, profile.uid);
      var ref = AgoraDB.collection("conversations").doc(conversationId);

      ref.get().then(function (doc) {
        if (doc.exists) {
          window.location.href = "../communiques-dm.html?c=" + encodeURIComponent(conversationId);
          return;
        }
        C.getDisplayName(currentUser).then(function (myName) {
          var participantNames = {};
          participantNames[currentUser.uid] = myName;
          participantNames[profile.uid] = profile.name;
          var now = firebase.firestore.FieldValue.serverTimestamp();
          return ref.set({
            participants: [currentUser.uid, profile.uid],
            participantNames: participantNames,
            lastMessage: "",
            lastMessageAt: now,
            createdAt: now,
          });
        }).then(function () {
          window.location.href = "../communiques-dm.html?c=" + encodeURIComponent(conversationId);
        });
      });
    });
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    var signedOut = !user;
    signedOutNotice.hidden = !signedOut;
    communiquesWrap.hidden = signedOut;

    if (user) {
      wallController.loadWall();
      loadDialogs();
    }
  });
})();

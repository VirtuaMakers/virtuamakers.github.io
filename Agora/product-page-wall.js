// Adds a Wall (Communiqués 📨 Posts + comments, no Dialogs - see
// CLAUDE.md's "Product Pages Wall" entry) to a root-level *-product.html
// page. Same slug-stands-in-for-a-uid pattern the 30 static
// Agora/profiles/*.html pages already use via static-profile-communiques.js
// - each page sets window.ProductPage = { uid: "<slug>", name: "<Product
// Name>" } before this script loads, and the slug is passed straight into
// CommuniquesCommon.createWallController() as the Wall's own profileUid.
// No real Firestore profile doc ever exists for it - canPostToWall()/
// requiresFriendshipToPost() in firestore.rules already resolve "no
// profile doc" to open, the exact same rule the static profile pages
// already rely on, so no rules change was needed for this. Requires
// firebase-config.js, auth.js, moderation-client.js, and
// communiques-common.js to load first.

(function () {
  var product = window.ProductPage;
  if (!product) return;

  var C = CommuniquesCommon;
  var currentUser = null;

  var wallWrap = document.getElementById("product-wall-content");
  var signedOutNotice = document.getElementById("product-wall-signed-out-notice");
  var signInPrompt = document.getElementById("product-wall-signin-prompt");

  if (signInPrompt) {
    signInPrompt.addEventListener("click", function (e) {
      e.preventDefault();
      C.openSignInModal();
    });
  }

  var wallPostHint = document.getElementById("wall-post-hint");
  if (wallPostHint && typeof AgoraBioTags !== "undefined") {
    wallPostHint.textContent = AgoraBioTags.hint;
  }

  var wallController = C.createWallController(product.uid, function () { return currentUser; });

  agoraOnAuthChange(function (user) {
    currentUser = user;
    var signedOut = !user;
    if (signedOutNotice) signedOutNotice.hidden = !signedOut;
    if (wallWrap) wallWrap.hidden = signedOut;

    if (user) {
      wallController.loadWall();
    }
  });
})();

// Drives leave-agora.html: the dedicated page for permanently deleting a
// member's own profile and Firebase Auth login. Reached only via the
// "Permanently Leave Agora" link at the bottom of create-profile.html.

(function () {
  var signedOutNotice = document.getElementById("signed-out-notice");
  var content = document.getElementById("leave-content");
  var leaveBtn = document.getElementById("leave-btn");
  var statusEl = document.getElementById("leave-status");

  var currentUser = null;

  agoraOnAuthChange(function (user) {
    currentUser = user;
    signedOutNotice.hidden = !!user;
    content.hidden = !user;
  });

  function deleteUserWithReauth(user) {
    return user.delete().catch(function (err) {
      if (err.code !== "auth/requires-recent-login") throw err;
      var providerId = user.providerData[0] && user.providerData[0].providerId;
      var provider = providerId === "google.com" ? agoraGoogleProvider
        : providerId === "twitter.com" ? agoraTwitterProvider
        : null;
      if (!provider) {
        throw new Error("For security, please sign out and sign back in, then try leaving again right away.");
      }
      return user.reauthenticateWithPopup(provider).then(function () {
        return user.delete();
      });
    });
  }

  leaveBtn.addEventListener("click", function () {
    var user = currentUser;
    if (!user) return;

    leaveBtn.disabled = true;
    statusEl.hidden = false;

    // selfDeleteAccount (Cloud Function) does the whole job server-side -
    // profile doc, Auth login, and the farewell email - in one call, and
    // never hits auth/requires-recent-login since it runs as the Admin SDK.
    // Falls back to the old direct client-side path if the function isn't
    // deployed yet or the call fails for some other reason.
    var viaFunction = (typeof firebase !== "undefined" && firebase.functions)
      ? firebase.functions().httpsCallable("selfDeleteAccount")({})
      : Promise.reject(new Error("selfDeleteAccount not available"));

    viaFunction
      .catch(function () {
        return AgoraDB.collection("profiles").doc(user.uid).delete()
          .then(function () { return deleteUserWithReauth(user); });
      })
      .then(function () {
        window.location.href = "index.html";
      })
      .catch(function (err) {
        leaveBtn.disabled = false;
        statusEl.hidden = true;
        window.alert("Something went wrong: " + err.message);
      });
  });
})();

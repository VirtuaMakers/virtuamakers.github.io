// Real, closed-browser push notifications (Chris, 2026-08-11) - a header
// "🔔 Enable Notifications" control that requests browser permission and
// registers this device for FCM. Requires firebase-config.js, auth.js, and
// firebase-messaging-compat.js to run first.
//
// The in-tab experience (toast + chime, any tab that's actually open and
// focused) is handled separately by notification-toast.js via a Firestore
// listener on the notifications collection, not by FCM directly -
// onMessage() below is a deliberate no-op so a focused tab doesn't also pop
// a redundant native OS notification on top of the in-tab toast. The
// browser only falls back to sw.js's onBackgroundMessage (a real system
// notification) once no Agora tab is focused/visible, which is the actual
// "closed browser" case this feature is for.

(function () {
  if (typeof firebase === "undefined" || !firebase.messaging) return;
  if (typeof AGORA_VAPID_KEY === "undefined" || !AGORA_VAPID_KEY) return;

  var btn = document.getElementById("agora-notifications-btn");
  var currentUser = null;

  function setButtonState() {
    if (!btn) return;
    if (!currentUser || !("Notification" in window)) {
      btn.hidden = true;
      return;
    }
    // Nothing left for the button to do once granted, and browsers block
    // re-prompting once denied (the visitor would have to change their own
    // browser site settings) - either way, hide it rather than show a
    // button that can't do anything.
    btn.hidden = Notification.permission !== "default";
  }

  function registerToken() {
    if (!navigator.serviceWorker || !currentUser) return;
    navigator.serviceWorker.ready.then(function (registration) {
      var messaging = firebase.messaging();
      messaging.getToken({ vapidKey: AGORA_VAPID_KEY, serviceWorkerRegistration: registration })
        .then(function (token) {
          if (!token || !currentUser) return;
          AgoraDB.collection("profiles").doc(currentUser.uid)
            .collection("fcmTokens").doc(token)
            .set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        })
        .catch(function (err) {
          console.error("FCM token registration failed:", err);
        });
      messaging.onMessage(function () {});
    });
  }

  if (btn) {
    btn.addEventListener("click", function () {
      Notification.requestPermission().then(function (permission) {
        setButtonState();
        if (permission === "granted") registerToken();
      });
    });
  }

  agoraOnAuthChange(function (user) {
    currentUser = user;
    setButtonState();
    if (user && "Notification" in window && Notification.permission === "granted") {
      registerToken();
    }
  });
})();

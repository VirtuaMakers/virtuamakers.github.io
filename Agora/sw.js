// Real closed-browser push notifications (Chris, 2026-08-11) - merged into
// this existing service worker rather than registered as a second, separate
// one, since two service workers both scoped to "/Agora/" would conflict
// (the browser can only have one controller per scope; Firebase's own docs
// warn against this exact double-registration). onBackgroundMessage() only
// fires when no Agora tab is focused - an open tab handles the same event
// directly via push-notifications.js's onMessage() instead.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCZbFaRIsuHvdddW2XJ-m48qfrOwrv6Hx8",
  authDomain: "agora-firebase-f4240.firebaseapp.com",
  projectId: "agora-firebase-f4240",
  storageBucket: "agora-firebase-f4240.firebasestorage.app",
  messagingSenderId: "943817225186",
  appId: "1:943817225186:web:6636b90f3a76dff77e7fbb",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || "Agora 🌐";
  var body = (payload.notification && payload.notification.body) || "";
  var url = (payload.data && payload.data.url) || "https://www.virtuamakers.com/Agora/";

  self.registration.showNotification(title, {
    body: body,
    icon: "https://www.virtuamakers.com/Agora/assets/agora-logo.png",
    data: { url: url },
  });
});

// Clicking the system notification focuses an already-open Agora tab if
// one exists, rather than always opening a new one.
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url)
    || "https://www.virtuamakers.com/Agora/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url === url && "focus" in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Bump CACHE_NAME whenever the precached shell list below changes, same
// convention as style.css?v= - old caches are swept on the next activate.
const CACHE_NAME = "agora-shell-v1";
const SHELL_ASSETS = [
  "/Agora/index.html",
  "/Agora/manifest.json",
  "/Agora/assets/icons/icon-192.png",
  "/Agora/assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network-first, so visitors always get the latest content while
  // the site is under active development; cache is only the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(
          () =>
            caches.match(request).then(
              (cached) => cached || caches.match("/Agora/index.html")
            )
        )
    );
    return;
  }

  // Static assets: cache-first, falling back to network and caching the result.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

// Agora's own Firebase project - separate from the Dimonds Firebase project.
// This config is not a secret (it's a public client identifier) - Firestore
// security rules (see firestore.rules) are what actually protect the data.

// Firebase Console -> Project Settings -> Cloud Messaging -> Web Push
// certificates -> generate a key pair, paste the public key here. Not a
// secret (it's shipped to every visitor's browser regardless), just
// blank until Chris runs that one console step - see CLAUDE.md's
// "Push notifications" section. push-notifications.js no-ops without it.
const AGORA_VAPID_KEY = "BFlGxDYGlbQkOHJltOwuWuLxdwXgejUbvbxzR3jkbs0YLq9HRI0V2sPK2OFN3WxzSA8eIgM-irWf3rOz7y8s5B0";

const AGORA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCZbFaRIsuHvdddW2XJ-m48qfrOwrv6Hx8",
  authDomain: "agora-firebase-f4240.firebaseapp.com",
  projectId: "agora-firebase-f4240",
  storageBucket: "agora-firebase-f4240.firebasestorage.app",
  messagingSenderId: "943817225186",
  appId: "1:943817225186:web:6636b90f3a76dff77e7fbb",
  measurementId: "G-2YC9081F62",
};

if (!firebase.apps.length) firebase.initializeApp(AGORA_FIREBASE_CONFIG);
const AgoraAuth = firebase.auth();
const AgoraDB = firebase.firestore();
// Speed (Chris, 2026-10-13 - "Is Facebook just that much faster than
// Agora?"): Agora is separate pages, so every click used to start from an
// empty Firestore and wait on the server for everything. With the local
// cache on, live views (open Dialog windows, the Friends List, toasts)
// paint straight away from what this browser already saw, then update from
// the server a moment later. synchronizeTabs lets several Agora tabs share
// it. Unsupported browsers or private windows just skip it.
try {
  AgoraDB.enablePersistence({ synchronizeTabs: true }).catch(function () {});
} catch (e) {}
// Only pages that load firebase-storage-compat.js (currently just
// create-profile.html, for picture uploads) get a real Storage instance -
// every other page still loads this same shared config file, so this must
// stay optional rather than throwing when the SDK script isn't present.
const AgoraStorage = firebase.storage ? firebase.storage() : null;

// Agora's own Firebase project - separate from the Dimonds Firebase project.
// Chris: create this project in the Firebase console (Authentication + Firestore
// enabled), then replace the placeholder values below with the config object
// from Project settings -> General -> Your apps -> Web app. This config is
// not a secret (it's a public client identifier) - Firestore security rules
// (see firestore.rules) are what actually protect the data.
//
// Not wired into any page yet - loading this with placeholder values would
// throw "invalid API key" errors. Swap in the real config, then add the
// script tags (firebase-app-compat.js, firebase-auth-compat.js,
// firebase-firestore-compat.js, this file) to index.html and the profile
// pages to go live.

const AGORA_FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.firebasestorage.app",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

if (!firebase.apps.length) firebase.initializeApp(AGORA_FIREBASE_CONFIG);
const AgoraAuth = firebase.auth();
const AgoraDB = firebase.firestore();

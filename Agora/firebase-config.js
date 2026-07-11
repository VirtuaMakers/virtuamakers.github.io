// Agora's own Firebase project - separate from the Dimonds Firebase project.
// This config is not a secret (it's a public client identifier) - Firestore
// security rules (see firestore.rules) are what actually protect the data.

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

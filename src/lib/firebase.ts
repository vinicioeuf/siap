import { initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function cleanEnv(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  // Vercel/UI sometimes stores values with wrapping quotes when pasted from .env.
  return trimmed.replace(/^"|"$/g, "");
}

const firebaseApiKey = cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const firebaseAuthDomain = cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
const firebaseProjectId = cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const firebaseStorageBucket = cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
const firebaseMessagingSenderId = cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
const firebaseAppId = cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID);

if (!firebaseApiKey || !firebaseAuthDomain || !firebaseProjectId || !firebaseAppId) {
  throw new Error("Firebase env vars are missing or invalid in this build.");
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

const app = initializeApp(firebaseConfig);
const secondaryApp = initializeApp(firebaseConfig, "siap-secondary-auth");

const auth = getAuth(app);
const secondaryAuth = getAuth(secondaryApp);
const db = getFirestore(app);
const storage = getStorage(app);

// Secondary auth is isolated and does not replace the current logged session.
setPersistence(secondaryAuth, inMemoryPersistence).catch((err) => {
  console.warn("Failed to set secondary auth persistence:", err);
});

export { app, auth, db, storage, secondaryAuth };
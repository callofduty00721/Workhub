import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// All six are required together for Firebase phone auth to work — if any is
// missing, treat it as "not configured" rather than half-initializing.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

export function getFirebaseAuth() {
  if (!isFirebaseConfigured) throw new Error("Firebase isn't configured (missing VITE_FIREBASE_* env vars)");
  const app = getApps()[0] ?? initializeApp(config);
  return getAuth(app);
}

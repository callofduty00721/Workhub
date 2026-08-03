import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const isFirebaseConfigured = () =>
  Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

// Lazily initialized so a server with no Firebase env vars set doesn't crash
// on boot — it just can't be picked as the active phoneAuthProvider.
function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // .env stores the key with literal "\n" sequences — real newlines break
      // most .env parsers/shells, so they're escaped on the way in and
      // unescaped here.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

/**
 * Verifies a Firebase phone-auth ID token (obtained client-side via
 * signInWithPhoneNumber + confirmationResult.confirm(code)) and returns the
 * verified phone number. Throws if the token is invalid/expired or wasn't
 * actually a phone-auth sign-in (no phone_number claim).
 */
export async function verifyFirebasePhoneIdToken(idToken) {
  const app = getFirebaseApp();
  if (!app) throw new Error("Firebase phone auth is not configured on this server");

  const decoded = await getAuth(app).verifyIdToken(idToken);
  if (!decoded.phone_number) {
    throw new Error("This sign-in wasn't a phone verification");
  }
  return { phoneNumber: decoded.phone_number };
}

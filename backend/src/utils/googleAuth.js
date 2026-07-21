import { OAuth2Client } from "google-auth-library";

export const isGoogleAuthConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID);

const client = isGoogleAuthConfigured() ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

/**
 * Verifies a Google Identity Services ID token and returns the payload
 * (sub, email, name, picture) or throws if invalid.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!client) throw new Error("Google OAuth is not configured on this server");

  const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  return ticket.getPayload();
}

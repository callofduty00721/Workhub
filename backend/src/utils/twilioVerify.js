import twilio from "twilio";

export const isTwilioConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);

let client = null;
function getClient() {
  if (!isTwilioConfigured()) return null;
  if (!client) client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client;
}

// Twilio Verify sends and checks the code itself (no OTP hash stored on our
// side, unlike the old email flow) — `phone` must be E.164 (e.g. +919876543210).
export async function startTwilioVerification(phone) {
  const c = getClient();
  if (!c) throw new Error("Twilio phone verification is not configured on this server");

  await c.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: phone, channel: "sms" });
}

export async function checkTwilioVerification(phone, code) {
  const c = getClient();
  if (!c) throw new Error("Twilio phone verification is not configured on this server");

  const result = await c.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: phone, code });
  return result.status === "approved";
}

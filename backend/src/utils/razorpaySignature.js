import crypto from "crypto";

// Shared by every place that checks a Razorpay HMAC signature (order/payment
// verify, and the webhook) — a plain `expected !== actual` string compare
// leaks timing information an attacker can use to guess the correct
// signature byte-by-byte, the same reason password/token comparisons use a
// constant-time check. crypto.timingSafeEqual throws on mismatched buffer
// lengths instead of returning false, so length is checked first — a
// short/garbage signature from an attacker must fail safely, not crash the
// request.
export function verifyRazorpaySignature(payload, signature, secret) {
  if (!signature || typeof signature !== "string") return false;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

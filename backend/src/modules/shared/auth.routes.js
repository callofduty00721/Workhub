import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  googleLogin,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  deactivateAccount,
} from "./auth.controller.js";
import { protect } from "../../middleware/auth.js";
import { requireTrustedOrigin } from "../../middleware/originCheck.js";
import { createRateLimitStore } from "../../utils/rateLimitStore.js";

const router = Router();

const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const authLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
  // Shared across instances once REDIS_URL is set — otherwise a brute-force
  // attempt spread across instances behind a load balancer could get
  // windowMs * instanceCount worth of tries instead of windowMs worth.
  store: createRateLimitStore(AUTH_RATE_LIMIT_WINDOW_MS, "auth"),
});

router.post("/register", authLimiter, register);
router.post("/verify-otp", authLimiter, verifyRegisterOtp);
router.post("/resend-otp", authLimiter, resendRegisterOtp);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.post("/refresh", requireTrustedOrigin, refresh);
router.post("/logout", requireTrustedOrigin, logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protect, resendVerificationEmail);
router.put("/change-password", authLimiter, protect, changePassword);
router.post("/deactivate", authLimiter, protect, deactivateAccount);
router.get("/me", protect, me);

export default router;

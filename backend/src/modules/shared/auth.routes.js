import { Router } from "express";
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
import { authRateLimit } from "../../middleware/authRateLimit.js";

const router = Router();

router.post("/register", authRateLimit, register);
router.post("/verify-otp", authRateLimit, verifyRegisterOtp);
router.post("/resend-otp", authRateLimit, resendRegisterOtp);
router.post("/login", authRateLimit, login);
router.post("/google", authRateLimit, googleLogin);
router.post("/refresh", requireTrustedOrigin, refresh);
router.post("/logout", requireTrustedOrigin, logout);
router.post("/forgot-password", authRateLimit, forgotPassword);
router.post("/reset-password/:token", authRateLimit, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protect, resendVerificationEmail);
router.put("/change-password", authRateLimit, protect, changePassword);
router.post("/deactivate", authRateLimit, protect, deactivateAccount);
router.get("/me", protect, me);

export default router;

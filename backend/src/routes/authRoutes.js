import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  googleLogin,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protect, resendVerificationEmail);
router.get("/me", protect, me);

export default router;

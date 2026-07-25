import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import startupRoutes from "./routes/startupRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import contestRoutes from "./routes/contestRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import freelancerRoutes from "./routes/freelancerRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import investorRoutes from "./routes/investorRoutes.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import partnerRoutes from "./routes/partnerRoutes.js";
import founderRoutes from "./routes/founderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import skillTestRoutes from "./routes/skillTestRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import startupUpdateRoutes from "./routes/startupUpdateRoutes.js";
import updateLikeRoutes from "./routes/updateLikeRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js";
import discussionLikeRoutes from "./routes/discussionLikeRoutes.js";
import teamApplicationRoutes from "./routes/teamApplicationRoutes.js";
import teamApplicationStatusRoutes from "./routes/teamApplicationStatusRoutes.js";
import investmentRoutes from "./routes/investmentRoutes.js";
import investmentStatusRoutes from "./routes/investmentStatusRoutes.js";
import { stripeWebhook, razorpayWebhook } from "./controllers/paymentController.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Stripe/Razorpay webhooks need the raw request body for signature verification,
// so they must be registered before the global express.json() body parser below.
app.post("/api/payments/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.post("/api/payments/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok", uptime: process.uptime() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/startups/:startupId/updates", startupUpdateRoutes);
app.use("/api/updates", updateLikeRoutes);
app.use("/api/startups/:startupId/discussions", discussionRoutes);
app.use("/api/discussions", discussionLikeRoutes);
app.use("/api/startups/:startupId/team-applications", teamApplicationRoutes);
app.use("/api/team-applications", teamApplicationStatusRoutes);
app.use("/api/startups/:startupId/investments", investmentRoutes);
app.use("/api/investments", investmentStatusRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/freelancers", freelancerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/founders", founderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/skill-tests", skillTestRoutes);
app.use("/api/companies", companyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

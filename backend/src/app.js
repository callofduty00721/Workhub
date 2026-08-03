import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./modules/shared/auth.routes.js";
import userRoutes from "./modules/shared/user.routes.js";
import startupRoutes from "./modules/startup/startup.routes.js";
import jobRoutes from "./modules/jobs/job.routes.js";
import projectRoutes from "./modules/jobs/project.routes.js";
import campaignRoutes from "./modules/campaign/campaign.routes.js";
import alertRoutes from "./modules/productivity/alert.routes.js";
import contestRoutes from "./modules/contest/contest.routes.js";
import applicationRoutes from "./modules/shared/application.routes.js";
import serviceRoutes from "./modules/marketplace/service.routes.js";
import freelancerRoutes from "./modules/jobs/freelancer.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import investorRoutes from "./modules/startup/investor.routes.js";
import mentorRoutes from "./modules/mentorship/mentor.routes.js";
import partnerRoutes from "./modules/mentorship/partner.routes.js";
import founderRoutes from "./modules/startup/founder.routes.js";
import notificationRoutes from "./modules/shared/notification.routes.js";
import uploadRoutes from "./modules/shared/upload.routes.js";
import reviewRoutes from "./modules/shared/review.routes.js";
import paymentRoutes from "./modules/finance/payment.routes.js";
import planRoutes from "./modules/finance/plan.routes.js";
import skillTestRoutes from "./modules/marketplace/skillTest.routes.js";
import companyRoutes from "./modules/shared/company.routes.js";
import startupUpdateRoutes from "./modules/startup/startupUpdate.routes.js";
import updateLikeRoutes from "./modules/startup/updateLike.routes.js";
import discussionRoutes from "./modules/startup/discussion.routes.js";
import discussionLikeRoutes from "./modules/startup/discussionLike.routes.js";
import teamApplicationRoutes from "./modules/startup/teamApplication.routes.js";
import teamApplicationStatusRoutes from "./modules/startup/teamApplicationStatus.routes.js";
import investmentRoutes from "./modules/startup/investment.routes.js";
import investmentStatusRoutes from "./modules/startup/investmentStatus.routes.js";
import roleRoutes from "./modules/shared/role.routes.js";
import pitchRoutes from "./modules/startup/pitch.routes.js";
import jobSeekerRoutes from "./modules/jobs/jobSeeker.routes.js";
import taskRoutes from "./modules/productivity/task.routes.js";
import influencerRoutes from "./modules/campaign/influencer.routes.js";
import contactRoutes from "./modules/shared/contact.routes.js";
import publicSettingsRoutes from "./modules/shared/publicSettings.routes.js";
import { stripeWebhook } from "./modules/finance/subscription.controller.js";
import { razorpayWebhook } from "./modules/finance/webhooks.controller.js";
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
app.use("/api/campaigns", campaignRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/freelancers", freelancerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/founders", founderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/skill-tests", skillTestRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/pitches", pitchRoutes);
app.use("/api/job-seekers", jobSeekerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/influencers", influencerRoutes);
app.use("/api/settings", publicSettingsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

import User, { ROLE_VALUES } from "../models/User.js";
import Startup from "../models/Startup.js";
import Job from "../models/Job.js";
import Service from "../models/Service.js";
import Contest from "../models/Contest.js";
import ContestEntry from "../models/ContestEntry.js";
import Investment from "../models/Investment.js";
import Payment from "../models/Payment.js";
import { getRazorpayClient, isRazorpayConfigured } from "../config/payments.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

const NEW_ACCOUNT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_FLAG_MIN_COUNT = 3;
const AUTO_FLAG_WINDOW_MS = 72 * 60 * 60 * 1000;

export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalStartups, totalJobs, totalServices, totalContests, usersByRole] = await Promise.all([
    User.countDocuments(),
    Startup.countDocuments(),
    Job.countDocuments(),
    Service.countDocuments(),
    Contest.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);

  const roleBreakdown = ROLE_VALUES.reduce((acc, role) => {
    acc[role] = usersByRole.find((r) => r._id === role)?.count || 0;
    return acc;
  }, {});

  res.json({
    success: true,
    data: { totalUsers, totalStartups, totalJobs, totalServices, totalContests, roleBreakdown },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items.map((u) => ({ ...u.toSafeJSON(), isBanned: u.isBanned })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const toggleBanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "super_admin") throw new ApiError(400, "Cannot ban a super admin");

  user.isBanned = !user.isBanned;
  await user.save();
  res.json({ success: true, isBanned: user.isBanned });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ROLE_VALUES.includes(role)) throw new ApiError(400, "Invalid role");

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  user.role = role;
  await user.save();
  res.json({ success: true, data: user.toSafeJSON() });
});

// Detects startups with a burst of "confirmed" investments from freshly-created
// investor accounts — a common fingerprint of a founder confirming fake/colluded
// reports to inflate their funding numbers. This is a heuristic, not proof.
async function detectSuspiciousFundingPatterns() {
  const confirmedInvestments = await Investment.find({ status: "confirmed" })
    .populate("investor", "name createdAt")
    .populate("startup", "name founder");

  const byStartup = new Map();
  for (const inv of confirmedInvestments) {
    if (!inv.startup || !inv.investor) continue;
    const investorAge = Date.now() - new Date(inv.investor.createdAt).getTime();
    if (investorAge >= NEW_ACCOUNT_WINDOW_MS) continue;

    const key = inv.startup._id.toString();
    if (!byStartup.has(key)) byStartup.set(key, { startup: inv.startup, times: [] });
    byStartup.get(key).times.push(new Date(inv.confirmedAt || inv.createdAt).getTime());
  }

  const flagged = [];
  for (const { startup, times } of byStartup.values()) {
    if (times.length < AUTO_FLAG_MIN_COUNT) continue;
    const span = Math.max(...times) - Math.min(...times);
    if (span <= AUTO_FLAG_WINDOW_MS) {
      flagged.push({
        startup,
        reason: `${times.length} confirmed investments from newly-created investor accounts within 72 hours`,
        count: times.length,
      });
    }
  }
  return flagged;
}

export const getFlaggedStartups = asyncHandler(async (req, res) => {
  const [reportedStartups, autoFlagged] = await Promise.all([
    Startup.find({ "reports.0": { $exists: true } })
      .select("name founder reports status isSuspended")
      .populate("founder", "name email")
      .populate("reports.user", "name email"),
    detectSuspiciousFundingPatterns(),
  ]);

  const byId = new Map();

  for (const s of reportedStartups) {
    byId.set(s._id.toString(), {
      startupId: s._id,
      name: s.name,
      founder: s.founder,
      status: s.status,
      isSuspended: s.isSuspended,
      reportCount: s.reports.length,
      reports: s.reports.map((r) => ({ user: r.user, reason: r.reason, createdAt: r.createdAt })),
      autoFlagged: false,
      autoReason: null,
    });
  }

  for (const { startup, reason, count } of autoFlagged) {
    const key = startup._id.toString();
    const existing = byId.get(key);
    if (existing) {
      existing.autoFlagged = true;
      existing.autoReason = reason;
    } else {
      byId.set(key, {
        startupId: startup._id,
        name: startup.name,
        founder: null,
        status: undefined,
        isSuspended: undefined,
        reportCount: 0,
        reports: [],
        autoFlagged: true,
        autoReason: reason,
        autoCount: count,
      });
    }
  }

  res.json({ success: true, data: Array.from(byId.values()) });
});

export const resolveFlaggedStartup = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!["dismiss", "suspend"].includes(action)) throw new ApiError(400, "Invalid action");

  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");

  startup.reports = [];
  if (action === "suspend") startup.isSuspended = true;
  await startup.save();

  res.json({ success: true, data: { startupId: startup._id, isSuspended: startup.isSuspended } });
});

export const listAllStartups = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (search) filter.name = new RegExp(search, "i");

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Startup.find(filter)
      .select("-reports")
      .populate("founder", "name email createdAt")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Startup.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const toggleFounderVerified = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");

  startup.founderVerified = !startup.founderVerified;
  await startup.save();

  res.json({ success: true, founderVerified: startup.founderVerified });
});

export const toggleBusinessVerified = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");

  startup.isVerified = !startup.isVerified;
  await startup.save();

  res.json({ success: true, isVerified: startup.isVerified });
});

export const listVerificationRequests = asyncHandler(async (req, res) => {
  const startups = await Startup.find({ "verificationRequests.status": "pending" })
    .select("name founder verificationRequests")
    .populate("founder", "name avatar email");

  const items = startups.flatMap((s) =>
    s.verificationRequests
      .filter((r) => r.status === "pending")
      .map((r) => ({
        _id: r._id,
        startupId: s._id,
        startupName: s.name,
        founder: s.founder,
        type: r.type,
        documents: r.documents,
        note: r.note,
        submittedAt: r.submittedAt,
      }))
  );

  res.json({ success: true, data: items });
});

export const reviewVerificationRequest = asyncHandler(async (req, res) => {
  const { action, reviewNote } = req.body;
  if (!["approve", "reject"].includes(action)) throw new ApiError(400, "Invalid action");

  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");

  const request = startup.verificationRequests.id(req.params.requestId);
  if (!request) throw new ApiError(404, "Verification request not found");
  if (request.status !== "pending") throw new ApiError(400, "This request has already been reviewed");

  request.status = action === "approve" ? "approved" : "rejected";
  request.reviewedAt = new Date();
  request.reviewNote = reviewNote || "";

  if (action === "approve") {
    if (request.type === "founder") startup.founderVerified = true;
    else startup.isVerified = true;
  }

  await startup.save();

  await notify(req.app, {
    user: startup.founder,
    type: "system",
    title: action === "approve" ? "Verification approved" : "Verification request rejected",
    message:
      action === "approve"
        ? `Your ${request.type} verification request for ${startup.name} was approved.`
        : `Your ${request.type} verification request for ${startup.name} was rejected.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
    link: `/startups/${startup._id}`,
  });

  res.json({ success: true, data: request });
});

// --- Gigs (Services) moderation ---

export const listAllServices = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, "i");

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Service.find(filter)
      .populate("freelancer", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Service.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const toggleServiceStatus = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Gig not found");

  service.status = service.status === "active" ? "paused" : "active";
  await service.save();

  if (service.status === "paused") {
    await notify(req.app, {
      user: service.freelancer,
      type: "system",
      title: "Your gig was paused by an admin",
      message: `"${service.title}" was paused and is no longer visible in the marketplace.`,
      link: "/dashboard/freelancer/gigs",
    });
  }

  res.json({ success: true, status: service.status });
});

export const removeService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Gig not found");

  await service.deleteOne();
  res.json({ success: true, message: "Gig removed" });
});

// --- Contests moderation ---

export const listAllContests = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, "i");

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Contest.find(filter)
      .populate("client", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Contest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const closeContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.status === "closed") throw new ApiError(400, "This contest is already closed");

  contest.status = "closed";
  await contest.save();

  await notify(req.app, {
    user: contest.client,
    type: "system",
    title: "Your contest was closed by an admin",
    message: `"${contest.title}" was closed and is no longer accepting entries.`,
    link: "/dashboard/client/contests",
  });

  res.json({ success: true, status: contest.status });
});

export const removeContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");

  await contest.deleteOne();
  await ContestEntry.deleteMany({ contest: contest._id });
  res.json({ success: true, message: "Contest removed" });
});

// --- Jobs moderation ---

export const listAllJobs = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, "i");

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Job.find(filter)
      .populate("employer", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Job.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const toggleJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  job.status = job.status === "closed" ? "open" : "closed";
  await job.save();

  if (job.status === "closed") {
    await notify(req.app, {
      user: job.employer,
      type: "system",
      title: "Your posting was closed by an admin",
      message: `"${job.title}" was closed and is no longer visible to applicants.`,
      link: "/dashboard/employer",
    });
  }

  res.json({ success: true, status: job.status });
});

export const removeJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  await job.deleteOne();
  res.json({ success: true, message: "Job removed" });
});

// --- Payments moderation (disputes) ---

export const listPayments = asyncHandler(async (req, res) => {
  const { disputeStatus, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (disputeStatus) filter.disputeStatus = disputeStatus;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate("payer", "name email avatar")
      .populate("payee", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const { action, note, refundAmount } = req.body;
  if (!["refund", "reject"].includes(action)) throw new ApiError(400, "Invalid action");

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.disputeStatus !== "raised") throw new ApiError(400, "This payment has no pending dispute");

  if (action === "refund") {
    const amountToRefund = refundAmount ? Number(refundAmount) : payment.amount;
    if (amountToRefund <= 0 || amountToRefund > payment.amount) {
      throw new ApiError(400, `Refund amount must be between ₹1 and ₹${payment.amount}`);
    }

    if (isRazorpayConfigured() && payment.providerPaymentId) {
      const razorpay = getRazorpayClient();
      await razorpay.payments.refund(payment.providerPaymentId, { amount: Math.round(amountToRefund * 100) });
    }

    payment.refundedAmount = amountToRefund;
    payment.status = amountToRefund < payment.amount ? "partially_refunded" : "refunded";
    payment.disputeStatus = "refunded";
  } else {
    payment.disputeStatus = "rejected";
  }
  payment.disputeResolutionNote = note || "";
  await payment.save();

  await notify(req.app, {
    user: payment.payer,
    type: "system",
    title:
      action === "refund"
        ? `Your dispute was resolved: ₹${payment.refundedAmount} refunded`
        : "Your dispute was reviewed and rejected",
    message: note || "",
    link: "/dashboard/client/payments",
  });

  res.json({ success: true, data: payment });
});

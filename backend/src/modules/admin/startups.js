import Startup from "../startup/startup.model.js";
import Investment from "../startup/investment.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const NEW_ACCOUNT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_FLAG_MIN_COUNT = 3;
const AUTO_FLAG_WINDOW_MS = 72 * 60 * 60 * 1000;

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
  startup.lastFlagReviewedBy = req.user._id;
  startup.lastFlagReviewedAt = new Date();
  await startup.save();

  res.json({ success: true, data: { startupId: startup._id, isSuspended: startup.isSuspended } });
});

export const listAllStartups = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = {};
  if (search) filter.name = new RegExp(search, "i");

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Startup.find(filter)
      .select("-reports")
      .populate("founder", "name email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Startup.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
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
  request.reviewedBy = req.user._id;

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

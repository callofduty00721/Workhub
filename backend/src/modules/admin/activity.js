import User from "../shared/user.model.js";
import Startup from "../startup/startup.model.js";
import Withdrawal from "../finance/withdrawal.model.js";
import Payment from "../shared/payment.model.js";
import Grievance from "../shared/grievance.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const RECENT_PER_SOURCE = 30;
const RESULT_LIMIT = 50;

// A staff account only sees what its own permissions cover (see
// requirePermission) — this page exists precisely to let a super_admin see
// across all of it in one place, so it's deliberately not itself delegable.
// Pulled from the reviewedBy/processedBy/resolvedBy fields added alongside
// the staff-permission system — real actor attribution, not inferred.
export const listActivity = asyncHandler(async (req, res) => {
  const [kycReviews, startupVerifications, flaggedStartups, withdrawals, disputes, grievances] = await Promise.all([
    User.find({ $or: [{ kycReviewedBy: { $exists: true } }, { faceVerificationReviewedBy: { $exists: true } }, { addressVerificationReviewedBy: { $exists: true } }, { bankVerificationReviewedBy: { $exists: true } }] })
      .select("name kycStatus kycReviewedBy kycSubmittedAt faceVerificationStatus faceVerificationReviewedBy faceVerificationSubmittedAt addressVerificationStatus addressVerificationReviewedBy addressVerificationSubmittedAt bankVerificationStatus bankVerificationReviewedBy bankVerificationSubmittedAt")
      .sort({ updatedAt: -1 })
      .limit(RECENT_PER_SOURCE),
    Startup.find({ "verificationRequests.reviewedBy": { $exists: true } })
      .select("name verificationRequests")
      .sort({ updatedAt: -1 })
      .limit(RECENT_PER_SOURCE),
    Startup.find({ lastFlagReviewedBy: { $exists: true } })
      .select("name isSuspended lastFlagReviewedBy lastFlagReviewedAt")
      .sort({ lastFlagReviewedAt: -1 })
      .limit(RECENT_PER_SOURCE),
    Withdrawal.find({ processedBy: { $exists: true } })
      .select("amount status processedBy processedAt")
      .sort({ processedAt: -1 })
      .limit(RECENT_PER_SOURCE),
    Payment.find({ disputeResolvedBy: { $exists: true } })
      .select("amount disputeStatus disputeResolvedBy updatedAt")
      .sort({ updatedAt: -1 })
      .limit(RECENT_PER_SOURCE),
    Grievance.find({ resolvedBy: { $exists: true } })
      .select("subject status resolvedBy resolvedAt")
      .sort({ resolvedAt: -1 })
      .limit(RECENT_PER_SOURCE),
  ]);

  const entries = [];

  for (const user of kycReviews) {
    if (user.kycReviewedBy) {
      entries.push({ type: "kyc", actorId: user.kycReviewedBy, target: user.name, detail: `Government ID — ${user.kycStatus}`, at: user.kycSubmittedAt });
    }
    if (user.faceVerificationReviewedBy) {
      entries.push({ type: "kyc", actorId: user.faceVerificationReviewedBy, target: user.name, detail: `Face verification — ${user.faceVerificationStatus}`, at: user.faceVerificationSubmittedAt });
    }
    if (user.addressVerificationReviewedBy) {
      entries.push({ type: "profile-verifications", actorId: user.addressVerificationReviewedBy, target: user.name, detail: `Address verification — ${user.addressVerificationStatus}`, at: user.addressVerificationSubmittedAt });
    }
    if (user.bankVerificationReviewedBy) {
      entries.push({ type: "profile-verifications", actorId: user.bankVerificationReviewedBy, target: user.name, detail: `Bank verification — ${user.bankVerificationStatus}`, at: user.bankVerificationSubmittedAt });
    }
  }

  for (const startup of startupVerifications) {
    for (const request of startup.verificationRequests) {
      if (request.reviewedBy) {
        entries.push({ type: "startups", actorId: request.reviewedBy, target: startup.name, detail: `${request.type} verification — ${request.status}`, at: request.reviewedAt });
      }
    }
  }

  for (const startup of flaggedStartups) {
    entries.push({
      type: "flagged-startups",
      actorId: startup.lastFlagReviewedBy,
      target: startup.name,
      detail: startup.isSuspended ? "Suspended" : "Dismissed flags",
      at: startup.lastFlagReviewedAt,
    });
  }

  for (const w of withdrawals) {
    entries.push({ type: "withdrawals", actorId: w.processedBy, target: `₹${w.amount}`, detail: `Withdrawal — ${w.status}`, at: w.processedAt });
  }

  for (const p of disputes) {
    entries.push({ type: "payments", actorId: p.disputeResolvedBy, target: `₹${p.amount}`, detail: `Payment dispute — ${p.disputeStatus}`, at: p.updatedAt });
  }

  for (const g of grievances) {
    entries.push({ type: "grievances", actorId: g.resolvedBy, target: g.subject || "(No subject)", detail: `Grievance — ${g.status}`, at: g.resolvedAt });
  }

  const sorted = entries.filter((e) => e.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, RESULT_LIMIT);

  const actorIds = [...new Set(sorted.map((e) => e.actorId.toString()))];
  const actors = await User.find({ _id: { $in: actorIds } }).select("name role");
  const actorById = new Map(actors.map((a) => [a._id.toString(), a]));

  const data = sorted.map((e) => ({
    type: e.type,
    target: e.target,
    detail: e.detail,
    at: e.at,
    actor: actorById.get(e.actorId.toString()) ? { name: actorById.get(e.actorId.toString()).name, role: actorById.get(e.actorId.toString()).role } : null,
  }));

  res.json({ success: true, data });
});

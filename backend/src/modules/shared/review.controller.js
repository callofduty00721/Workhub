import Review from "./review.model.js";
import User from "./user.model.js";
import Service from "../marketplace/service.model.js";
import Startup from "../startup/startup.model.js";
import Payment from "./payment.model.js";
import Job from "../jobs/job.model.js";
import Project from "../jobs/project.model.js";
import Application from "./application.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";

// Reviews for services/users must be backed by a real completed transaction —
// a paid gig order, a paid hire, or a traditional job hire — so reviews can't
// be posted by people who never actually worked together. Startup reviews are
// exempt: those are community feedback, not tied to a transaction.
async function hasCompletedRelationship(reviewerId, targetType, targetId) {
  if (targetType === "service") {
    return Payment.exists({ payer: reviewerId, type: "gig_order", service: targetId, status: "paid" });
  }

  if (targetType === "user") {
    // Symmetric: a completed payment or hire in EITHER direction qualifies —
    // clients can review freelancers, and freelancers can review clients they
    // worked with, since both sides know each other after a real transaction.
    const relatedPayment = await Payment.exists({
      status: "paid",
      $or: [
        { payer: reviewerId, payee: targetId },
        { payer: targetId, payee: reviewerId },
      ],
    });
    if (relatedPayment) return true;

    // Application.job is polymorphic (Job or Project) — check both collections
    // for a hire relationship, in either review direction.
    const [reviewerJobIds, reviewerProjectIds, targetJobIds, targetProjectIds] = await Promise.all([
      Job.find({ employer: reviewerId }).distinct("_id"),
      Project.find({ employer: reviewerId }).distinct("_id"),
      Job.find({ employer: targetId }).distinct("_id"),
      Project.find({ employer: targetId }).distinct("_id"),
    ]);

    const reviewerPostingIds = [...reviewerJobIds, ...reviewerProjectIds];
    if (reviewerPostingIds.length && (await Application.exists({ job: { $in: reviewerPostingIds }, applicant: targetId, status: "hired" }))) {
      return true;
    }

    const targetPostingIds = [...targetJobIds, ...targetProjectIds];
    if (targetPostingIds.length && (await Application.exists({ job: { $in: targetPostingIds }, applicant: reviewerId, status: "hired" }))) {
      return true;
    }

    return false;
  }

  return true;
}

const TARGET_MODELS = { user: User, service: Service, startup: Startup };

async function recomputeRating(targetType, targetId) {
  const Model = TARGET_MODELS[targetType];
  if (!Model) return;

  const [agg] = await Review.aggregate([
    { $match: { targetType, targetId } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Model.findByIdAndUpdate(targetId, {
    rating: agg ? Math.round(agg.avgRating * 10) / 10 : 0,
    reviewCount: agg ? agg.count : 0,
  });
}

export const listReviews = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.query;
  if (!targetType || !targetId) throw new ApiError(400, "targetType and targetId are required");

  const reviews = await Review.find({ targetType, targetId }).populate("reviewer", "name avatar").sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const { targetType, targetId, rating, comment } = req.body;
  if (!["user", "service", "startup"].includes(targetType)) throw new ApiError(400, "Invalid targetType");
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, "Rating must be between 1 and 5");

  const existing = await Review.findOne({ reviewer: req.user._id, targetType, targetId });
  if (existing) throw new ApiError(409, "You have already reviewed this");

  const eligible = await hasCompletedRelationship(req.user._id, targetType, targetId);
  if (!eligible) {
    throw new ApiError(403, "You can only leave a review after a completed payment or hire with this freelancer/gig");
  }

  const review = await Review.create({ reviewer: req.user._id, targetType, targetId, rating, comment });
  await recomputeRating(targetType, targetId);

  if (targetType === "user") {
    await notify(req.app, {
      user: targetId,
      type: "review_received",
      title: "You received a new review",
      message: `${req.user.name} left you a ${rating}-star review`,
      link: "/dashboard/messages",
    });
  }

  res.status(201).json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");
  if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to delete this review");
  }

  await review.deleteOne();
  await recomputeRating(review.targetType, review.targetId);
  res.json({ success: true, message: "Review deleted" });
});

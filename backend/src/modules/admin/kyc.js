import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { earningsLinkForRole } from "../../utils/earningsLink.js";

export const listKycRequests = asyncHandler(async (req, res) => {
  const users = await User.find({ kycStatus: "pending" })
    .select("name email avatar kycDocuments kycSubmittedAt")
    .sort({ kycSubmittedAt: 1 });
  res.json({ success: true, data: users });
});

export const reviewKyc = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  if (!["approve", "reject"].includes(action)) throw new ApiError(400, "Invalid action");

  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.kycStatus !== "pending") throw new ApiError(400, "This user has no pending verification request");

  user.kycStatus = action === "approve" ? "verified" : "rejected";
  user.kycReviewNote = note || "";
  user.kycReviewedBy = req.user._id;
  await user.save();

  await notify(req.app, {
    user: user._id,
    type: "system",
    title: action === "approve" ? "Your identity was verified" : "Verification request rejected",
    message:
      action === "approve"
        ? "You're now KYC-verified and can withdraw your earnings."
        : note || "Please resubmit with clearer documents.",
    link: earningsLinkForRole(user.role),
  });

  res.json({ success: true, data: user.toSafeJSON() });
});

// --- Face / Address / Bank verification moderation ---
// Same submit-then-review shape as KYC above, parameterized over which
// status/note/document field on User each verification type uses.
const VERIFICATION_TYPES = {
  face: {
    statusField: "faceVerificationStatus",
    noteField: "faceVerificationReviewNote",
    reviewedByField: "faceVerificationReviewedBy",
    submittedAtField: "faceVerificationSubmittedAt",
    selectFields: "name email avatar faceVerificationSelfie faceVerificationSubmittedAt",
    approvedTitle: "Your face verification was approved",
    approvedMessage: "You're now face-verified on GrowHive.",
  },
  address: {
    statusField: "addressVerificationStatus",
    noteField: "addressVerificationReviewNote",
    reviewedByField: "addressVerificationReviewedBy",
    submittedAtField: "addressVerificationSubmittedAt",
    selectFields: "name email avatar addressVerificationDocuments addressVerificationSubmittedAt",
    approvedTitle: "Your address verification was approved",
    approvedMessage: "Your address is now verified on GrowHive.",
  },
  bank: {
    statusField: "bankVerificationStatus",
    noteField: "bankVerificationReviewNote",
    reviewedByField: "bankVerificationReviewedBy",
    submittedAtField: "bankVerificationSubmittedAt",
    selectFields: "name email avatar bankVerificationDocuments bankVerificationSubmittedAt",
    approvedTitle: "Your bank verification was approved",
    approvedMessage: "Your bank details are now verified on GrowHive.",
  },
};

function verificationTypeConfig(type) {
  const config = VERIFICATION_TYPES[type];
  if (!config) throw new ApiError(400, "Invalid verification type");
  return config;
}

export const listProfileVerificationRequests = asyncHandler(async (req, res) => {
  const config = verificationTypeConfig(req.params.type);
  const users = await User.find({ [config.statusField]: "pending" })
    .select(config.selectFields)
    .sort({ [config.submittedAtField]: 1 });
  res.json({ success: true, data: users });
});

export const reviewProfileVerification = asyncHandler(async (req, res) => {
  const config = verificationTypeConfig(req.params.type);
  const { action, note } = req.body;
  if (!["approve", "reject"].includes(action)) throw new ApiError(400, "Invalid action");

  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user[config.statusField] !== "pending") throw new ApiError(400, "This user has no pending verification request");

  user[config.statusField] = action === "approve" ? "verified" : "rejected";
  user[config.noteField] = note || "";
  user[config.reviewedByField] = req.user._id;
  await user.save();

  await notify(req.app, {
    user: user._id,
    type: "system",
    title: action === "approve" ? config.approvedTitle : "Verification request rejected",
    message: action === "approve" ? config.approvedMessage : note || "Please resubmit with clearer documents.",
    link: "/dashboard/profile#kyc",
  });

  res.json({ success: true, data: user.toSafeJSON() });
});

import User from "../shared/user.model.js";
import VerificationAttempt from "../shared/verificationAttempt.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { streamVerificationHistoryPdf } from "../../utils/verificationHistoryPdf.js";

// Spans all five verification types (kyc/face/address/bank/role), which sit
// under three different admin permissions individually — kept super_admin-only
// rather than gated behind any single one of those, same reasoning as the
// other cross-cutting super_admin-only pages (Users, Settings, Payments).
export const downloadVerificationHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("name email");
  if (!user) throw new ApiError(404, "User not found");

  const attempts = await VerificationAttempt.find({ user: user._id })
    .populate("reviewedBy", "name")
    .sort({ type: 1, submittedAt: 1 });

  await streamVerificationHistoryPdf(user, attempts, res);
});

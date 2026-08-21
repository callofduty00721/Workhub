import User from "./user.model.js";
import { CATEGORY_ROLES } from "../../utils/roleCategories.js";
import { getDisabledRoles } from "../finance/platformSettings.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { logSecurityEvent } from "../../utils/securityLog.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { logVerificationAttempt, resolveVerificationAttempt } from "../../utils/verificationHistory.js";

// Only these roles get an embedded profile object initialized on add — every
// other role (freelancer, employer, client, partner, mentor, investor,
// founder) stores its "profile" as flat fields on User that exist from
// document creation, so there's nothing to lazily create for them.
const ROLE_PROFILE_FIELD = {
  job_seeker: "jobSeekerProfile",
  influencer: "influencerProfile",
  brand: "brandProfile",
  agency: "agencyProfile",
  talent_partner: "talentPartnerProfile",
};

function initProfileForRole(user, role) {
  const field = ROLE_PROFILE_FIELD[role];
  if (field && !user[field]) user[field] = {};
}

// Small, deliberately-not-toSafeJSON response — these endpoints only ever
// change role/category/verification bookkeeping, so only return that slice
// instead of re-serializing the whole user document.
function roleSummary(user) {
  const { _id, role, roles, selectedCategory, founderStage, isVerified, verificationStatus, verificationNote } = user;
  return { id: _id, role, roles, selectedCategory, founderStage, isVerified, verificationStatus, verificationNote };
}

export const selectCategory = asyncHandler(async (req, res) => {
  const { category } = req.body;

  // Switching category invalidates any roles picked under the old one — a
  // user can never hold roles from two categories at once.
  if (req.user.selectedCategory !== category) {
    req.user.selectedCategory = category;
    req.user.roles = [];
  }

  await req.user.save();
  logSecurityEvent(req, { type: "category_selected", user: req.user._id, email: req.user.email, detail: category });
  res.json({ success: true, user: roleSummary(req.user) });
});

export const addRoles = asyncHandler(async (req, res) => {
  const { roles } = req.body;
  if (!req.user.selectedCategory) throw new ApiError(400, "Select a category before adding roles");

  const allowedRoles = CATEGORY_ROLES[req.user.selectedCategory];
  const invalidRoles = roles.filter((role) => !allowedRoles.includes(role));
  if (invalidRoles.length) {
    throw new ApiError(400, `These roles don't belong to the "${req.user.selectedCategory}" category: ${invalidRoles.join(", ")}`);
  }

  // Only blocks roles the user doesn't already hold — someone who added this
  // role before it was disabled keeps it, this just closes the door on new
  // additions.
  const disabledRoles = await getDisabledRoles();
  const newlyDisabled = roles.filter((role) => disabledRoles.includes(role) && !req.user.roles?.includes(role));
  if (newlyDisabled.length) {
    throw new ApiError(400, `These roles are temporarily disabled: ${newlyDisabled.join(", ")}`);
  }

  const merged = new Set(req.user.roles || []);
  for (const role of roles) {
    merged.add(role);
    initProfileForRole(req.user, role);
  }
  req.user.roles = Array.from(merged);

  // Keep the active role valid — first activation, or the previous active
  // role got removed from the set (not currently possible via this endpoint,
  // but cheap to guard against future removeRoles support).
  if (!req.user.roles.includes(req.user.role)) {
    req.user.role = req.user.roles[0];
  }

  await req.user.save();
  logSecurityEvent(req, { type: "roles_added", user: req.user._id, email: req.user.email, detail: roles.join(",") });
  res.json({ success: true, user: roleSummary(req.user) });
});

export const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!req.user.roles?.includes(role)) {
    throw new ApiError(400, "You haven't added this role yet — add it first from role settings");
  }

  req.user.role = role;
  await req.user.save();
  logSecurityEvent(req, { type: "role_switched", user: req.user._id, email: req.user.email, detail: role });
  res.json({ success: true, user: roleSummary(req.user) });
});

export const requestVerification = asyncHandler(async (req, res) => {
  const { documents } = req.body;
  if (req.user.verificationStatus === "pending") throw new ApiError(400, "Your verification is already under review");
  if (req.user.verificationStatus === "verified") throw new ApiError(400, "You are already verified");

  req.user.verificationDocuments = documents;
  req.user.verificationStatus = "pending";
  req.user.verificationSubmittedAt = new Date();
  req.user.verificationNote = "";
  await req.user.save();
  await logVerificationAttempt({ user: req.user._id, type: "role", documents });

  res.json({ success: true, user: roleSummary(req.user) });
});

export const listVerificationRequests = asyncHandler(async (req, res) => {
  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { verificationStatus: "pending" };
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role roles selectedCategory verificationDocuments verificationSubmittedAt")
      .sort({ verificationSubmittedAt: 1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: users, pagination: paginationMeta(pageNum, limitNum, total) });
});

export const reviewVerification = asyncHandler(async (req, res) => {
  const { approve, note } = req.body;

  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.verificationStatus !== "pending") throw new ApiError(400, "This user has no pending verification request");

  user.isVerified = approve;
  user.verificationStatus = approve ? "verified" : "rejected";
  user.verificationNote = approve ? "" : note || "";
  await user.save();
  await resolveVerificationAttempt({ user: user._id, type: "role", approved: approve, note, reviewedBy: req.user._id });

  res.json({ success: true, data: roleSummary(user) });
});

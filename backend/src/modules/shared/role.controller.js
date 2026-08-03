import User from "./user.model.js";
import { CATEGORIES, CATEGORY_ROLES } from "../../utils/roleCategories.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

// Only these roles get an embedded profile object initialized on add — every
// other role (freelancer, employer, client, partner, mentor, investor,
// founder) already stores its "profile" as flat fields on User that exist
// from document creation, so there's nothing to lazily create for them.
const ROLE_PROFILE_FIELD = {
  job_seeker: "jobSeekerProfile",
  influencer: "influencerProfile",
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
  if (!CATEGORIES.includes(category)) {
    throw new ApiError(400, `Invalid category. Choose one of: ${CATEGORIES.join(", ")}`);
  }

  // Switching category invalidates any roles picked under the old one — a
  // user can never hold roles from two categories at once.
  if (req.user.selectedCategory !== category) {
    req.user.selectedCategory = category;
    req.user.roles = [];
  }

  await req.user.save();
  res.json({ success: true, user: roleSummary(req.user) });
});

export const addRoles = asyncHandler(async (req, res) => {
  const { roles } = req.body;
  if (!req.user.selectedCategory) throw new ApiError(400, "Select a category before adding roles");
  if (!Array.isArray(roles) || roles.length === 0) throw new ApiError(400, "Provide at least one role");

  const allowedRoles = CATEGORY_ROLES[req.user.selectedCategory];
  const invalidRoles = roles.filter((role) => !allowedRoles.includes(role));
  if (invalidRoles.length) {
    throw new ApiError(400, `These roles don't belong to the "${req.user.selectedCategory}" category: ${invalidRoles.join(", ")}`);
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
  res.json({ success: true, user: roleSummary(req.user) });
});

export const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!req.user.roles?.includes(role)) {
    throw new ApiError(400, "You haven't added this role yet — add it first from role settings");
  }

  req.user.role = role;
  await req.user.save();
  res.json({ success: true, user: roleSummary(req.user) });
});

export const requestVerification = asyncHandler(async (req, res) => {
  const { documents } = req.body;
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new ApiError(400, "Upload at least one verification document");
  }
  if (req.user.verificationStatus === "pending") throw new ApiError(400, "Your verification is already under review");
  if (req.user.verificationStatus === "verified") throw new ApiError(400, "You are already verified");

  req.user.verificationDocuments = documents;
  req.user.verificationStatus = "pending";
  req.user.verificationSubmittedAt = new Date();
  req.user.verificationNote = "";
  await req.user.save();

  res.json({ success: true, user: roleSummary(req.user) });
});

export const listVerificationRequests = asyncHandler(async (req, res) => {
  const users = await User.find({ verificationStatus: "pending" })
    .select("name email role roles selectedCategory verificationDocuments verificationSubmittedAt")
    .sort({ verificationSubmittedAt: 1 });

  res.json({ success: true, data: users });
});

export const reviewVerification = asyncHandler(async (req, res) => {
  const { approve, note } = req.body;
  if (typeof approve !== "boolean") throw new ApiError(400, "approve must be true or false");

  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.verificationStatus !== "pending") throw new ApiError(400, "This user has no pending verification request");

  user.isVerified = approve;
  user.verificationStatus = approve ? "verified" : "rejected";
  user.verificationNote = approve ? "" : note || "";
  await user.save();

  res.json({ success: true, data: roleSummary(user) });
});

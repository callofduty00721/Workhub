import Subscription from "../modules/finance/subscription.model.js";
import Plan from "../modules/finance/plan.model.js";
import { ApiError } from "../middleware/errorHandler.js";

// A user with no active paid subscription for this role is on that role's
// free tier by definition — there's no separate "free" Subscription row.
async function getActiveTier(userId, role) {
  const sub = await Subscription.findOne({
    user: userId,
    role,
    status: "active",
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  return sub?.plan ?? "free";
}

// Throws 403 if creating one more document would put the user over their
// plan's maxListings for this role. `filter` should already scope the count
// to this user's own listings (e.g. { founder: user._id }). maxListings of
// -1 means unlimited, so the count query doesn't even run in that case —
// keeps this a no-op for every role that doesn't have listing caps at all.
export async function assertUnderListingLimit(user, role, Model, filter, label) {
  const tier = await getActiveTier(user._id, role);
  const plan = await Plan.findOne({ role, tier });
  if (!plan || plan.maxListings === -1) return;

  const count = await Model.countDocuments(filter);
  if (count >= plan.maxListings) {
    throw new ApiError(
      403,
      `Your ${plan.name} plan allows up to ${plan.maxListings} ${label}. Upgrade on the Pricing page to add more.`
    );
  }
}

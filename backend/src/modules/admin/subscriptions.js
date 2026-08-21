import Subscription from "../finance/subscription.model.js";
import Plan from "../finance/plan.model.js";
import User from "../shared/user.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

export const listSubscriptions = asyncHandler(async (req, res) => {
  const { search, status, provider, role, tier, billingCycle } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (provider) filter.provider = provider;
  if (role) filter.role = role;
  if (tier) filter.plan = tier; // schema field is named "plan" but represents the tier
  if (billingCycle) filter.billingCycle = billingCycle;
  if (search) {
    const regex = safeSearchRegex(search);
    const userIds = await User.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id");
    filter.user = { $in: userIds };
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total, plans] = await Promise.all([
    Subscription.find(filter).populate("user", "name email avatar").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Subscription.countDocuments(filter),
    Plan.find().select("role tier name").lean(),
  ]);

  const planNameMap = new Map(plans.map((p) => [`${p.role}:${p.tier}`, p.name]));
  const data = items.map((s) => ({ ...s.toObject(), planName: planNameMap.get(`${s.role}:${s.plan}`) ?? s.plan }));

  res.json({ success: true, data, pagination: paginationMeta(pageNum, limitNum, total) });
});

// Separate from listSubscriptions on purpose — these numbers shouldn't
// re-aggregate every time the admin flips a page or changes a filter, and
// AdminOverview.tsx's stats panel already fetches its own numbers the same
// independent way.
export const getSubscriptionStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const [activeCount, expiredCount, cancelledCount, failedCount, revenueAgg] = await Promise.all([
    // "Active" = really active right now. Nothing in the app ever writes
    // status:"expired" (verified — that enum value is currently dead), so a
    // subscription that has simply run past its expiresAt is still stored as
    // status:"active" — counting it as active here would be misleading.
    Subscription.countDocuments({ status: "active", expiresAt: { $gt: now } }),
    Subscription.countDocuments({ status: "active", expiresAt: { $lte: now } }),
    Subscription.countDocuments({ status: "cancelled" }),
    Subscription.countDocuments({ status: "failed" }),
    // Revenue intentionally uses a *different* filter than activeCount above:
    // a lapsed subscription's payment still happened, so it still counts
    // toward revenue even though it no longer counts as an active seat.
    Subscription.aggregate([{ $match: { status: "active" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);

  res.json({
    success: true,
    data: {
      totalSubscribers: activeCount,
      activeCount,
      expiredCount,
      cancelledCount,
      failedCount,
      revenue: revenueAgg[0]?.total ?? 0,
    },
  });
});

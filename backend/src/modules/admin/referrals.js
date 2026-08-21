import User from "../shared/user.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

// Referrals are purely denormalized fields on User (referralCode,
// referredBy, referralBonusBalance, referralBonusTotal) — there's no
// separate Referral ledger collection, so "admin visibility" here means
// aggregating those fields, not listing rows from a dedicated table.
export const getReferralStats = asyncHandler(async (req, res) => {
  const [referredUserCount, totalsAgg] = await Promise.all([
    User.countDocuments({ referredBy: { $ne: null } }),
    User.aggregate([{ $group: { _id: null, totalBonusPaid: { $sum: "$referralBonusTotal" } } }]),
  ]);

  res.json({
    success: true,
    data: {
      referredUserCount,
      totalBonusPaid: totalsAgg[0]?.totalBonusPaid ?? 0,
    },
  });
});

export const listTopReferrers = asyncHandler(async (req, res) => {
  const filter = { referralBonusTotal: { $gt: 0 } };
  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email avatar referralCode referralBonusBalance referralBonusTotal")
      .sort({ referralBonusTotal: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  // Referred-count is only computed for the current page's users, not the
  // whole collection — same "batch it per page, not per row" approach used
  // in admin/reviews.js's target-label resolution.
  const counts = await User.aggregate([
    { $match: { referredBy: { $in: users.map((u) => u._id) } } },
    { $group: { _id: "$referredBy", count: { $sum: 1 } } },
  ]);
  const countByReferrer = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const data = users.map((u) => ({ ...u.toObject(), referredCount: countByReferrer.get(u._id.toString()) ?? 0 }));

  res.json({ success: true, data, pagination: paginationMeta(pageNum, limitNum, total) });
});

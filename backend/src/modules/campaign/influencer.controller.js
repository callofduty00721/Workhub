import User from "../shared/user.model.js";
import ProfileViewLog from "../shared/profileViewLog.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const PUBLIC_FIELDS = "name avatar headline location bio influencerProfile createdAt";

export const listInfluencers = asyncHandler(async (req, res) => {
  const { search, niche, category } = req.query;

  const filter = { role: "influencer" };
  if (category) filter["influencerProfile.category"] = category;
  if (niche) filter["influencerProfile.niche"] = new RegExp(niche, "i");
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { headline: new RegExp(search, "i") }];

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: paginationMeta(pageNum, limitNum, total) });
});

// Real day-by-day trend (not fabricated) — last 30 days of ProfileViewLog
// buckets, zero-filled for days with no views, so the dashboard's line chart
// always has a full 30-point series.
export const getMyProfileViewTrend = asyncHandler(async (req, res) => {
  const days = 30;
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceKey = since.toISOString().slice(0, 10);

  const logs = await ProfileViewLog.find({ user: req.user._id, date: { $gte: sinceKey } });
  const byDate = new Map(logs.map((l) => [l.date, l.count]));

  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, views: byDate.get(key) ?? 0 };
  });

  res.json({ success: true, data: series });
});

export const getInfluencerProfile = asyncHandler(async (req, res) => {
  const influencer = await User.findOne({ _id: req.params.id, role: "influencer" }).select(PUBLIC_FIELDS);
  if (!influencer) throw new ApiError(404, "Influencer not found");

  if (!req.user || req.user._id.toString() !== influencer._id.toString()) {
    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      User.updateOne({ _id: influencer._id }, { $inc: { profileViews: 1 } }),
      ProfileViewLog.findOneAndUpdate({ user: influencer._id, date: today }, { $inc: { count: 1 } }, { upsert: true }),
    ]);
  }

  res.json({ success: true, data: influencer });
});

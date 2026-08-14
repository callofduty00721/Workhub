import User from "../shared/user.model.js";
import Payment from "../shared/payment.model.js";
import ProfileViewLog from "../shared/profileViewLog.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

// Mirrors frontend/src/lib/mockData.ts's INFLUENCER_CATEGORY_NAMES — client-
// side taxonomy, no backend enum (influencerProfile.category stays a plain
// String), but the "other" filter below needs to know the same fixed set to
// mean "anything not in it". Keep the two lists in sync by hand.
const INFLUENCER_CATEGORY_NAMES = [
  "Autos & Vehicles",
  "Comedy",
  "Education",
  "Entertainment",
  "Film & Animation",
  "Gaming",
  "Howto & Style",
  "Music",
  "News & Politics",
  "Nonprofits & Activism",
  "People & Blogs",
  "Pets & Animals",
  "Science & Technology",
  "Sports",
  "Travel & Events",
];

const PUBLIC_FIELDS = {
  name: 1,
  avatar: 1,
  headline: 1,
  location: 1,
  bio: 1,
  influencerProfile: 1,
  isVerified: 1,
  rating: 1,
  reviewCount: 1,
  socialLinks: 1,
  achievements: 1,
  availabilityStatus: 1,
  createdAt: 1,
};

// Mirrors FREELANCER_SORT_OPTIONS in service.controller.js, plus fields that
// don't exist on the document and only come out of the aggregation below:
// `followers` (a runtime sum over influencerProfile.platforms), `campaigns`
// (a count of released campaign payments), and `match` (the composite score
// computed in matchScoreStage).
const INFLUENCER_SORT_FIELD = {
  newest: { createdAt: -1 },
  rating: { rating: -1 },
  reviews: { reviewCount: -1 },
  followers: { totalFollowers: -1 },
  campaigns: { campaignsCompleted: -1 },
  match: { matchScore: -1 },
};

// A deterministic stand-in for the "AI matching" a brand would otherwise do
// by eyeballing every profile — built entirely from fields already on the
// document/its real transaction history, no external model/API and nothing
// self-reported. Weights (0-100 total):
//   campaignsCompleted 30  — released campaign payments (see the $lookup in
//                            listInfluencers) — the strongest signal since
//                            it's platform-verified, not a claim; capped at
//                            10 so one prolific profile can't max this alone
//   rating             35  — how past hires rated the influencer
//   reviews            20  — how many hires that rating is actually backed
//                            by, capped at 50
//   verified           15  — flat bonus, mirrors the "get verified" trust
//                            signal used elsewhere in the app (see
//                            roleCategories.js)
// Engagement rate was deliberately dropped from this formula — it was
// self-reported per post with no way to verify it, and blending Instagram
// and YouTube posts into one number misrepresented both.
function matchScoreStage() {
  return {
    $addFields: {
      matchScore: {
        $add: [
          { $multiply: [{ $min: [{ $ifNull: ["$campaignsCompleted", 0] }, 10] }, 30 / 10] },
          { $multiply: [{ $ifNull: ["$rating", 0] }, 35 / 5] },
          { $multiply: [{ $min: [{ $ifNull: ["$reviewCount", 0] }, 50] }, 20 / 50] },
          { $cond: ["$isVerified", 15, 0] },
        ],
      },
    },
  };
}

// A campaign is "completed" once its escrow is released — the brand
// accepted the delivered work and the influencer actually got paid, not
// just hired. $lookup + $count rather than a stored counter, since a raw
// count over Payment is cheap and can never drift out of sync with reality
// the way a manually-incremented field could.
function campaignsCompletedStage() {
  return {
    $lookup: {
      from: "payments",
      let: { influencerId: "$_id" },
      pipeline: [
        { $match: { $expr: { $and: [{ $eq: ["$payee", "$$influencerId"] }, { $eq: ["$type", "campaign"] }, { $eq: ["$escrowStatus", "released"] }] } } },
        { $count: "count" },
      ],
      as: "_campaignPayments",
    },
  };
}

export const listInfluencers = asyncHandler(async (req, res) => {
  const { search, niche, category, location, minRating, verifiedOnly, platform, minFollowers, maxFollowers, maxBudget, sort } = req.query;

  // A profile with no platforms added yet has nothing to show a brand —
  // every stat card renders as "—" and the whole card looks broken/half-
  // finished. Keep it out of public discovery until there's at least one
  // real platform on it; the account and dashboard are unaffected, this
  // only affects whether it shows up here.
  const filter = { role: "influencer", "influencerProfile.platforms.0": { $exists: true } };
  if (category === "other") {
    filter["influencerProfile.category"] = { $nin: INFLUENCER_CATEGORY_NAMES };
  } else if (category) {
    filter["influencerProfile.category"] = category;
  }
  if (niche) filter["influencerProfile.niche"] = new RegExp(niche, "i");
  if (location) filter.location = new RegExp(location, "i");
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (verifiedOnly === "true") filter.isVerified = true;
  if (platform) filter["influencerProfile.platforms.platform"] = new RegExp(`^${platform}$`, "i");
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { headline: new RegExp(search, "i") }];

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const sortSpec = INFLUENCER_SORT_FIELD[sort] ?? INFLUENCER_SORT_FIELD.newest;

  // totalFollowers/cheapestRate need to exist as real fields before they can
  // be filtered or sorted on, so they're computed once up front and every
  // later stage (the follower/budget range filter, matchScore, sort) just
  // reads them back — an aggregation, not a plain find(), because both are
  // reductions over an embedded array rather than a stored field.
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        totalFollowers: { $sum: "$influencerProfile.platforms.followers" },
        cheapestRate: { $min: "$influencerProfile.rateCard.priceInInr" },
      },
    },
  ];

  const rangeMatch = {};
  if (minFollowers) rangeMatch.totalFollowers = { ...rangeMatch.totalFollowers, $gte: Number(minFollowers) };
  if (maxFollowers) rangeMatch.totalFollowers = { ...rangeMatch.totalFollowers, $lte: Number(maxFollowers) };
  // No rate card at all means "price not listed" — excluding those when a
  // brand sets a budget ceiling keeps the filter honest instead of silently
  // including profiles that might be well over budget.
  if (maxBudget) rangeMatch.cheapestRate = { $ne: null, $lte: Number(maxBudget) };
  if (Object.keys(rangeMatch).length) pipeline.push({ $match: rangeMatch });

  pipeline.push(
    campaignsCompletedStage(),
    { $addFields: { campaignsCompleted: { $ifNull: [{ $arrayElemAt: ["$_campaignPayments.count", 0] }, 0] } } },
    matchScoreStage()
  );

  const [result] = await User.aggregate([
    ...pipeline,
    {
      $facet: {
        items: [
          { $sort: sortSpec },
          { $skip: skip },
          { $limit: limitNum },
          { $project: { ...PUBLIC_FIELDS, totalFollowers: 1, campaignsCompleted: 1, matchScore: 1 } },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const items = result?.items ?? [];
  const total = result?.total?.[0]?.count ?? 0;

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

  // Same "released escrow" definition as listInfluencers' campaignsCompletedStage.
  const campaignsCompleted = await Payment.countDocuments({ payee: influencer._id, type: "campaign", escrowStatus: "released" });

  // Auto-populated "Past Collaborations" — one per released campaign
  // payment, so it can never be fabricated the way a manually-typed entry
  // could. Shown alongside (not instead of) the influencer's own manual
  // entries in influencerProfile.pastCollaborations, distinguished by
  // `verified: true` on the frontend.
  const releasedPayments = await Payment.find({ payee: influencer._id, type: "campaign", escrowStatus: "released" })
    .select("amount releasedAt application")
    .populate({
      path: "application",
      select: "job onModel",
      populate: { path: "job", select: "title companyName employer", populate: { path: "employer", select: "name avatar" } },
    })
    .sort({ releasedAt: -1 });

  const verifiedCollaborations = releasedPayments
    .filter((p) => p.application?.job)
    .map((p) => {
      const campaign = p.application.job;
      const employer = campaign.employer;
      return {
        brandName: employer?.name || campaign.companyName,
        logoUrl: employer?.avatar || "",
        description: campaign.title,
        resultMetric: `₹${p.amount.toLocaleString("en-IN")}${
          p.releasedAt ? ` · ${new Date(p.releasedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""
        }`,
        verified: true,
      };
    });

  res.json({ success: true, data: { ...influencer.toObject(), campaignsCompleted, verifiedCollaborations } });
});

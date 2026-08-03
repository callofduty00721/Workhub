import User from "../shared/user.model.js";
import Startup from "./startup.model.js";
import Investment from "./investment.model.js";
import StartupUpdate from "./startupUpdate.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { isUserOnline } from "../../socket/index.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const PUBLIC_FIELDS =
  "name avatar coverImage headline location bio linkedIn industries pastStartupsCount skills yearsOfExperience " +
  "experience education achievements languages dateOfBirth nationality educationLevel roleTags lookingFor socialLinks " +
  "followers lastActiveAt isEmailVerified createdAt";

export const listFounders = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = { role: "founder" };
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

  const data = items.map((item) => {
    const obj = item.toObject();
    obj.followersCount = obj.followers?.length ?? 0;
    obj.isOnline = isUserOnline(item._id);
    delete obj.followers;
    return obj;
  });

  res.json({ success: true, data, pagination: paginationMeta(pageNum, limitNum, total) });
});

export const getFounderProfile = asyncHandler(async (req, res) => {
  const founder = await User.findOne({ _id: req.params.id, role: "founder" }).select(PUBLIC_FIELDS);
  if (!founder) throw new ApiError(404, "Founder not found");

  const startups = await Startup.find({ founder: founder._id, isSuspended: { $ne: true } })
    .select("name tagline logo stage industry location isVerified founderVerified createdAt fundingRaised team followers viewCount")
    .sort({ createdAt: -1 });

  const startupIds = startups.map((s) => s._id);

  const [investments, investorCount, postViewsAgg] = await Promise.all([
    Investment.find({ startup: { $in: startupIds }, status: "confirmed" })
      .populate("investor", "name avatar")
      .populate("startup", "name")
      .sort({ confirmedAt: -1 })
      .limit(10),
    Investment.distinct("investor", { startup: { $in: startupIds }, status: "confirmed" }),
    StartupUpdate.aggregate([
      { $match: { startup: { $in: startupIds } } },
      { $group: { _id: null, total: { $sum: "$viewCount" } } },
    ]),
  ]);
  const postViews = postViewsAgg[0]?.total ?? 0;

  const stats = startups.reduce(
    (acc, s) => {
      acc.teamSize += s.team?.length ?? 0;
      acc.followersCount += s.followers?.length ?? 0;
      acc.viewCount += s.viewCount ?? 0;
      acc.fundingRaised += s.fundingRaised ?? 0;
      return acc;
    },
    { teamSize: 0, followersCount: 0, viewCount: 0, fundingRaised: 0 }
  );

  const startupSummaries = startups.map((s) => ({
    _id: s._id,
    name: s.name,
    tagline: s.tagline,
    logo: s.logo,
    stage: s.stage,
    industry: s.industry,
    location: s.location,
    isVerified: s.isVerified,
    founderVerified: s.founderVerified,
    createdAt: s.createdAt,
    fundingRaised: s.fundingRaised,
    teamSize: s.team?.length ?? 0,
  }));

  const team = startups.flatMap((s) =>
    (s.team ?? []).map((member) => ({
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      startupName: s.name,
    }))
  );

  const founderObj = founder.toObject();
  const followers = founderObj.followers ?? [];
  delete founderObj.followers;

  res.json({
    success: true,
    data: {
      ...founderObj,
      followersCount: followers.length,
      isFollowing: !!req.user && followers.some((f) => f.toString() === req.user._id.toString()),
      isOnline: isUserOnline(founder._id),
      startups: startupSummaries,
      team,
      stats: { ...stats, startupsCount: startups.length, investorsCount: investorCount.length, postViews },
      recentInvestors: investments.map((inv) => ({
        _id: inv._id,
        investor: inv.investor,
        startupName: inv.startup?.name ?? "",
        amount: inv.amount,
        confirmedAt: inv.confirmedAt,
      })),
    },
  });
});

export const toggleFollowFounder = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const founder = await User.findOne({ _id: req.params.id, role: "founder" });
  if (!founder) throw new ApiError(404, "Founder not found");

  const alreadyFollowing = founder.followers.some((f) => f.toString() === req.user._id.toString());
  if (alreadyFollowing) {
    founder.followers = founder.followers.filter((f) => f.toString() !== req.user._id.toString());
  } else {
    founder.followers.push(req.user._id);
  }
  await founder.save();

  res.json({ success: true, data: { following: !alreadyFollowing, followersCount: founder.followers.length } });
});

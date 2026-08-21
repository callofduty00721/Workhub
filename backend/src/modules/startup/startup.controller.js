import Startup from "./startup.model.js";
import Investment from "./investment.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { assertStartupFounder } from "./founderAuth.js";
import { assertUnderListingLimit } from "../../utils/planLimits.js";

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  funding: { fundingRaised: -1 },
  rating: { rating: -1 },
};

export const listStartups = asyncHandler(async (req, res) => {
  const { search, industry, subIndustry, stage, sort = "newest" } = req.query;

  const filter = { status: "published", isSuspended: { $ne: true } };
  if (industry) filter.industry = { $in: String(industry).split(",") };
  if (subIndustry) filter.subIndustry = { $in: String(subIndustry).split(",") };
  if (stage) filter.stage = { $in: String(stage).split(",") };
  if (search) filter.$text = { $search: search };

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const sortBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

  const [items, total] = await Promise.all([
    Startup.find(filter)
      .select("-reports -verificationRequests")
      .populate("founder", "name avatar")
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum),
    Startup.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const getMyStartups = asyncHandler(async (req, res) => {
  const items = await Startup.find({ founder: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getFollowedStartups = asyncHandler(async (req, res) => {
  const startups = await Startup.find({
    $or: [{ followers: req.user._id }, { interested: req.user._id }],
  })
    .select("name tagline coverImage industry stage location fundingRaised fundingNeeded rating reviewCount isFeatured isVerified followers")
    .populate("founder", "name avatar")
    .sort({ updatedAt: -1 });

  res.json({ success: true, data: startups });
});

export const getStartupById = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id)
    .select("-reports -verificationRequests")
    .populate("founder", "name avatar email createdAt");
  if (!startup) throw new ApiError(404, "Startup not found");

  // Persist the view count first, before any response-only mutation below.
  startup.viewCount += 1;
  await startup.save();

  const isOwner = req.user && startup.founder._id.toString() === req.user._id.toString();

  // Who's interested is only disclosed to the founder — everyone else only sees
  // their own membership (needed to render the follow/interest button state).
  // This mutates the response payload only; it is never saved back to the DB.
  if (isOwner) {
    await startup.populate("interested", "name avatar role");
  } else {
    const viewerId = req.user?._id.toString();
    startup.interested = startup.interested.filter((id) => viewerId && id.toString() === viewerId);
  }

  // A publicly-safe aggregate — just a number, no investor identities — so the
  // "Investors" stat reflects real confirmed Investment records, not the older
  // "interested" toggle which the confirm/decline flow never touches.
  const confirmedInvestorIds = await Investment.distinct("investor", { startup: startup._id, status: "confirmed" });

  const responseData = { ...startup.toObject(), confirmedInvestorCount: confirmedInvestorIds.length };
  if (isOwner) {
    const withRequests = await Startup.findById(startup._id).select("verificationRequests");
    responseData.verificationRequests = withRequests.verificationRequests;
  }

  res.json({ success: true, data: responseData });
});

export const createStartup = asyncHandler(async (req, res) => {
  await assertUnderListingLimit(req.user, "founder", Startup, { founder: req.user._id }, "startup listings");

  const startup = await Startup.create({ ...req.body, founder: req.user._id });
  res.status(201).json({ success: true, data: startup });
});

export const updateStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");
  assertStartupFounder(startup, req.user, "You do not have permission to edit this startup");

  Object.assign(startup, req.body);
  await startup.save();
  res.json({ success: true, data: startup });
});

export const deleteStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");
  assertStartupFounder(startup, req.user, "You do not have permission to delete this startup");

  await startup.deleteOne();
  res.json({ success: true, message: "Startup deleted" });
});

export const toggleFollow = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");

  const userId = req.user._id.toString();
  const isFollowing = startup.followers.some((f) => f.toString() === userId);

  if (isFollowing) {
    startup.followers = startup.followers.filter((f) => f.toString() !== userId);
  } else {
    startup.followers.push(req.user._id);
    await notify(req.app, {
      user: startup.founder,
      type: "startup_follow",
      title: "New follower",
      message: `${req.user.name} started following ${startup.name}`,
      link: `/startups/${startup._id}`,
    });
  }

  await startup.save();
  res.json({ success: true, following: !isFollowing, followerCount: startup.followers.length });
});

export const toggleInterest = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");

  const userId = req.user._id.toString();
  const isInterested = startup.interested.some((f) => f.toString() === userId);

  if (isInterested) {
    startup.interested = startup.interested.filter((f) => f.toString() !== userId);
  } else {
    startup.interested.push(req.user._id);
    await notify(req.app, {
      user: startup.founder,
      type: "startup_interest",
      title: "Someone is interested in your startup",
      message: `${req.user.name} marked ${startup.name} as interesting`,
      link: `/startups/${startup._id}`,
    });
  }

  await startup.save();
  res.json({ success: true, interested: !isInterested, interestCount: startup.interested.length });
});

export const submitVerificationRequest = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");
  assertStartupFounder(startup, req.user, "Only the founder can request verification for this startup");

  const { type, documents, note } = req.body;

  const alreadyVerified = type === "founder" ? startup.founderVerified : startup.isVerified;
  if (alreadyVerified) throw new ApiError(400, `This startup's ${type} verification is already approved`);

  const hasPending = startup.verificationRequests.some((r) => r.type === type && r.status === "pending");
  if (hasPending) throw new ApiError(400, "A verification request of this type is already pending review");

  startup.verificationRequests.push({ type, documents, note: note || "" });
  await startup.save();

  res.status(201).json({ success: true, message: "Verification request submitted for review." });
});

export const reportStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, "Startup not found");

  const userId = req.user._id.toString();
  const alreadyReported = startup.reports.some((r) => r.user.toString() === userId);

  if (!alreadyReported) {
    startup.reports.push({ user: req.user._id, reason: req.body.reason || "" });
    await startup.save();
  }

  res.json({ success: true, message: "Thanks — this startup has been reported to the moderation team." });
});

import Service from "./service.model.js";
import User from "../shared/user.model.js";
import SkillTestAttempt from "./skillTestAttempt.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { computeFreelancerStats, computeFreelancerLevel } from "../../utils/freelancerLevel.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

// A gig can be managed by the freelancer who posted it, any other member of
// the same agency/Company team, or an admin — mirrors jobController's isJobManager.
function isServiceManager(service, user) {
  if (user.role === "super_admin") return true;
  if (service.freelancer.toString() === user._id.toString()) return true;
  if (service.company && user.company && service.company.toString() === user.company.toString()) return true;
  return false;
}

const SORT_OPTIONS = {
  price_low: { price: 1 },
  price_high: { price: -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
  best_match: { createdAt: -1 },
};

export const listServices = asyncHandler(async (req, res) => {
  const { search, category, subCategory, priceMin, priceMax, maxDeliveryDays, level, minRating, language, sort } = req.query;

  const filter = { status: "active" };
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (search) filter.$text = { $search: search };
  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
  }
  if (maxDeliveryDays) filter.deliveryDays = { $lte: Number(maxDeliveryDays) };
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (language) filter.languages = language;
  if (level) {
    const sellers = await User.find({ role: "freelancer", level }).select("_id");
    filter.freelancer = { $in: sellers.map((s) => s._id) };
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const sortSpec = SORT_OPTIONS[sort] ?? SORT_OPTIONS.best_match;

  const [items, total] = await Promise.all([
    Service.find(filter)
      .populate(
        "freelancer",
        "name avatar rating reviewCount level headline location availabilityStatus onTimeDeliveryPercent"
      )
      .populate("company", "name")
      .sort(sortSpec)
      .skip(skip)
      .limit(limitNum),
    Service.countDocuments(filter),
  ]);

  // jobsCompleted isn't cached on the freelancer document — computed the same
  // way getFreelancerProfile/listFreelancers do, bounded to this page's items.
  // verifiedSkills is fetched once for every freelancer on the page (not
  // per-item) so N gigs from the same seller don't repeat the query.
  const freelancerIds = [...new Set(items.map((s) => s.freelancer?._id).filter(Boolean).map(String))];
  const [statsByFreelancer, verifiedByFreelancer] = await Promise.all([
    Promise.all(freelancerIds.map(async (id) => [id, await computeFreelancerStats(id)])),
    SkillTestAttempt.find({ freelancer: { $in: freelancerIds }, passed: true }).select("freelancer skill"),
  ]);
  const jobsCompletedById = new Map(statsByFreelancer.map(([id, stats]) => [id, stats.jobsCompleted]));
  const verifiedSkillsById = new Map();
  for (const a of verifiedByFreelancer) {
    const key = String(a.freelancer);
    if (!verifiedSkillsById.has(key)) verifiedSkillsById.set(key, []);
    verifiedSkillsById.get(key).push(a.skill);
  }

  const itemsWithFreelancerStats = items.map((service) => {
    const obj = service.toObject();
    if (obj.freelancer?._id) {
      const id = String(obj.freelancer._id);
      obj.freelancer.jobsCompleted = jobsCompletedById.get(id) ?? 0;
      obj.freelancer.verifiedSkills = verifiedSkillsById.get(id) ?? [];
    }
    return obj;
  });

  res.json({
    success: true,
    data: itemsWithFreelancerStats,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

// Real per-category counts of active gigs, shown next to each category in the
// GigList sidebar — computed independently of the current filters (mirrors
// how Fiverr's category nav always reflects the full catalog, not the
// current search results).
export const getServiceCategoryCounts = asyncHandler(async (req, res) => {
  const rows = await Service.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$category", count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  res.json({ success: true, data: counts });
});

export const getMyServices = asyncHandler(async (req, res) => {
  const filter = req.user.company
    ? { $or: [{ freelancer: req.user._id }, { company: req.user.company }] }
    : { freelancer: req.user._id };
  const items = await Service.find(filter).populate("freelancer", "name avatar").sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate({
      path: "freelancer",
      select:
        "name avatar headline rating reviewCount location portfolioItems level availabilityStatus responseTimeLabel onTimeDeliveryPercent yearsOfExperience createdAt",
      populate: { path: "portfolioItems.verifiedPayment", select: "type amount netAmount createdAt" },
    })
    .populate("company", "name");
  if (!service) throw new ApiError(404, "Service not found");

  service.viewsCount += 1;
  await service.save();

  // jobsCompleted isn't cached on the freelancer document (see
  // freelancerLevel.js) — compute it the same way getFreelancerProfile does
  // so the gig page can show a real "Projects Completed" stat.
  const serviceObj = service.toObject();
  if (serviceObj.freelancer && typeof serviceObj.freelancer === "object") {
    const stats = await computeFreelancerStats(serviceObj.freelancer._id);
    serviceObj.freelancer.jobsCompleted = stats.jobsCompleted;
  }

  res.json({ success: true, data: serviceObj });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create({ ...req.body, freelancer: req.user._id, company: req.user.company || undefined });
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found");
  if (!isServiceManager(service, req.user)) {
    throw new ApiError(403, "You do not have permission to edit this service");
  }

  Object.assign(service, req.body);
  await service.save();
  res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found");
  if (!isServiceManager(service, req.user)) {
    throw new ApiError(403, "You do not have permission to delete this service");
  }

  await service.deleteOne();
  res.json({ success: true, message: "Service deleted" });
});

const FREELANCER_SORT_OPTIONS = {
  rating: { rating: -1 },
  rate_low: { hourlyRate: 1 },
  rate_high: { hourlyRate: -1 },
  experience: { yearsOfExperience: -1 },
  newest: { createdAt: -1 },
  best_match: { rating: -1 },
};

export const listFreelancers = asyncHandler(async (req, res) => {
  const {
    search,
    skill,
    category,
    subCategory,
    location,
    level,
    rateMin,
    rateMax,
    minRating,
    minExperience,
    verifiedOnly,
    availability,
    sort,
  } = req.query;

  const filter = { role: "freelancer" };
  if (skill) filter.skills = skill;
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (location) filter.location = safeSearchRegex(location);
  if (level) filter.level = level;
  if (rateMin || rateMax) {
    filter.hourlyRate = {};
    if (rateMin) filter.hourlyRate.$gte = Number(rateMin);
    if (rateMax) filter.hourlyRate.$lte = Number(rateMax);
  }
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (minExperience) filter.yearsOfExperience = { $gte: Number(minExperience) };
  if (verifiedOnly === "true") filter.kycStatus = "verified";
  if (availability) filter.availabilityStatus = availability;
  if (search) {
    filter.$or = [{ name: safeSearchRegex(search) }, { headline: safeSearchRegex(search) }];
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const sortSpec = FREELANCER_SORT_OPTIONS[sort] ?? FREELANCER_SORT_OPTIONS.best_match;

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(
        "name avatar coverImage headline location bio category subCategory skills hourlyRate rating reviewCount yearsOfExperience " +
          "availabilityStatus level company kycStatus responseTimeLabel languages socialLinks isDemo createdAt"
      )
      .populate("company", "name")
      .sort(sortSpec)
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  // Real, payment-history-derived stats (not self-reported) — computed only
  // for the current page, mirroring the same pattern getServiceById uses.
  const itemsWithStats = await Promise.all(
    items.map(async (freelancer) => {
      const stats = await computeFreelancerStats(freelancer._id);
      const obj = freelancer.toObject();
      obj.jobsCompleted = stats.jobsCompleted;
      obj.jobSuccessPercent = stats.jobSuccessPercent;
      return obj;
    })
  );

  res.json({
    success: true,
    data: itemsWithStats,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

// Mirrors getServiceCategoryCounts — real per-category counts of freelancer
// profiles, shown next to each category pill on the Freelancers tab.
export const getFreelancerCategoryCounts = asyncHandler(async (req, res) => {
  const rows = await User.aggregate([
    { $match: { role: "freelancer", category: { $nin: [null, ""] } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  res.json({ success: true, data: counts });
});

export const getFreelancerProfile = asyncHandler(async (req, res) => {
  const freelancer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "freelancer" },
    { $inc: { profileViews: 1 } },
    { new: true }
  )
    .select(
      "name avatar coverImage headline location bio category subCategory skills hourlyRate rating reviewCount yearsOfExperience " +
        "availabilityStatus hoursPerWeekAvailable workingDays workingHours totalHoursWorked onTimeDeliveryPercent responseTimeLabel phone " +
        "resumeUrl resumeUpdatedAt portfolioItems experience education achievements languages socialLinks linkedIn company " +
        "kycStatus isEmailVerified isPhoneVerified faceVerificationStatus addressVerificationStatus bankVerificationStatus " +
        "profileViews lastActiveAt createdAt followers videoIntro"
    )
    .populate("portfolioItems.verifiedPayment", "type amount netAmount createdAt")
    .populate("company", "name");
  if (!freelancer) throw new ApiError(404, "Freelancer not found");

  const serviceFilter = freelancer.company
    ? { status: "active", $or: [{ freelancer: freelancer._id }, { company: freelancer.company }] }
    : { freelancer: freelancer._id, status: "active" };

  const [services, stats, passedAttempts] = await Promise.all([
    Service.find(serviceFilter).sort({ createdAt: -1 }),
    computeFreelancerStats(freelancer._id),
    SkillTestAttempt.find({ freelancer: freelancer._id, passed: true }).sort({ scorePercent: -1 }),
  ]);
  stats.level = computeFreelancerLevel(stats, freelancer.createdAt);

  // Earnings are private financial data — visible only to the freelancer
  // themselves and super_admin (for moderation); stripped from the response
  // for every other viewer, rather than relying on the frontend to hide it.
  const isOwnProfile = req.user && req.user._id.toString() === freelancer._id.toString();
  const isAdminViewer = req.user?.role === "super_admin";
  if (!isOwnProfile && !isAdminViewer) delete stats.totalEarnings;

  // One badge per skill — keep the best-scoring passed attempt if they've taken it more than once.
  const verifiedSkills = [...new Map(passedAttempts.map((a) => [a.skill, { skill: a.skill, scorePercent: a.scorePercent }])).values()];

  const freelancerObj = freelancer.toObject();
  const followers = freelancerObj.followers ?? [];
  delete freelancerObj.followers;

  res.json({
    success: true,
    data: {
      freelancer: {
        ...freelancerObj,
        followersCount: followers.length,
        isFollowing: !!req.user && followers.some((f) => f.toString() === req.user._id.toString()),
      },
      services,
      stats,
      verifiedSkills,
    },
  });
});

export const toggleFollowFreelancer = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const freelancer = await User.findOne({ _id: req.params.id, role: "freelancer" });
  if (!freelancer) throw new ApiError(404, "Freelancer not found");

  const alreadyFollowing = freelancer.followers.some((f) => f.toString() === req.user._id.toString());
  if (alreadyFollowing) {
    freelancer.followers = freelancer.followers.filter((f) => f.toString() !== req.user._id.toString());
  } else {
    freelancer.followers.push(req.user._id);
  }
  await freelancer.save();

  res.json({ success: true, data: { following: !alreadyFollowing, followersCount: freelancer.followers.length } });
});

export const getMyServiceAnalytics = asyncHandler(async (req, res) => {
  const services = await Service.find({ freelancer: req.user._id }).select("title viewsCount ordersCount");

  const totalViews = services.reduce((sum, s) => sum + s.viewsCount, 0);
  const totalOrders = services.reduce((sum, s) => sum + s.ordersCount, 0);

  res.json({ success: true, data: { totalViews, totalOrders, services } });
});

import Service from "../models/Service.js";
import User from "../models/User.js";
import SkillTestAttempt from "../models/SkillTestAttempt.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { computeFreelancerStats, computeFreelancerLevel } from "../utils/freelancerLevel.js";

// A gig can be managed by the freelancer who posted it, any other member of
// the same agency/Company team, or an admin — mirrors jobController's isJobManager.
function isServiceManager(service, user) {
  if (user.role === "super_admin") return true;
  if (service.freelancer.toString() === user._id.toString()) return true;
  if (service.company && user.company && service.company.toString() === user.company.toString()) return true;
  return false;
}

export const listServices = asyncHandler(async (req, res) => {
  const { search, category, subCategory, priceMin, priceMax, maxDeliveryDays, page = 1, limit = 12 } = req.query;

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

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    Service.find(filter)
      .populate("freelancer", "name avatar rating reviewCount")
      .populate("company", "name")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Service.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
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
      select: "name avatar headline rating reviewCount location portfolioItems",
      populate: { path: "portfolioItems.verifiedPayment", select: "type amount netAmount createdAt" },
    })
    .populate("company", "name");
  if (!service) throw new ApiError(404, "Service not found");

  service.viewsCount += 1;
  await service.save();

  res.json({ success: true, data: service });
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

export const listFreelancers = asyncHandler(async (req, res) => {
  const { search, skill, category, subCategory, level, rateMin, rateMax, page = 1, limit = 12 } = req.query;

  const filter = { role: "freelancer" };
  if (skill) filter.skills = skill;
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (level) filter.level = level;
  if (rateMin || rateMax) {
    filter.hourlyRate = {};
    if (rateMin) filter.hourlyRate.$gte = Number(rateMin);
    if (rateMax) filter.hourlyRate.$lte = Number(rateMax);
  }
  if (search) {
    filter.$or = [{ name: new RegExp(search, "i") }, { headline: new RegExp(search, "i") }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(
        "name avatar headline location category subCategory skills hourlyRate rating reviewCount yearsOfExperience availabilityStatus level company"
      )
      .populate("company", "name")
      .sort({ rating: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const getFreelancerProfile = asyncHandler(async (req, res) => {
  const freelancer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "freelancer" },
    { $inc: { profileViews: 1 } },
    { new: true }
  )
    .select(
      "name avatar headline location bio category subCategory skills hourlyRate rating reviewCount yearsOfExperience " +
        "availabilityStatus hoursPerWeekAvailable workingDays workingHours totalHoursWorked onTimeDeliveryPercent responseTimeLabel phone " +
        "resumeUrl resumeUpdatedAt portfolioItems experience education achievements languages socialLinks linkedIn company " +
        "kycStatus isEmailVerified profileViews lastActiveAt createdAt followers videoIntro"
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

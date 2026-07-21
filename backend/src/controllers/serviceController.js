import Service from "../models/Service.js";
import User from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listServices = asyncHandler(async (req, res) => {
  const { search, category, subCategory, page = 1, limit = 12 } = req.query;

  const filter = { status: "active" };
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    Service.find(filter)
      .populate("freelancer", "name avatar rating reviewCount")
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
  const items = await Service.find({ freelancer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate("freelancer", "name avatar headline rating reviewCount location");
  if (!service) throw new ApiError(404, "Service not found");
  res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create({ ...req.body, freelancer: req.user._id });
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found");
  if (service.freelancer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to edit this service");
  }

  Object.assign(service, req.body);
  await service.save();
  res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Service not found");
  if (service.freelancer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to delete this service");
  }

  await service.deleteOne();
  res.json({ success: true, message: "Service deleted" });
});

export const listFreelancers = asyncHandler(async (req, res) => {
  const { search, skill, category, subCategory, page = 1, limit = 12 } = req.query;

  const filter = { role: "freelancer" };
  if (skill) filter.skills = skill;
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (search) {
    filter.$or = [{ name: new RegExp(search, "i") }, { headline: new RegExp(search, "i") }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("name avatar headline location category subCategory skills hourlyRate rating reviewCount yearsOfExperience")
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
  const freelancer = await User.findOne({ _id: req.params.id, role: "freelancer" }).select(
    "name avatar headline location bio category subCategory skills hourlyRate rating reviewCount yearsOfExperience portfolioItems createdAt"
  );
  if (!freelancer) throw new ApiError(404, "Freelancer not found");

  const services = await Service.find({ freelancer: freelancer._id, status: "active" }).sort({ createdAt: -1 });

  res.json({ success: true, data: { freelancer, services } });
});

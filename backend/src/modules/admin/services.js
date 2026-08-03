import Service from "../marketplace/service.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

export const listAllServices = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, "i");

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Service.find(filter)
      .populate("freelancer", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Service.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const toggleServiceStatus = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Gig not found");

  service.status = service.status === "active" ? "paused" : "active";
  await service.save();

  if (service.status === "paused") {
    await notify(req.app, {
      user: service.freelancer,
      type: "system",
      title: "Your gig was paused by an admin",
      message: `"${service.title}" was paused and is no longer visible in the marketplace.`,
      link: "/dashboard/freelancer/gigs",
    });
  }

  res.json({ success: true, status: service.status });
});

export const removeService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, "Gig not found");

  await service.deleteOne();
  res.json({ success: true, message: "Gig removed" });
});

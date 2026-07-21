import User from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const PUBLIC_FIELDS = "name avatar headline location bio organizationName partnerType createdAt";

export const listPartners = asyncHandler(async (req, res) => {
  const { search, type, page = 1, limit = 12 } = req.query;

  const filter = { role: "partner" };
  if (type) filter.partnerType = type;
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { organizationName: new RegExp(search, "i") }];

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

export const getPartnerProfile = asyncHandler(async (req, res) => {
  const partner = await User.findOne({ _id: req.params.id, role: "partner" }).select(PUBLIC_FIELDS);
  if (!partner) throw new ApiError(404, "Partner not found");
  res.json({ success: true, data: partner });
});

import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const PUBLIC_FIELDS =
  "name avatar headline location bio organizationName partnerType programDetails startupsSupportedCount applicationLink socialLinks createdAt";

export const listPartners = asyncHandler(async (req, res) => {
  const { search, type } = req.query;

  const filter = { role: "partner" };
  if (type) filter.partnerType = type;
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { organizationName: new RegExp(search, "i") }];

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

export const getPartnerProfile = asyncHandler(async (req, res) => {
  const partner = await User.findOne({ _id: req.params.id, role: "partner" }).select(PUBLIC_FIELDS);
  if (!partner) throw new ApiError(404, "Partner not found");
  res.json({ success: true, data: partner });
});

import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

const PUBLIC_FIELDS =
  "name avatar headline location bio organizationName partnerType services industries companySize teamSize yearsInBusiness " +
  "projectsCompleted clientsServed partnershipTypes programDetails startupsSupportedCount applicationLink linkedIn socialLinks " +
  "isVerified isDemo createdAt";

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  clients: { clientsServed: -1 },
  projects: { projectsCompleted: -1 },
};

export const listPartners = asyncHandler(async (req, res) => {
  const { search, type, service, industry, location, companySize, partnershipType, verified, sort } = req.query;

  const filter = { role: "partner" };
  if (type) filter.partnerType = type;
  if (service) filter.services = service;
  if (industry) filter.industries = industry;
  if (location) filter.location = safeSearchRegex(location);
  if (companySize) filter.companySize = companySize;
  if (partnershipType) filter.partnershipTypes = partnershipType;
  if (verified === "true") filter.isVerified = true;
  if (search) filter.$or = [{ name: safeSearchRegex(search) }, { organizationName: safeSearchRegex(search) }];

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort(SORT_OPTIONS[sort] ?? SORT_OPTIONS.newest)
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

import User from "../shared/user.model.js";
import Startup from "./startup.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

const PUBLIC_FIELDS =
  "name avatar headline location bio investorType investmentFocus ticketSizeMin ticketSizeMax portfolioCompanyCount fundName fundSize preferredStages linkedIn socialLinks isVerified isDemo createdAt";

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  portfolio: { portfolioCompanyCount: -1 },
};

export const listInvestors = asyncHandler(async (req, res) => {
  const { search, focus, type, stage, location, verified, minTicket, maxTicket, sort } = req.query;

  const filter = { role: "investor" };
  if (focus) filter.investmentFocus = focus;
  if (type) filter.investorType = type;
  if (stage) filter.preferredStages = stage;
  if (location) filter.location = safeSearchRegex(location);
  if (verified === "true") filter.isVerified = true;
  // Ticket-range overlap: an investor matches if their real [min,max] ticket
  // size overlaps the founder's requested range, not an exact match.
  if (minTicket !== undefined) filter.ticketSizeMax = { $gte: Number(minTicket) };
  if (maxTicket !== undefined) filter.ticketSizeMin = { $lte: Number(maxTicket) };
  if (search) filter.$or = [{ name: safeSearchRegex(search) }, { headline: safeSearchRegex(search) }];

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

export const getInvestorProfile = asyncHandler(async (req, res) => {
  const investor = await User.findOne({ _id: req.params.id, role: "investor" }).select(PUBLIC_FIELDS);
  if (!investor) throw new ApiError(404, "Investor not found");
  res.json({ success: true, data: investor });
});

// "My Deal Flow" for the logged-in investor: startups they've followed or marked interested in.
export const getMyDealFlow = asyncHandler(async (req, res) => {
  const [interested, saved] = await Promise.all([
    Startup.find({ interested: req.user._id }).populate("founder", "name avatar").sort({ createdAt: -1 }),
    Startup.find({ followers: req.user._id }).populate("founder", "name avatar").sort({ createdAt: -1 }),
  ]);

  res.json({ success: true, data: { interested, saved } });
});

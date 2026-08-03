import User from "../shared/user.model.js";
import Startup from "./startup.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const PUBLIC_FIELDS =
  "name avatar headline location bio investmentFocus ticketSizeMin ticketSizeMax portfolioCompanyCount fundName fundSize preferredStages linkedIn socialLinks createdAt";

export const listInvestors = asyncHandler(async (req, res) => {
  const { search, focus } = req.query;

  const filter = { role: "investor" };
  if (focus) filter.investmentFocus = focus;
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

import Campaign from "../campaign/campaign.model.js";
import Application from "../shared/application.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

export const listAllCampaigns = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = safeSearchRegex(search);

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Campaign.find(filter)
      .populate("employer", "name email avatar")
      .populate("onBehalfOf", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Campaign.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: paginationMeta(pageNum, limitNum, total) });
});

// Only meaningful between open/closed — a "draft" is still being written by
// its owner and isn't something an admin action should silently publish.
export const toggleCampaignStatus = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (campaign.status === "draft") throw new ApiError(400, "Draft campaigns can't be toggled — the owner hasn't published this yet");

  campaign.status = campaign.status === "closed" ? "open" : "closed";
  await campaign.save();

  if (campaign.status === "closed") {
    await notify(req.app, {
      user: campaign.employer,
      type: "system",
      title: "Your campaign was closed by an admin",
      message: `"${campaign.title}" was closed and is no longer visible to influencers.`,
      link: "/dashboard/employer/campaigns",
    });
  }

  res.json({ success: true, status: campaign.status });
});

export const removeCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");

  await campaign.deleteOne();
  await Application.deleteMany({ job: campaign._id, onModel: "Campaign" });
  res.json({ success: true, message: "Campaign removed" });
});

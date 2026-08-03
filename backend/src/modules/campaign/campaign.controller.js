import Campaign from "./campaign.model.js";
import Application from "../shared/application.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

// A campaign can be managed by the brand who posted it, any other member of
// the same Company team, or an admin — same rule as jobController.isJobManager.
function isCampaignManager(campaign, user) {
  if (user.role === "super_admin") return true;
  if (campaign.employer.toString() === user._id.toString()) return true;
  if (campaign.company && user.company && campaign.company.toString() === user.company.toString()) return true;
  return false;
}

export const listCampaigns = asyncHandler(async (req, res) => {
  const { search, platform } = req.query;

  const filter = { status: "open" };
  if (platform) filter.platform = platform;
  if (search) filter.$text = { $search: search };

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Campaign.find(filter)
      .populate("employer", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Campaign.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const getMyCampaigns = asyncHandler(async (req, res) => {
  const filter = req.user.company ? { $or: [{ employer: req.user._id }, { company: req.user.company }] } : { employer: req.user._id };
  const items = await Campaign.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).populate("employer", "name avatar email");
  if (!campaign) throw new ApiError(404, "Campaign not found");

  const isOwner = !!req.user && (campaign.employer._id.toString() === req.user._id.toString() || req.user.role === "super_admin");
  if (!isOwner) {
    campaign.viewsCount += 1;
    await campaign.save();
  }

  res.json({ success: true, data: campaign });
});

export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.create({ ...req.body, employer: req.user._id, company: req.user.company || undefined });
  res.status(201).json({ success: true, data: campaign });
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (!isCampaignManager(campaign, req.user)) {
    throw new ApiError(403, "You do not have permission to edit this campaign");
  }

  Object.assign(campaign, req.body);
  await campaign.save();
  res.json({ success: true, data: campaign });
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (!isCampaignManager(campaign, req.user)) {
    throw new ApiError(403, "You do not have permission to delete this campaign");
  }

  await campaign.deleteOne();
  await Application.deleteMany({ job: campaign._id, onModel: "Campaign" });
  res.json({ success: true, message: "Campaign deleted" });
});

export const applyToCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (campaign.status !== "open") throw new ApiError(400, "This campaign is no longer accepting applications");

  const existing = await Application.findOne({ job: campaign._id, applicant: req.user._id });
  if (existing) throw new ApiError(409, "You have already applied to this campaign");

  const application = await Application.create({
    job: campaign._id,
    onModel: "Campaign",
    applicant: req.user._id,
    coverLetter: req.body.coverLetter,
    proposedRate: req.body.proposedRate || 0,
    deliveryDays: req.body.deliveryDays || 0,
  });

  campaign.applicationsCount += 1;
  await campaign.save();

  await notify(req.app, {
    user: campaign.employer,
    type: "job_application",
    title: "New campaign application",
    message: `${req.user.name} applied to "${campaign.title}"`,
    link: `/dashboard/employer/campaigns/${campaign._id}/applicants`,
  });

  res.status(201).json({ success: true, data: application });
});

export const getCampaignApplications = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (!isCampaignManager(campaign, req.user)) {
    throw new ApiError(403, "You do not have permission to view these applications");
  }

  const applications = await Application.find({ job: campaign._id, onModel: "Campaign" })
    .populate("applicant", "name avatar email headline location influencerProfile")
    .sort({ createdAt: -1 });

  await Application.updateMany({ job: campaign._id, onModel: "Campaign", viewedAt: null }, { viewedAt: new Date() });

  res.json({ success: true, data: applications });
});

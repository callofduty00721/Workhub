import Campaign from "./campaign.model.js";
import Application from "../shared/application.model.js";
import User from "../shared/user.model.js";
import AgencyClient from "./agencyClient.model.js";
import Payment from "../shared/payment.model.js";
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
  const { search, platform, employer } = req.query;

  const filter = { status: "open" };
  if (platform) filter.platforms = platform;
  // "employer" here means "this identity's campaigns" for a profile page —
  // include campaigns run on their behalf by an agency too, so a brand's own
  // public profile shows delegated campaigns, not just ones it posted itself.
  if (employer) filter.$or = [{ employer }, { onBehalfOf: employer }];
  if (search) filter.$text = { $search: search };

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Campaign.find(filter)
      .populate("employer", "name avatar isVerified rating reviewCount role")
      .populate("onBehalfOf", "name avatar")
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
  const items = await Campaign.find(filter).populate("onBehalfOf", "name avatar").sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

// Dashboard-overview numbers for a brand/agency/talent_partner — same
// company-inclusive scope as getMyCampaigns, mirrors job.controller.js's
// getMyJobAnalytics shape (totalViews/totalApplications/byStatus) plus two
// campaign-specific real numbers: totalSpent (sum of released Payments this
// user has actually paid out, not the stated budget) and hiredInfluencersCount
// (distinct influencers hired across every campaign, not applications count).
export const getMyCampaignAnalytics = asyncHandler(async (req, res) => {
  const filter = req.user.company ? { $or: [{ employer: req.user._id }, { company: req.user.company }] } : { employer: req.user._id };
  const campaigns = await Campaign.find(filter).select("title viewsCount applicationsCount status");
  const campaignIds = campaigns.map((c) => c._id);

  const [statusAgg, hiredApps, payments] = await Promise.all([
    Application.aggregate([
      { $match: { job: { $in: campaignIds }, onModel: "Campaign" } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Application.find({ job: { $in: campaignIds }, onModel: "Campaign", status: "hired" }).select("applicant"),
    Payment.find({ payer: req.user._id, type: "campaign", escrowStatus: "released" }).select("amount"),
  ]);

  const byStatus = statusAgg.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  const totalViews = campaigns.reduce((sum, c) => sum + c.viewsCount, 0);
  const totalApplications = campaigns.reduce((sum, c) => sum + c.applicationsCount, 0);
  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  const hiredInfluencersCount = new Set(hiredApps.map((a) => a.applicant.toString())).size;

  res.json({
    success: true,
    data: { totalViews, totalApplications, byStatus, totalSpent, hiredInfluencersCount, jobs: campaigns },
  });
});

// A brand's view of campaigns an agency is running for them — every status,
// not just "open" (unlike the public listCampaigns), since this is the
// brand checking on their own delegated work, not browsing to apply.
export const getCampaignsOnBehalfOfMe = asyncHandler(async (req, res) => {
  const items = await Campaign.find({ onBehalfOf: req.user._id }).populate("employer", "name avatar").sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate("employer", "name avatar email isVerified rating reviewCount role agencyProfile.clients")
    .populate("onBehalfOf", "name avatar");
  if (!campaign) throw new ApiError(404, "Campaign not found");

  const isOwner = !!req.user && (campaign.employer._id.toString() === req.user._id.toString() || req.user.role === "super_admin");
  if (!isOwner) {
    campaign.viewsCount += 1;
    await campaign.save();
  }

  res.json({ success: true, data: campaign });
});

export const createCampaign = asyncHandler(async (req, res) => {
  // isFeatured is admin-only (see toggleCampaignFeatured) — stripped here so
  // a brand can never self-declare its own campaign "featured".
  const { onBehalfOf, isFeatured: _isFeatured, ...rest } = req.body;

  if (onBehalfOf) {
    const relationship = await AgencyClient.findOne({ brand: onBehalfOf, agency: req.user._id, status: "accepted" });
    if (!relationship) {
      throw new ApiError(403, "You can only post campaigns on behalf of a brand that has accepted you as their agency");
    }
  }

  const campaign = await Campaign.create({
    ...rest,
    employer: req.user._id,
    company: req.user.company || undefined,
    onBehalfOf: onBehalfOf || undefined,
  });
  res.status(201).json({ success: true, data: campaign });
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (!isCampaignManager(campaign, req.user)) {
    throw new ApiError(403, "You do not have permission to edit this campaign");
  }

  const { onBehalfOf, isFeatured: _isFeatured, ...rest } = req.body;
  if (onBehalfOf !== undefined && onBehalfOf !== String(campaign.onBehalfOf || "")) {
    if (onBehalfOf) {
      const relationship = await AgencyClient.findOne({ brand: onBehalfOf, agency: req.user._id, status: "accepted" });
      if (!relationship) {
        throw new ApiError(403, "You can only post campaigns on behalf of a brand that has accepted you as their agency");
      }
    }
    campaign.onBehalfOf = onBehalfOf || undefined;
  }

  Object.assign(campaign, rest);
  await campaign.save();
  res.json({ success: true, data: campaign });
});

// super_admin-only — the only legitimate way isFeatured ever changes (see the
// strip in createCampaign/updateCampaign above).
export const toggleCampaignFeatured = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");

  campaign.isFeatured = !campaign.isFeatured;
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

// The brand-initiated counterpart to applyToCampaign — creates the exact
// same kind of Application (so it flows through the existing edit/withdraw/
// hire/pay pipeline unmodified), just started by the poster instead of the
// influencer. proposedRate/deliveryDays start at 0 — the influencer fills
// those in via the existing editApplication endpoint when they respond,
// same as any applicant refining their proposal before it's acted on.
export const inviteToCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (!isCampaignManager(campaign, req.user)) {
    throw new ApiError(403, "You do not have permission to invite influencers to this campaign");
  }
  if (campaign.status !== "open") throw new ApiError(400, "This campaign is no longer open");

  const { influencerId, message } = req.body;
  if (!influencerId) throw new ApiError(400, "influencerId is required");

  const influencer = await User.findOne({ _id: influencerId, role: "influencer" });
  if (!influencer) throw new ApiError(404, "Influencer not found");

  const existing = await Application.findOne({ job: campaign._id, applicant: influencerId });
  if (existing) throw new ApiError(409, "This influencer already has an application on this campaign");

  const application = await Application.create({
    job: campaign._id,
    onModel: "Campaign",
    applicant: influencerId,
    coverLetter: message || "",
    origin: "invited",
  });

  campaign.applicationsCount += 1;
  await campaign.save();

  await notify(req.app, {
    user: influencerId,
    type: "campaign_invite",
    title: "Campaign invite received",
    message: `${req.user.name} invited you to "${campaign.title}"`,
    link: "/dashboard/influencer/campaign-invites",
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

// A real, computed report — not a stored/editable document — built fresh
// from Applications/Payments every time so it can never drift out of sync
// with reality. Viewable by whoever manages the campaign (agency/brand
// owner) and, when set, the brand it was posted `onBehalfOf` — this is the
// "give the brand a final report" half of the agency-delegation flow.
export const getCampaignReport = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).populate("employer", "name avatar").populate("onBehalfOf", "name avatar");
  if (!campaign) throw new ApiError(404, "Campaign not found");

  const isDelegatingBrand = !!campaign.onBehalfOf && campaign.onBehalfOf._id.toString() === req.user._id.toString();
  if (!isCampaignManager(campaign, req.user) && !isDelegatingBrand) {
    throw new ApiError(403, "You do not have permission to view this campaign's report");
  }

  const applications = await Application.find({ job: campaign._id, onModel: "Campaign" }).populate(
    "applicant",
    "name avatar influencerProfile"
  );
  const applicationIds = applications.map((a) => a._id);
  const payments = await Payment.find({ application: { $in: applicationIds }, type: { $in: ["campaign", "campaign_facilitation"] } });
  const paymentByApplication = new Map(payments.map((p) => [p.application.toString(), p]));

  const influencers = applications.map((a) => {
    const payment = paymentByApplication.get(a._id.toString());
    return {
      applicationId: a._id,
      influencer: a.applicant,
      status: a.status,
      origin: a.origin,
      proposedRate: a.proposedRate,
      deliveryDays: a.deliveryDays,
      payment: payment
        ? {
            type: payment.type,
            amount: payment.amount,
            status: payment.status,
            escrowStatus: payment.escrowStatus,
            orderStatus: payment.orderStatus,
            deliverables: payment.deliverables,
            deliveredAt: payment.deliveredAt,
          }
        : null,
    };
  });

  const paidPayments = payments.filter((p) => p.status === "paid");
  const summary = {
    totalApplications: applications.length,
    hiredCount: applications.filter((a) => a.status === "hired").length,
    completedCount: influencers.filter((i) => i.payment?.orderStatus === "completed" || i.payment?.escrowStatus === "released").length,
    totalSpend: paidPayments.reduce((sum, p) => sum + p.amount, 0),
    totalReleased: paidPayments.filter((p) => p.escrowStatus === "released").reduce((sum, p) => sum + p.amount, 0),
  };

  res.json({
    success: true,
    data: {
      campaign: {
        _id: campaign._id,
        title: campaign.title,
        status: campaign.status,
        budgetMin: campaign.budgetMin,
        budgetMax: campaign.budgetMax,
        viewsCount: campaign.viewsCount,
        applicationsCount: campaign.applicationsCount,
        employer: campaign.employer,
        onBehalfOf: campaign.onBehalfOf,
        createdAt: campaign.createdAt,
      },
      summary,
      influencers,
    },
  });
});

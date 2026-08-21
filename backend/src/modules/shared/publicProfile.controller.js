import User from "./user.model.js";
import ProfileViewLog from "./profileViewLog.model.js";
import Campaign from "../campaign/campaign.model.js";
import Application from "./application.model.js";
import Payment from "./payment.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

// Only these roles ever post campaigns (see campaign.routes.js's authorize()
// list) — no point querying Campaign for founder/freelancer/etc. rows.
const CAMPAIGN_POSTING_ROLES = new Set(["brand", "agency", "talent_partner"]);

// Mirrors frontend/src/lib/mockData.ts's BRAND_CATEGORIES — client-side
// taxonomy, no backend enum (brandProfile.categories stays a plain
// [String]), but the "other" filter below needs to know the same fixed set
// to mean "anything not in it". Keep the two lists in sync by hand.
const BRAND_CATEGORIES = [
  "Beauty & Personal Care",
  "Skincare",
  "Haircare",
  "Makeup",
  "Baby & Kids",
  "Fashion & Apparel",
  "Footwear",
  "Jewellery & Accessories",
  "Food & Beverage",
  "Health & Wellness",
  "Fitness & Nutrition",
  "Home & Living",
  "Electronics & Gadgets",
  "Automotive",
  "Travel & Hospitality",
  "Finance & Fintech",
  "Education & EdTech",
  "Gaming & Entertainment",
  "Pet Care",
  "Sustainability & Eco-friendly",
];

// Brand/Agency/Talent Partner share the large majority of their public shape
// (header + one embedded profile object) — a role-keyed projection here
// avoids three near-duplicate controllers each re-deriving the owner-check
// and view-increment logic already proven out by influencer.controller.js's
// getInfluencerProfile. Influencer itself stays on its own existing endpoint
// (/api/influencers/:id) rather than being migrated onto this one — no
// reason to risk the already-shipped consumer for this addition.
const PUBLIC_FIELDS_BY_ROLE = {
  brand: "name avatar headline location bio brandProfile isVerified rating reviewCount socialLinks achievements company createdAt",
  agency: "name avatar headline location bio agencyProfile isVerified rating reviewCount socialLinks achievements company createdAt",
  talent_partner: "name avatar headline location bio talentPartnerProfile isVerified rating reviewCount socialLinks achievements company createdAt",
};

// A trimmer projection for the directory grid — no bio/achievements/company
// (that's single-profile detail), just enough to render a card and let a
// visitor decide whether to click through.
const LIST_FIELDS_BY_ROLE = {
  brand:
    "name avatar headline location brandProfile.industry brandProfile.categories brandProfile.followerCount brandProfile.website brandProfile.socialLinks isVerified rating reviewCount isDemo createdAt",
  agency:
    "name avatar headline location agencyProfile.agencyType agencyProfile.teamSize agencyProfile.website agencyProfile.socialLinks isVerified rating reviewCount isDemo createdAt",
  talent_partner:
    "name avatar headline location talentPartnerProfile.partnerType talentPartnerProfile.website talentPartnerProfile.socialLinks isVerified rating reviewCount isDemo createdAt",
};

// Directory list — feeds the Brands/Agencies/Talent Partners tabs next to
// Influencers (see frontend's DirectoryTabs). Only ever profiles with
// nothing hidden — no verification/completeness gate, same openness as
// listInfluencers.
export const listPublicProfiles = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const fields = LIST_FIELDS_BY_ROLE[role];
  if (!fields) throw new ApiError(404, "Not found");

  const { search, category } = req.query;
  const filter = { role };
  if (search) filter.$or = [{ name: safeSearchRegex(search) }, { headline: safeSearchRegex(search) }];
  if (category === "other") {
    filter["brandProfile.categories"] = { $elemMatch: { $nin: BRAND_CATEGORIES } };
  } else if (category) {
    filter["brandProfile.categories"] = category;
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    User.find(filter).select(fields).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  // Real, verified stats (never stored/cached on the User doc, so they can
  // never drift) — every number here is computed fresh from Campaigns/
  // Applications, not self-reported.
  let withStats = items;
  if (CAMPAIGN_POSTING_ROLES.has(role) && items.length) {
    const employerIds = items.map((u) => u._id);

    const [openCounts, campaigns] = await Promise.all([
      Campaign.aggregate([
        { $match: { employer: { $in: employerIds }, status: "open" } },
        { $group: { _id: "$employer", count: { $sum: 1 } } },
      ]),
      Campaign.find({ employer: { $in: employerIds } }).select("_id employer"),
    ]);
    const openCountByEmployer = new Map(openCounts.map((c) => [c._id.toString(), c.count]));

    const totalCountByEmployer = new Map();
    const campaignIdToEmployer = new Map();
    for (const c of campaigns) {
      const key = c.employer.toString();
      totalCountByEmployer.set(key, (totalCountByEmployer.get(key) ?? 0) + 1);
      campaignIdToEmployer.set(c._id.toString(), key);
    }

    // Distinct influencers actually hired (status:"hired"), per employer —
    // across every campaign that employer has ever posted.
    const hiredApps = campaigns.length
      ? await Application.find({ job: { $in: campaigns.map((c) => c._id) }, onModel: "Campaign", status: "hired" }).select("job applicant")
      : [];
    const hiredInfluencerIdsByEmployer = new Map();
    for (const app of hiredApps) {
      const employerKey = campaignIdToEmployer.get(app.job.toString());
      if (!employerKey) continue;
      if (!hiredInfluencerIdsByEmployer.has(employerKey)) hiredInfluencerIdsByEmployer.set(employerKey, new Set());
      hiredInfluencerIdsByEmployer.get(employerKey).add(app.applicant.toString());
    }

    // "Reach" is the real, summed follower count of those actually-hired
    // influencers' own platforms — not an estimate/forecast of impressions.
    const allHiredInfluencerIds = [...new Set(hiredApps.map((a) => a.applicant.toString()))];
    const influencers = allHiredInfluencerIds.length
      ? await User.find({ _id: { $in: allHiredInfluencerIds } }).select("influencerProfile.platforms")
      : [];
    const followersByInfluencer = new Map(
      influencers.map((u) => [u._id.toString(), (u.influencerProfile?.platforms ?? []).reduce((sum, p) => sum + (p.followers ?? 0), 0)])
    );

    withStats = items.map((u) => {
      const key = u._id.toString();
      const hiredSet = hiredInfluencerIdsByEmployer.get(key);
      const totalReach = hiredSet ? [...hiredSet].reduce((sum, infId) => sum + (followersByInfluencer.get(infId) ?? 0), 0) : 0;
      return {
        ...u.toObject(),
        openCampaignsCount: openCountByEmployer.get(key) ?? 0,
        totalCampaignsCount: totalCountByEmployer.get(key) ?? 0,
        hiredInfluencersCount: hiredSet?.size ?? 0,
        totalReach,
      };
    });
  }

  res.json({ success: true, data: withStats, pagination: paginationMeta(pageNum, limitNum, total) });
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const { role, id } = req.params;
  const fields = PUBLIC_FIELDS_BY_ROLE[role];
  if (!fields) throw new ApiError(404, "Not found");

  const profile = await User.findOne({ _id: id, role }).select(fields).populate("company", "name");
  if (!profile) throw new ApiError(404, "Profile not found");

  if (!req.user || req.user._id.toString() !== profile._id.toString()) {
    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      User.updateOne({ _id: profile._id }, { $inc: { profileViews: 1 } }),
      ProfileViewLog.findOneAndUpdate({ user: profile._id, date: today }, { $inc: { count: 1 } }, { upsert: true }),
    ]);
  }

  // Auto-populated "Past Collaborations" — one per released campaign
  // payment this profile actually paid out, so it can never be fabricated
  // the way a manually-typed entry could. Shown alongside (not instead of)
  // the brand/agency/talent_partner's own manual entries, distinguished by
  // `verified: true` on the frontend — mirrors getInfluencerProfile's
  // verifiedCollaborations (same idea, opposite side of the payment).
  let verifiedCollaborations = [];
  if (CAMPAIGN_POSTING_ROLES.has(role)) {
    const releasedPayments = await Payment.find({ payer: profile._id, type: "campaign", escrowStatus: "released" })
      .select("amount releasedAt application payee")
      .populate("payee", "name avatar")
      .populate({ path: "application", select: "job onModel", populate: { path: "job", select: "title" } })
      .sort({ releasedAt: -1 });

    verifiedCollaborations = releasedPayments
      .filter((p) => p.application?.job && p.payee)
      .map((p) => ({
        brandName: p.payee.name,
        logoUrl: p.payee.avatar || "",
        description: p.application.job.title,
        resultMetric: `₹${p.amount.toLocaleString("en-IN")}${
          p.releasedAt ? ` · ${new Date(p.releasedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""
        }`,
        verified: true,
      }));
  }

  res.json({ success: true, data: { ...profile.toObject(), verifiedCollaborations } });
});

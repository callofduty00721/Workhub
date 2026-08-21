import AgencyClient from "./agencyClient.model.js";
import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";

const AGENCY_FIELDS = "name avatar headline location agencyProfile.agencyType isVerified rating reviewCount";
const BRAND_FIELDS = "name avatar headline location brandProfile.industry isVerified rating reviewCount";

export const inviteAgency = asyncHandler(async (req, res) => {
  const { agencyId, budget, message } = req.body;
  if (agencyId === req.user._id.toString()) throw new ApiError(400, "You can't invite yourself");

  const agency = await User.findOne({ _id: agencyId, role: "agency" });
  if (!agency) throw new ApiError(404, "Agency not found");

  const existing = await AgencyClient.findOne({ brand: req.user._id, agency: agencyId });
  if (existing) {
    if (existing.status === "pending") throw new ApiError(409, "You already have a pending invite to this agency");
    if (existing.status === "accepted") throw new ApiError(409, "This agency already manages your campaigns");
    // declined/removed — re-inviting reopens the same row, same as TalentRoster.
    existing.status = "pending";
    existing.budget = budget || 0;
    existing.message = message || "";
    existing.respondedAt = null;
    await existing.save();
  } else {
    await AgencyClient.create({ brand: req.user._id, agency: agencyId, budget: budget || 0, message: message || "" });
  }

  await notify(req.app, {
    user: agencyId,
    type: "campaign_invite",
    title: "New client invite",
    message: `${req.user.name} wants you to manage their campaigns${budget ? ` (₹${Number(budget).toLocaleString("en-IN")} budget)` : ""}`,
    link: "/dashboard/employer/clients",
  });

  res.status(201).json({ success: true, message: "Invite sent" });
});

export const respondToAgencyInvite = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const invite = await AgencyClient.findById(req.params.id);
  if (!invite) throw new ApiError(404, "Invite not found");
  if (invite.agency.toString() !== req.user._id.toString()) throw new ApiError(403, "This isn't your invite to respond to");
  if (invite.status !== "pending") throw new ApiError(400, "This invite has already been responded to");

  invite.status = status;
  invite.respondedAt = new Date();
  await invite.save();

  if (status === "accepted") {
    await notify(req.app, {
      user: invite.brand,
      type: "campaign_invite",
      title: "Agency invite accepted",
      message: `${req.user.name} accepted your invite and will now manage your campaigns`,
      link: "/dashboard/employer/agencies",
    });
  }

  res.json({ success: true, data: invite });
});

// The brand's own view — which agencies manage them.
export const listMyAgencies = asyncHandler(async (req, res) => {
  const rows = await AgencyClient.find({ brand: req.user._id, status: "accepted" }).populate("agency", AGENCY_FIELDS).sort({ respondedAt: -1 });
  res.json({ success: true, data: rows });
});

// The agency's own view — which brands' campaigns they manage.
export const listMyClients = asyncHandler(async (req, res) => {
  const rows = await AgencyClient.find({ agency: req.user._id, status: "accepted" }).populate("brand", BRAND_FIELDS).sort({ respondedAt: -1 });
  res.json({ success: true, data: rows });
});

// The agency's pending invites from brands, awaiting a response.
export const listPendingAgencyInvites = asyncHandler(async (req, res) => {
  const rows = await AgencyClient.find({ agency: req.user._id, status: "pending" }).populate("brand", BRAND_FIELDS).sort({ createdAt: -1 });
  res.json({ success: true, data: rows });
});

// Either side can end the relationship — the brand who no longer wants this
// agency managing them, or the agency stepping away from this client.
export const removeAgencyClient = asyncHandler(async (req, res) => {
  const relationship = await AgencyClient.findById(req.params.id);
  if (!relationship) throw new ApiError(404, "Not found");
  const isParty =
    relationship.brand.toString() === req.user._id.toString() || relationship.agency.toString() === req.user._id.toString();
  if (!isParty) throw new ApiError(403, "This isn't your client relationship to end");

  relationship.status = "removed";
  await relationship.save();
  res.json({ success: true, message: "Relationship ended" });
});

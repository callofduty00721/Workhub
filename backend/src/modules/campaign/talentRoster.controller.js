import TalentRoster from "./talentRoster.model.js";
import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";

const PUBLIC_ROSTER_FIELDS = "name avatar influencerProfile.category influencerProfile.niche influencerProfile.platforms location rating reviewCount";

export const inviteToRoster = asyncHandler(async (req, res) => {
  const { influencerId, message } = req.body;
  if (influencerId === req.user._id.toString()) throw new ApiError(400, "You can't invite yourself");

  const influencer = await User.findOne({ _id: influencerId, role: "influencer" });
  if (!influencer) throw new ApiError(404, "Influencer not found");

  const existing = await TalentRoster.findOne({ partner: req.user._id, influencer: influencerId });
  if (existing) {
    if (existing.status === "pending") throw new ApiError(409, "You already have a pending invite to this influencer");
    if (existing.status === "accepted") throw new ApiError(409, "This influencer is already on your roster");
    // declined/removed — re-inviting reopens the same row instead of a
    // duplicate, so the relationship's history survives.
    existing.status = "pending";
    existing.message = message || "";
    existing.respondedAt = null;
    await existing.save();
  } else {
    await TalentRoster.create({ partner: req.user._id, influencer: influencerId, message: message || "" });
  }

  await notify(req.app, {
    user: influencerId,
    type: "roster_invite",
    title: "Roster invite received",
    message: `${req.user.name} wants to add you to their creator roster`,
    link: "/dashboard/influencer/roster-invites",
  });

  res.status(201).json({ success: true, message: "Invite sent" });
});

export const respondToInvite = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const invite = await TalentRoster.findById(req.params.id);
  if (!invite) throw new ApiError(404, "Invite not found");
  if (invite.influencer.toString() !== req.user._id.toString()) throw new ApiError(403, "This isn't your invite to respond to");
  if (invite.status !== "pending") throw new ApiError(400, "This invite has already been responded to");

  invite.status = status;
  invite.respondedAt = new Date();
  await invite.save();

  if (status === "accepted") {
    await notify(req.app, {
      user: invite.partner,
      type: "roster_invite_status",
      title: "Roster invite accepted",
      message: `${req.user.name} accepted your roster invite`,
      link: "/dashboard/employer/roster",
    });
  }

  res.json({ success: true, data: invite });
});

export const listMyRoster = asyncHandler(async (req, res) => {
  const rows = await TalentRoster.find({ partner: req.user._id, status: "accepted" })
    .populate("influencer", PUBLIC_ROSTER_FIELDS)
    .sort({ respondedAt: -1 });
  res.json({ success: true, data: rows });
});

export const listPendingInvites = asyncHandler(async (req, res) => {
  const rows = await TalentRoster.find({ influencer: req.user._id, status: "pending" })
    .populate("partner", "name avatar headline")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: rows });
});

export const removeFromRoster = asyncHandler(async (req, res) => {
  const invite = await TalentRoster.findById(req.params.id);
  if (!invite) throw new ApiError(404, "Not found");
  if (invite.partner.toString() !== req.user._id.toString()) throw new ApiError(403, "This isn't your roster entry to remove");

  invite.status = "removed";
  await invite.save();
  res.json({ success: true, message: "Removed from roster" });
});

// Public — feeds the "Our Creators" tab on an Agency or Talent Partner's
// profile page. Only ever accepted rows: a pending/declined invite is never
// shown to anyone but the two parties involved.
export const getPublicRoster = asyncHandler(async (req, res) => {
  const rows = await TalentRoster.find({ partner: req.params.partnerId, status: "accepted" })
    .populate("influencer", PUBLIC_ROSTER_FIELDS)
    .sort({ respondedAt: -1 });
  res.json({ success: true, data: rows.filter((r) => r.influencer).map((r) => r.influencer) });
});

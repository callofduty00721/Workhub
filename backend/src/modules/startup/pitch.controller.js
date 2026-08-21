import Pitch from "./pitch.model.js";
import Startup from "./startup.model.js";
import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { assertStartupFounder } from "./founderAuth.js";

export const sendPitch = asyncHandler(async (req, res) => {
  const { startupId, investorId, message } = req.body;

  const startup = await Startup.findById(startupId).select("founder name");
  if (!startup) throw new ApiError(404, "Startup not found");
  assertStartupFounder(startup, req.user, "Only the founder of this startup can pitch it");

  const investor = await User.findOne({ _id: investorId, role: "investor" }).select("_id");
  if (!investor) throw new ApiError(404, "Investor not found");

  const pitch = await Pitch.create({
    startup: startup._id,
    founder: req.user._id,
    investor: investor._id,
    message: message || "",
  });

  await notify(req.app, {
    user: investor._id,
    type: "startup_pitch",
    title: "You received a new startup pitch",
    message: `${req.user.name} pitched ${startup.name} to you`,
    link: `/startups/${startup._id}`,
  });

  res.status(201).json({ success: true, data: pitch });
});

export const getSentPitches = asyncHandler(async (req, res) => {
  const pitches = await Pitch.find({ founder: req.user._id })
    .populate("startup", "name logo")
    .populate("investor", "name avatar")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: pitches });
});

export const getReceivedPitches = asyncHandler(async (req, res) => {
  const pitches = await Pitch.find({ investor: req.user._id })
    .populate("startup", "name logo industry")
    .populate("founder", "name avatar")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: pitches });
});

export const markPitchViewed = asyncHandler(async (req, res) => {
  const pitch = await Pitch.findById(req.params.id);
  if (!pitch) throw new ApiError(404, "Pitch not found");
  if (pitch.investor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only mark your own received pitches as viewed");
  }

  pitch.status = "viewed";
  await pitch.save();
  res.json({ success: true, data: pitch });
});

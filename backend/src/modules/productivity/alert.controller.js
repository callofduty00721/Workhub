import Alert from "./alert.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const MAX_ALERTS_PER_USER = 10;

export const createAlert = asyncHandler(async (req, res) => {
  const { keywords, remoteOnly } = req.body;
  const cleanKeywords = (Array.isArray(keywords) ? keywords : []).map((k) => String(k).trim()).filter(Boolean);
  if (cleanKeywords.length === 0) throw new ApiError(400, "Add at least one keyword or skill to match against");

  const existingCount = await Alert.countDocuments({ user: req.user._id });
  if (existingCount >= MAX_ALERTS_PER_USER) throw new ApiError(400, `You can have up to ${MAX_ALERTS_PER_USER} alerts`);

  const alert = await Alert.create({ user: req.user._id, keywords: cleanKeywords, remoteOnly: !!remoteOnly });
  res.status(201).json({ success: true, data: alert });
});

export const getMyAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: alerts });
});

export const deleteAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id });
  if (!alert) throw new ApiError(404, "Alert not found");
  await alert.deleteOne();
  res.json({ success: true, message: "Alert deleted" });
});

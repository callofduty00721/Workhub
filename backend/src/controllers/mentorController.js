import User from "../models/User.js";
import Session from "../models/Session.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

const PUBLIC_FIELDS = "name avatar headline location bio expertise sessionRate yearsOfExperience rating reviewCount createdAt";

export const listMentors = asyncHandler(async (req, res) => {
  const { search, expertise, page = 1, limit = 12 } = req.query;

  const filter = { role: "mentor" };
  if (expertise) filter.expertise = expertise;
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { headline: new RegExp(search, "i") }];

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ rating: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

export const getMentorProfile = asyncHandler(async (req, res) => {
  const mentor = await User.findOne({ _id: req.params.id, role: "mentor" }).select(PUBLIC_FIELDS);
  if (!mentor) throw new ApiError(404, "Mentor not found");
  res.json({ success: true, data: mentor });
});

export const requestSession = asyncHandler(async (req, res) => {
  const mentor = await User.findOne({ _id: req.params.id, role: "mentor" });
  if (!mentor) throw new ApiError(404, "Mentor not found");

  const session = await Session.create({
    mentor: mentor._id,
    requester: req.user._id,
    topic: req.body.topic,
    message: req.body.message,
    preferredTime: req.body.preferredTime,
  });

  await notify(req.app, {
    user: mentor._id,
    type: "session_request",
    title: "New mentorship session request",
    message: `${req.user.name} requested a session: ${req.body.topic}`,
    link: "/dashboard/mentor",
  });

  res.status(201).json({ success: true, data: session });
});

export const getMentorSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ mentor: req.user._id }).populate("requester", "name avatar headline").sort({ createdAt: -1 });
  res.json({ success: true, data: sessions });
});

export const getMySessionRequests = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ requester: req.user._id }).populate("mentor", "name avatar headline").sort({ createdAt: -1 });
  res.json({ success: true, data: sessions });
});

export const updateSessionStatus = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.mentor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to update this session");
  }

  session.status = req.body.status;
  await session.save();

  await notify(req.app, {
    user: session.requester,
    type: "session_status",
    title: "Session status updated",
    message: `Your session "${session.topic}" is now "${req.body.status}"`,
    link: "/dashboard/mentor/requests",
  });

  res.json({ success: true, data: session });
});

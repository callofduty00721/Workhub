import User from "../shared/user.model.js";
import Session from "./session.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const PUBLIC_FIELDS =
  "name avatar headline location bio expertise sessionRate sessionFormat hoursPerWeekAvailable workingDays workingHours linkedIn yearsOfExperience rating reviewCount createdAt";

export const listMentors = asyncHandler(async (req, res) => {
  const { search, expertise } = req.query;

  const filter = { role: "mentor" };
  if (expertise) filter.expertise = expertise;
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { headline: new RegExp(search, "i") }];

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: paginationMeta(pageNum, limitNum, total) });
});

export const getMentorProfile = asyncHandler(async (req, res) => {
  const mentor = await User.findOne({ _id: req.params.id, role: "mentor" }).select(PUBLIC_FIELDS);
  if (!mentor) throw new ApiError(404, "Mentor not found");

  // Computed, not stored — always reflects actual completed sessions rather
  // than a counter that could drift out of sync.
  const completedSessionsCount = await Session.countDocuments({ mentor: mentor._id, status: "completed" });

  res.json({ success: true, data: { ...mentor.toObject(), completedSessionsCount } });
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

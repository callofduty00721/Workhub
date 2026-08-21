import User from "../shared/user.model.js";
import Session from "./session.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

const PUBLIC_FIELDS =
  "name avatar headline location bio mentorCategory expertise sessionRate sessionFormat hoursPerWeekAvailable workingDays workingHours " +
  "linkedIn languages socialLinks availabilityStatus isVerified yearsOfExperience rating reviewCount isDemo createdAt";

const SORT_OPTIONS = {
  rating: { rating: -1 },
  newest: { createdAt: -1 },
  experience: { yearsOfExperience: -1 },
};

export const listMentors = asyncHandler(async (req, res) => {
  const { search, expertise, category, location, verified, language, sessionFormat, minPrice, maxPrice, sort } = req.query;

  const filter = { role: "mentor" };
  if (expertise) filter.expertise = expertise;
  if (category) filter.mentorCategory = category;
  if (location) filter.location = safeSearchRegex(location);
  if (verified === "true") filter.isVerified = true;
  if (language) filter.languages = language;
  if (sessionFormat) filter.sessionFormat = sessionFormat;
  if (minPrice !== undefined) filter.sessionRate = { ...filter.sessionRate, $gte: Number(minPrice) };
  if (maxPrice !== undefined) filter.sessionRate = { ...filter.sessionRate, $lte: Number(maxPrice) };
  if (search) filter.$or = [{ name: safeSearchRegex(search) }, { headline: safeSearchRegex(search) }];

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort(SORT_OPTIONS[sort] ?? SORT_OPTIONS.rating)
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  // Real completed-session counts for exactly the mentors on this page — one
  // extra aggregate query regardless of page size, not stored/cached, so it
  // can never drift like a counter field would.
  const counts = await Session.aggregate([
    { $match: { mentor: { $in: items.map((m) => m._id) }, status: "completed" } },
    { $group: { _id: "$mentor", count: { $sum: 1 } } },
  ]);
  const countByMentor = new Map(counts.map((c) => [c._id.toString(), c.count]));
  const data = items.map((m) => ({ ...m.toObject(), completedSessionsCount: countByMentor.get(m._id.toString()) ?? 0 }));

  res.json({ success: true, data, pagination: paginationMeta(pageNum, limitNum, total) });
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

import Contest from "../models/Contest.js";
import ContestEntry from "../models/ContestEntry.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

export const listContests = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 12 } = req.query;

  const filter = { status: "open" };
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    Contest.find(filter)
      .populate("client", "name avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Contest.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

export const getMyContests = asyncHandler(async (req, res) => {
  const items = await Contest.find({ client: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getContestById = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id).populate("client", "name avatar email");
  if (!contest) throw new ApiError(404, "Contest not found");
  res.json({ success: true, data: contest });
});

export const createContest = asyncHandler(async (req, res) => {
  const contest = await Contest.create({ ...req.body, client: req.user._id });
  res.status(201).json({ success: true, data: contest });
});

export const updateContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.client.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to edit this contest");
  }

  Object.assign(contest, req.body);
  await contest.save();
  res.json({ success: true, data: contest });
});

export const deleteContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.client.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to delete this contest");
  }

  await contest.deleteOne();
  await ContestEntry.deleteMany({ contest: contest._id });
  res.json({ success: true, message: "Contest deleted" });
});

export const submitEntry = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.status !== "open") throw new ApiError(400, "This contest is no longer accepting entries");
  if (new Date(contest.deadline) < new Date()) throw new ApiError(400, "The submission deadline has passed");

  const existing = await ContestEntry.findOne({ contest: contest._id, freelancer: req.user._id });
  if (existing) throw new ApiError(409, "You have already submitted an entry to this contest");

  const entry = await ContestEntry.create({
    contest: contest._id,
    freelancer: req.user._id,
    title: req.body.title,
    description: req.body.description,
    fileUrl: req.body.fileUrl,
  });

  contest.entriesCount += 1;
  await contest.save();

  await notify(req.app, {
    user: contest.client,
    type: "system",
    title: "New contest entry",
    message: `${req.user.name} submitted an entry to "${contest.title}"`,
    link: `/dashboard/client/contests/${contest._id}/entries`,
  });

  res.status(201).json({ success: true, data: entry });
});

export const getContestEntries = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.client.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to view these entries");
  }

  const entries = await ContestEntry.find({ contest: contest._id })
    .populate("freelancer", "name avatar email headline location")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: entries });
});

export const getMyEntries = asyncHandler(async (req, res) => {
  const entries = await ContestEntry.find({ freelancer: req.user._id })
    .populate("contest", "title status prizeAmount currency deadline client")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: entries });
});

export const pickWinner = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.client.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to pick a winner for this contest");
  }
  if (contest.status === "closed") throw new ApiError(400, "This contest is already closed");

  const entry = await ContestEntry.findOne({ _id: req.params.entryId, contest: contest._id });
  if (!entry) throw new ApiError(404, "Entry not found");

  entry.isWinner = true;
  await entry.save();

  contest.status = "closed";
  contest.winnerEntry = entry._id;
  await contest.save();

  await notify(req.app, {
    user: entry.freelancer,
    type: "system",
    title: "You won a contest! 🎉",
    message: `Your entry was picked as the winner for "${contest.title}"`,
    link: `/dashboard/freelancer/contests`,
  });

  res.json({ success: true, data: contest });
});

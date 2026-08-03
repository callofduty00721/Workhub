import Contest from "../contest/contest.model.js";
import ContestEntry from "../contest/contestEntry.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

export const listAllContests = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, "i");

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Contest.find(filter)
      .populate("client", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Contest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const closeContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.status === "closed") throw new ApiError(400, "This contest is already closed");

  contest.status = "closed";
  await contest.save();

  await notify(req.app, {
    user: contest.client,
    type: "system",
    title: "Your contest was closed by an admin",
    message: `"${contest.title}" was closed and is no longer accepting entries.`,
    link: "/dashboard/client/contests",
  });

  res.json({ success: true, status: contest.status });
});

export const removeContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");

  await contest.deleteOne();
  await ContestEntry.deleteMany({ contest: contest._id });
  res.json({ success: true, message: "Contest removed" });
});

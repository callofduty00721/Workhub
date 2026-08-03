import Job from "../jobs/job.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

export const listAllJobs = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, "i");

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Job.find(filter)
      .populate("employer", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Job.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const toggleJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  job.status = job.status === "closed" ? "open" : "closed";
  await job.save();

  if (job.status === "closed") {
    await notify(req.app, {
      user: job.employer,
      type: "system",
      title: "Your posting was closed by an admin",
      message: `"${job.title}" was closed and is no longer visible to applicants.`,
      link: "/dashboard/employer",
    });
  }

  res.json({ success: true, status: job.status });
});

export const removeJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  await job.deleteOne();
  res.json({ success: true, message: "Job removed" });
});

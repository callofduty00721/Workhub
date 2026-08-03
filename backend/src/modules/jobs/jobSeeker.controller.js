import User from "../shared/user.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

const PUBLIC_FIELDS = "name avatar headline location bio skills yearsOfExperience jobSeekerProfile resumeUrl createdAt";

export const listJobSeekers = asyncHandler(async (req, res) => {
  const { search, location } = req.query;

  const filter = { role: "job_seeker" };
  if (location) filter.location = new RegExp(location, "i");
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { headline: new RegExp(search, "i") }];

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: paginationMeta(pageNum, limitNum, total) });
});

export const getJobSeekerProfile = asyncHandler(async (req, res) => {
  const jobSeeker = await User.findOne({ _id: req.params.id, role: "job_seeker" }).select(PUBLIC_FIELDS);
  if (!jobSeeker) throw new ApiError(404, "Job seeker not found");
  res.json({ success: true, data: jobSeeker });
});

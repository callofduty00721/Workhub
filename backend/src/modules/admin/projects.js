import Project from "../jobs/project.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { safeSearchRegex } from "../../utils/searchRegex.js";

export const listAllProjects = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = safeSearchRegex(search);

  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Project.find(filter)
      .populate("employer", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

export const toggleProjectStatus = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  project.status = project.status === "closed" ? "open" : "closed";
  await project.save();

  if (project.status === "closed") {
    await notify(req.app, {
      user: project.employer,
      type: "system",
      title: "Your posting was closed by an admin",
      message: `"${project.title}" was closed and is no longer visible to applicants.`,
      link: "/dashboard/client",
    });
  }

  res.json({ success: true, status: project.status });
});

export const removeProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  await project.deleteOne();
  res.json({ success: true, message: "Project removed" });
});

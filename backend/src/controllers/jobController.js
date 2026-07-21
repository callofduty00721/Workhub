import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

export const listJobs = asyncHandler(async (req, res) => {
  const { search, type, isRemote, page = 1, limit = 12 } = req.query;

  const filter = { status: "open" };
  if (type) filter.type = String(type).includes(",") ? { $in: String(type).split(",") } : type;
  if (isRemote === "true") filter.isRemote = true;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [items, total] = await Promise.all([
    Job.find(filter)
      .populate("employer", "name avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Job.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const getMyJobs = asyncHandler(async (req, res) => {
  const items = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("employer", "name avatar email");
  if (!job) throw new ApiError(404, "Job not found");
  res.json({ success: true, data: job });
});

export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, employer: req.user._id });
  res.status(201).json({ success: true, data: job });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.employer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to edit this job");
  }

  Object.assign(job, req.body);
  await job.save();
  res.json({ success: true, data: job });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.employer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to delete this job");
  }

  await job.deleteOne();
  await Application.deleteMany({ job: job._id });
  res.json({ success: true, message: "Job deleted" });
});

export const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "open") throw new ApiError(400, "This job is no longer accepting applications");

  const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
  if (existing) throw new ApiError(409, "You have already applied to this job");

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    coverLetter: req.body.coverLetter,
    resumeUrl: req.body.resumeUrl,
    proposedRate: req.body.proposedRate || 0,
    deliveryDays: req.body.deliveryDays || 0,
  });

  job.applicationsCount += 1;
  await job.save();

  await notify(req.app, {
    user: job.employer,
    type: "job_application",
    title: "New application received",
    message: `${req.user.name} applied to ${job.title}`,
    link: `/dashboard/employer/jobs/${job._id}/applicants`,
  });

  res.status(201).json({ success: true, data: application });
});

export const getJobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.employer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to view these applications");
  }

  const applications = await Application.find({ job: job._id })
    .populate("applicant", "name avatar email headline location")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: applications });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate("job", "title companyName location type status employer")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: applications });
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.applicant.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only withdraw your own applications");
  }
  if (application.status === "hired") throw new ApiError(400, "You've already been hired — this can't be withdrawn");
  if (application.status === "withdrawn") throw new ApiError(400, "This application is already withdrawn");

  application.status = "withdrawn";
  application.withdrawnAt = new Date();
  await application.save();

  res.json({ success: true, data: application });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  if (job.employer.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to update this application");
  }

  application.status = req.body.status;
  await application.save();

  await notify(req.app, {
    user: application.applicant,
    type: "application_status",
    title: "Application status updated",
    message: `Your application for ${job.title} is now "${req.body.status}"`,
    link: "/dashboard/freelancer/applications",
  });

  res.json({ success: true, data: application });
});

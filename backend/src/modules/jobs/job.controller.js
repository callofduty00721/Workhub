import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Job from "./job.model.js";
import Application from "../shared/application.model.js";
import JobAccessLog from "../shared/jobAccessLog.model.js";
import { getR2Client, isR2Configured } from "../../config/r2.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { notifyMatchingAlerts } from "../../utils/jobAlerts.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { assertUnderListingLimit } from "../../utils/planLimits.js";
import { getJobsEnabled } from "../finance/platformSettings.model.js";

const ATTACHMENTS_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;
const SIGNED_URL_TTL_SECONDS = 10 * 60;

// A job can be managed by the freelancer/employer who posted it, any other
// member of the same Company team, or an admin.
function isJobManager(job, user) {
  if (user.role === "super_admin") return true;
  if (job.employer.toString() === user._id.toString()) return true;
  if (job.company && user.company && job.company.toString() === user.company.toString()) return true;
  return false;
}

async function logAccess(req, job, action, attachmentName) {
  try {
    await JobAccessLog.create({
      job: job._id,
      user: req.user._id,
      action,
      attachmentName: attachmentName || "",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
    });
  } catch {
    // Best-effort — never block the request over an audit-log write failure.
  }
}

export const listJobs = asyncHandler(async (req, res) => {
  // Deliberately NOT gated by getJobsEnabled() here — this same endpoint is
  // reused by SearchResults, JobDetails' "related jobs", and existing
  // job_seeker accounts' dashboard widget, none of which should break just
  // because the public board's own nav link/route is switched off. The
  // toggle instead controls the /jobs, /jobs/:id routes and nav link
  // directly (see App.tsx, Navbar.tsx) via the public /settings/jobs-enabled read.
  const { search, type, category, isRemote, employer, excludeId, salaryMin, salaryMax, industryType, subIndustry, qualification, companyType } = req.query;

  const filter = { status: "open", visibility: { $ne: "invite_only" } };
  if (type) filter.type = String(type).includes(",") ? { $in: String(type).split(",") } : type;
  if (category) filter.category = category;
  if (isRemote === "true") filter.isRemote = true;
  if (search) filter.$text = { $search: search };
  if (employer) filter.employer = employer;
  if (excludeId) filter._id = { $ne: excludeId };
  // industryType is now a fixed naukri.com-style list (see INDUSTRY_TYPE_VALUES
  // in job.model.js), so this is an exact match, not free-text search.
  if (industryType) filter.industryType = String(industryType).includes(",") ? { $in: String(industryType).split(",") } : industryType;
  if (subIndustry) filter.subIndustry = String(subIndustry).includes(",") ? { $in: String(subIndustry).split(",") } : subIndustry;
  if (companyType) filter.companyType = String(companyType).includes(",") ? { $in: String(companyType).split(",") } : companyType;
  // Qualification is free text at posting time (see PostJob.tsx's
  // educationUG/educationPG) — matches against either field since a
  // candidate's degree could satisfy the UG or PG requirement.
  if (qualification) {
    const re = new RegExp(qualification, "i");
    filter.$or = [...(filter.$or ?? []), { educationUG: re }, { educationPG: re }];
  }
  // Powers the salary-range browse cards on JobList — a job "belongs" to a
  // range if its posted salaryMin falls inside it (mirrors how the range
  // buckets/counts are computed in getJobSalaryRangeCounts below).
  if (salaryMin || salaryMax) {
    filter.salaryMin = {};
    if (salaryMin) filter.salaryMin.$gte = Number(salaryMin);
    if (salaryMax) filter.salaryMin.$lte = Number(salaryMax);
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Job.find(filter)
      .populate("employer", "name avatar rating reviewCount")
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

// Powers the "Popular Job Categories" widget — real counts of currently open,
// publicly-listed jobs grouped by category, not a fabricated/static list.
export const getJobCategoryCounts = asyncHandler(async (req, res) => {
  const counts = await Job.aggregate([
    { $match: { status: "open", visibility: { $ne: "invite_only" } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: counts.map((c) => ({ category: c._id, count: c.count })) });
});

// Powers the "₹0-3 Lakhs / ₹3-6 Lakhs / ..." salary browse cards on JobList —
// real counts of currently open, publicly-listed jobs bucketed by their
// posted salaryMin, not a fabricated/static list. Unpaid/unposted-salary
// jobs (salaryMin 0) are excluded since they don't belong in any range.
const SALARY_RANGES = [
  { min: 0, max: 300000, label: "₹ 0-3 Lakhs" },
  { min: 300000, max: 600000, label: "₹ 3-6 Lakhs" },
  { min: 600000, max: 1000000, label: "₹ 6-10 Lakhs" },
  { min: 1000000, max: 1500000, label: "₹ 10-15 Lakhs" },
];

export const getJobSalaryRangeCounts = asyncHandler(async (req, res) => {
  const buckets = await Job.aggregate([
    { $match: { status: "open", visibility: { $ne: "invite_only" }, salaryMin: { $gt: 0 } } },
    {
      $bucket: {
        groupBy: "$salaryMin",
        boundaries: SALARY_RANGES.map((r) => r.min).concat(SALARY_RANGES[SALARY_RANGES.length - 1].max),
        default: "other",
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  const countByMin = new Map(buckets.filter((b) => b._id !== "other").map((b) => [b._id, b.count]));
  const data = SALARY_RANGES.map((r) => ({ min: r.min, max: r.max, label: r.label, count: countByMin.get(r.min) ?? 0 }));
  res.json({ success: true, data });
});

export const getMyJobs = asyncHandler(async (req, res) => {
  const filter = req.user.company ? { $or: [{ employer: req.user._id }, { company: req.user.company }] } : { employer: req.user._id };
  const items = await Job.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("employer", "name avatar email rating reviewCount")
    .populate("invitedFreelancers", "name avatar email");
  if (!job) throw new ApiError(404, "Job not found");

  const employerId = job.employer._id.toString();
  const isOwner = !!req.user && (employerId === req.user._id.toString() || req.user.role === "super_admin");
  const isInvited = !!req.user && job.invitedFreelancers.some((f) => (f._id ? f._id.toString() : f.toString()) === req.user._id.toString());

  // Invite-only jobs are indistinguishable from "doesn't exist" to anyone not
  // invited — a plain 403 would confirm the job's existence to an outsider.
  if (job.visibility === "invite_only" && !isOwner && !isInvited) {
    throw new ApiError(404, "Job not found");
  }

  if (!isOwner) {
    job.viewsCount += 1;
    await job.save();
    if (req.user) await logAccess(req, job, "viewed_details");
  }

  const ndaAccepted = isOwner || job.ndaAcceptances.some((a) => req.user && a.user.toString() === req.user._id.toString());
  const showFull = isOwner || !job.requiresNda || ndaAccepted;

  const data = job.toObject();
  data.ndaAccepted = ndaAccepted;
  if (!showFull) {
    data.description = "";
    data.responsibilities = "";
    data.requirements = "";
    data.attachments = [];
  }
  if (!isOwner) delete data.invitedFreelancers;

  res.json({ success: true, data });
});

export const getInvitedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ visibility: "invite_only", invitedFreelancers: req.user._id, status: "open" })
    .populate("employer", "name avatar rating reviewCount")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: jobs });
});

export const inviteFreelancer = asyncHandler(async (req, res) => {
  const { freelancerId } = req.body;
  if (!freelancerId) throw new ApiError(400, "freelancerId is required");

  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to invite freelancers to this job");
  }

  if (!job.invitedFreelancers.some((id) => id.toString() === freelancerId)) {
    job.invitedFreelancers.push(freelancerId);
    await job.save();
  }

  await notify(req.app, {
    user: freelancerId,
    type: "system",
    title: "You've been invited to a private project",
    message: `${req.user.name} invited you to view "${job.title}"${job.requiresNda ? " (NDA required)" : ""}.`,
    link: `/jobs/${job._id}`,
  });

  res.json({ success: true, data: job });
});

export const revokeInvite = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to manage invites for this job");
  }

  job.invitedFreelancers = job.invitedFreelancers.filter((id) => id.toString() !== req.params.freelancerId);
  await job.save();
  res.json({ success: true, data: job });
});

export const acceptNda = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (!job.requiresNda) throw new ApiError(400, "This project does not require an NDA");

  const already = job.ndaAcceptances.some((a) => a.user.toString() === req.user._id.toString());
  if (!already) {
    job.ndaAcceptances.push({ user: req.user._id, acceptedAt: new Date() });
    await job.save();
  }
  await logAccess(req, job, "accepted_nda");

  res.json({ success: true, data: { ndaAccepted: true } });
});

export const getAttachmentUrl = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  const isOwner = isJobManager(job, req.user);
  const isInvited = job.invitedFreelancers.some((id) => id.toString() === req.user._id.toString());
  if (job.visibility === "invite_only" && !isOwner && !isInvited) throw new ApiError(404, "Job not found");

  const ndaAccepted = isOwner || job.ndaAcceptances.some((a) => a.user.toString() === req.user._id.toString());
  if (job.requiresNda && !ndaAccepted) throw new ApiError(403, "Accept the NDA before accessing attachments");

  if (Date.now() - job.createdAt.getTime() > ATTACHMENTS_EXPIRE_MS) {
    throw new ApiError(410, "Attachments for this project have expired");
  }

  const attachment = job.attachments[parseInt(req.params.index, 10)];
  if (!attachment) throw new ApiError(404, "Attachment not found");

  if (!isR2Configured()) throw new ApiError(503, "File storage is not configured on this server yet.");

  const url = await getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: attachment.key }), {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });

  await logAccess(req, job, "viewed_attachment", attachment.name);

  res.json({ success: true, data: { url, name: attachment.name } });
});

export const getJobAccessLog = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to view this project's access log");
  }

  const logs = await JobAccessLog.find({ job: job._id }).populate("user", "name avatar").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: logs });
});

export const createJob = asyncHandler(async (req, res) => {
  if (!(await getJobsEnabled())) throw new ApiError(403, "Job postings are temporarily disabled");

  await assertUnderListingLimit(req.user, req.user.role, Job, { employer: req.user._id, status: "open" }, "active job posts");

  const job = await Job.create({ ...req.body, employer: req.user._id, company: req.user.company || undefined });
  notifyMatchingAlerts(req.app, job);
  res.status(201).json({ success: true, data: job });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to edit this job");
  }

  Object.assign(job, req.body);
  await job.save();
  res.json({ success: true, data: job });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to delete this job");
  }

  await job.deleteOne();
  await Application.deleteMany({ job: job._id });
  res.json({ success: true, message: "Job deleted" });
});

export const applyToJob = asyncHandler(async (req, res) => {
  if (!(await getJobsEnabled())) throw new ApiError(403, "Job applications are temporarily disabled");

  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "open") throw new ApiError(400, "This job is no longer accepting applications");
  if (job.visibility === "invite_only" && !job.invitedFreelancers.some((id) => id.toString() === req.user._id.toString())) {
    throw new ApiError(403, "This is a private project — you need an invitation to apply");
  }

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
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to view these applications");
  }

  const applications = await Application.find({ job: job._id })
    .populate("applicant", "name avatar email headline location")
    .sort({ createdAt: -1 });

  await Application.updateMany({ job: job._id, viewedAt: null }, { viewedAt: new Date() });

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

// Freelancer-side edit — only while the employer hasn't acted on it yet
// (status still "applied", whether or not they've viewed it). Once
// shortlisted/interview/hired/rejected/withdrawn, the proposal is locked so a
// freelancer can't change terms out from under a decision already in motion.
export const editApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate("job", "title employer");
  if (!application) throw new ApiError(404, "Application not found");
  if (application.applicant.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own proposals");
  }
  if (application.status !== "applied") {
    throw new ApiError(400, "This proposal can no longer be edited — the employer has already acted on it");
  }

  if (req.body.coverLetter !== undefined) application.coverLetter = req.body.coverLetter;
  if (req.body.proposedRate !== undefined) application.proposedRate = req.body.proposedRate;
  if (req.body.deliveryDays !== undefined) application.deliveryDays = req.body.deliveryDays;
  application.lastEditedAt = new Date();
  // A revised proposal is the applicant's response to any open negotiation
  // request — clear requestedAt (not the whole nested object: Mongoose
  // re-applies the sub-fields' own defaults on save/reload, so assigning
  // `undefined` to the object itself doesn't actually clear it — checking
  // negotiationRequest?.requestedAt everywhere is what "pending" means).
  if (application.negotiationRequest) application.negotiationRequest.requestedAt = undefined;
  await application.save();

  const job = application.job;
  if (job?.employer) {
    await notify(req.app, {
      user: job.employer,
      type: "job_application",
      title: "Proposal updated",
      message: `${req.user.name} updated their proposal for ${job.title}`,
      link: `/dashboard/employer/jobs/${job._id}/applicants`,
    });
  }

  res.json({ success: true, data: application });
});

// Employer asks the applicant to revise their proposedRate — puts the
// application back to "applied" so editApplication's own guard (only
// editable while "applied") allows the applicant to respond, same as any
// other still-open proposal.
export const requestRateChange = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate("job", "title employer company");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  if (!job || !isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to negotiate on this application");
  }
  if (!["applied", "shortlisted"].includes(application.status)) {
    throw new ApiError(400, "You can only request a rate change while this proposal is still under review");
  }

  application.status = "applied";
  application.negotiationRequest = {
    message: req.body.message || "",
    suggestedRate: req.body.suggestedRate || undefined,
    requestedAt: new Date(),
  };
  await application.save();

  await notify(req.app, {
    user: application.applicant,
    type: "job_application",
    title: "Rate change requested",
    message: `${req.user.name} asked you to revise your proposal for ${job.title}`,
    link: "/dashboard/influencer/campaign-invites",
  });

  res.json({ success: true, data: application });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("job")
    .populate("applicant", "name");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to update this application");
  }

  application.status = req.body.status;

  // Generating a default contract the moment someone is hired gives both sides
  // something concrete to sign before any money moves — see signContract below.
  if (req.body.status === "hired" && !application.contract?.text) {
    const rateLine = application.proposedRate
      ? `Agreed amount: ₹${application.proposedRate}${application.deliveryDays ? ` · Delivery: ${application.deliveryDays} day(s)` : ""}.`
      : "Amount to be agreed via milestones or hourly logged time.";
    application.contract = {
      text:
        `This agreement is between ${req.user.name} (Client) and ${application.applicant.name} (Freelancer) ` +
        `for the work "${job.title}" on GrowHive. ${rateLine} Payment is held in escrow and released to the ` +
        `freelancer once the client approves the delivered work, per GrowHive's standard escrow terms. ` +
        `Both parties must sign below before any payment can be made against this agreement.`,
    };
  }

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

export const scheduleInterview = asyncHandler(async (req, res) => {
  const { scheduledAt, mode, meetingLink, location, note } = req.body;
  if (!scheduledAt) throw new ApiError(400, "scheduledAt is required");

  const application = await Application.findById(req.params.id).populate("job").populate("applicant", "name");
  if (!application) throw new ApiError(404, "Application not found");

  const job = application.job;
  if (!isJobManager(job, req.user)) {
    throw new ApiError(403, "You do not have permission to schedule an interview for this application");
  }

  application.status = "interview";
  application.interview = {
    scheduledAt: new Date(scheduledAt),
    mode: mode || "video",
    meetingLink: meetingLink || "",
    location: location || "",
    note: note || "",
    status: "scheduled",
  };
  await application.save();

  await notify(req.app, {
    user: application.applicant,
    type: "application_status",
    title: "Interview scheduled",
    message: `${req.user.name} scheduled an interview for "${job.title}" on ${new Date(scheduledAt).toLocaleString()}`,
    link: "/dashboard/job-seeker",
  });

  res.json({ success: true, data: application });
});

export const confirmInterview = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate("job");
  if (!application) throw new ApiError(404, "Application not found");
  if (application.applicant.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only confirm your own interview");
  }
  if (!application.interview?.scheduledAt) throw new ApiError(400, "No interview has been scheduled for this application");

  application.interview.status = "confirmed";
  await application.save();

  const job = application.job;
  await notify(req.app, {
    user: job.employer,
    type: "system",
    title: "Interview confirmed",
    message: `${req.user.name} confirmed the interview for "${job.title}"`,
    link: `/dashboard/employer/jobs/${job._id}/applicants`,
  });

  res.json({ success: true, data: application });
});

export const signContract = asyncHandler(async (req, res) => {
  const { signatureName } = req.body;
  if (!signatureName?.trim()) throw new ApiError(400, "Type your full name to sign");

  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");
  if (!application.contract?.text) throw new ApiError(400, "No contract has been generated for this application yet");

  const job = application.job;
  const employerId = typeof job.employer === "object" ? job.employer._id : job.employer;
  const isEmployerSide = isJobManager(job, req.user);
  const isApplicant = application.applicant.toString() === req.user._id.toString();
  if (!isEmployerSide && !isApplicant) throw new ApiError(403, "You are not a party to this contract");

  if (isEmployerSide) {
    application.contract.employerSignedAt = new Date();
    application.contract.employerSignatureName = signatureName.trim();
  } else {
    application.contract.freelancerSignedAt = new Date();
    application.contract.freelancerSignatureName = signatureName.trim();
  }
  await application.save();

  const otherParty = isEmployerSide ? application.applicant : employerId;
  await notify(req.app, {
    user: otherParty,
    type: "system",
    title: "Contract signed",
    message: `${signatureName.trim()} signed the contract for "${job.title}". ${
      application.contract.employerSignedAt && application.contract.freelancerSignedAt
        ? "Both parties have now signed — payment can proceed."
        : "Your signature is still needed before payment can proceed."
    }`,
    link: "/dashboard/messages",
  });

  res.json({ success: true, data: application });
});

export const reportJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  const userId = req.user._id.toString();
  const alreadyReported = job.reports.some((r) => r.user.toString() === userId);

  if (!alreadyReported) {
    job.reports.push({ user: req.user._id, reason: req.body.reason || "" });
    await job.save();
  }

  res.json({ success: true, message: "Thanks — this job has been reported to the moderation team." });
});

export const getMyJobAnalytics = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employer: req.user._id }).select("title viewsCount applicationsCount status");
  const jobIds = jobs.map((j) => j._id);

  const statusAgg = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = statusAgg.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  const totalViews = jobs.reduce((sum, j) => sum + j.viewsCount, 0);
  const totalApplications = jobs.reduce((sum, j) => sum + j.applicationsCount, 0);

  res.json({
    success: true,
    data: { totalViews, totalApplications, byStatus, jobs },
  });
});

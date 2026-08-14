import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Project from "./project.model.js";
import Application from "../shared/application.model.js";
import User from "../shared/user.model.js";
import JobAccessLog from "../shared/jobAccessLog.model.js";
import { getR2Client, isR2Configured } from "../../config/r2.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";
import { notifyMatchingAlerts } from "../../utils/jobAlerts.js";
import { assertUnderListingLimit } from "../../utils/planLimits.js";

const ATTACHMENTS_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;
const SIGNED_URL_TTL_SECONDS = 10 * 60;

// A project can be managed by the client who posted it, any other member of
// the same Company team, or an admin — mirrors jobController's isJobManager.
function isProjectManager(project, user) {
  if (user.role === "super_admin") return true;
  if (project.employer.toString() === user._id.toString()) return true;
  if (project.company && user.company && project.company.toString() === user.company.toString()) return true;
  return false;
}

async function logAccess(req, project, action, attachmentName) {
  try {
    await JobAccessLog.create({
      job: project._id,
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

export const listProjects = asyncHandler(async (req, res) => {
  const { search, type, category, subCategory, isRemote } = req.query;

  const filter = { status: "open", visibility: { $ne: "invite_only" } };
  if (type) filter.type = String(type).includes(",") ? { $in: String(type).split(",") } : type;
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (isRemote === "true") filter.isRemote = true;
  if (search) filter.$text = { $search: search };

  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Project.find(filter)
      .populate("employer", "name avatar")
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

export const getMyProjects = asyncHandler(async (req, res) => {
  const filter = req.user.company
    ? { $or: [{ employer: req.user._id }, { company: req.user.company }] }
    : { employer: req.user._id };
  const items = await Project.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("employer", "name avatar email")
    .populate("invitedFreelancers", "name avatar email");
  if (!project) throw new ApiError(404, "Project not found");

  const employerId = project.employer._id.toString();
  const isOwner = !!req.user && (employerId === req.user._id.toString() || req.user.role === "super_admin");
  const isInvited =
    !!req.user && project.invitedFreelancers.some((f) => (f._id ? f._id.toString() : f.toString()) === req.user._id.toString());

  if (project.visibility === "invite_only" && !isOwner && !isInvited) {
    throw new ApiError(404, "Project not found");
  }

  if (!isOwner) {
    project.viewsCount += 1;
    await project.save();
    if (req.user) await logAccess(req, project, "viewed_details");
  }

  const ndaAccepted = isOwner || project.ndaAcceptances.some((a) => req.user && a.user.toString() === req.user._id.toString());
  const showFull = isOwner || !project.requiresNda || ndaAccepted;

  const data = project.toObject();
  data.ndaAccepted = ndaAccepted;
  if (!showFull) {
    data.description = "";
    data.requirements = "";
    data.attachments = [];
  }
  if (!isOwner) delete data.invitedFreelancers;

  res.json({ success: true, data });
});

export const getInvitedProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ visibility: "invite_only", invitedFreelancers: req.user._id, status: "open" })
    .populate("employer", "name avatar")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: projects });
});

export const inviteFreelancerToProject = asyncHandler(async (req, res) => {
  const { freelancerId } = req.body;
  if (!freelancerId) throw new ApiError(400, "freelancerId is required");

  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectManager(project, req.user)) {
    throw new ApiError(403, "You do not have permission to invite freelancers to this project");
  }

  if (!project.invitedFreelancers.some((id) => id.toString() === freelancerId)) {
    project.invitedFreelancers.push(freelancerId);
    await project.save();
  }

  await notify(req.app, {
    user: freelancerId,
    type: "system",
    title: "You've been invited to a private project",
    message: `${req.user.name} invited you to view "${project.title}"${project.requiresNda ? " (NDA required)" : ""}.`,
    link: `/projects/${project._id}`,
  });

  res.json({ success: true, data: project });
});

export const revokeProjectInvite = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectManager(project, req.user)) {
    throw new ApiError(403, "You do not have permission to manage invites for this project");
  }

  project.invitedFreelancers = project.invitedFreelancers.filter((id) => id.toString() !== req.params.freelancerId);
  await project.save();
  res.json({ success: true, data: project });
});

export const acceptProjectNda = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.requiresNda) throw new ApiError(400, "This project does not require an NDA");

  const already = project.ndaAcceptances.some((a) => a.user.toString() === req.user._id.toString());
  if (!already) {
    project.ndaAcceptances.push({ user: req.user._id, acceptedAt: new Date() });
    await project.save();
  }
  await logAccess(req, project, "accepted_nda");

  res.json({ success: true, data: { ndaAccepted: true } });
});

export const getProjectAttachmentUrl = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  const isOwner = isProjectManager(project, req.user);
  const isInvited = project.invitedFreelancers.some((id) => id.toString() === req.user._id.toString());
  if (project.visibility === "invite_only" && !isOwner && !isInvited) throw new ApiError(404, "Project not found");

  const ndaAccepted = isOwner || project.ndaAcceptances.some((a) => a.user.toString() === req.user._id.toString());
  if (project.requiresNda && !ndaAccepted) throw new ApiError(403, "Accept the NDA before accessing attachments");

  if (Date.now() - project.createdAt.getTime() > ATTACHMENTS_EXPIRE_MS) {
    throw new ApiError(410, "Attachments for this project have expired");
  }

  const attachment = project.attachments[parseInt(req.params.index, 10)];
  if (!attachment) throw new ApiError(404, "Attachment not found");

  if (!isR2Configured()) throw new ApiError(503, "File storage is not configured on this server yet.");

  const url = await getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: attachment.key }), {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });

  await logAccess(req, project, "viewed_attachment", attachment.name);

  res.json({ success: true, data: { url, name: attachment.name } });
});

export const getProjectAccessLog = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectManager(project, req.user)) {
    throw new ApiError(403, "You do not have permission to view this project's access log");
  }

  const logs = await JobAccessLog.find({ job: project._id }).populate("user", "name avatar").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: logs });
});

export const createProject = asyncHandler(async (req, res) => {
  await assertUnderListingLimit(req.user, "client", Project, { employer: req.user._id, status: "open" }, "active project posts");

  const project = await Project.create({ ...req.body, employer: req.user._id, company: req.user.company || undefined });
  notifyMatchingAlerts(req.app, project, "projects");
  res.status(201).json({ success: true, data: project });
});

// Lets a client hire a specific freelancer straight from their profile,
// skipping the usual "post a project → freelancer applies" flow — mirrors
// Upwork's "Direct Contracts". Creates an invite-only Project (so it never
// shows up in public listings) and an already-"hired" Application in one
// step, with the same auto-generated contract as a normal hire.
export const directHire = asyncHandler(async (req, res) => {
  const { scopeTitle, scopeDescription, amount, deliveryDays } = req.body;
  if (!scopeTitle?.trim()) throw new ApiError(400, "Scope title is required");
  if (!scopeDescription?.trim()) throw new ApiError(400, "Scope description is required");
  if (!amount || amount <= 0) throw new ApiError(400, "Agreed amount must be greater than 0");

  const freelancer = await User.findOne({ _id: req.params.freelancerId, role: "freelancer" });
  if (!freelancer) throw new ApiError(404, "Freelancer not found");
  if (freelancer._id.toString() === req.user._id.toString()) throw new ApiError(400, "You cannot hire yourself");

  const project = await Project.create({
    employer: req.user._id,
    company: req.user.company || undefined,
    title: scopeTitle.trim(),
    companyName: req.user.companyName || req.user.name,
    description: scopeDescription.trim(),
    type: "freelance",
    location: "Remote",
    isRemote: true,
    visibility: "invite_only",
    invitedFreelancers: [freelancer._id],
  });

  const rateLine = `Agreed amount: ₹${amount}${deliveryDays ? ` · Delivery: ${deliveryDays} day(s)` : ""}.`;
  const application = await Application.create({
    onModel: "Project",
    job: project._id,
    applicant: freelancer._id,
    proposedRate: amount,
    deliveryDays: deliveryDays || 0,
    status: "hired",
    contract: {
      text:
        `This agreement is between ${req.user.name} (Client) and ${freelancer.name} (Freelancer) ` +
        `for the work "${scopeTitle.trim()}" on GrowHive. Scope: ${scopeDescription.trim()} ${rateLine} Payment is held in ` +
        `escrow and released to the freelancer once the client approves the delivered work, per GrowHive's standard ` +
        `escrow terms. Both parties must sign below before any payment can be made against this agreement.`,
    },
  });

  await notify(req.app, {
    user: freelancer._id,
    type: "application_status",
    title: "You've been directly hired!",
    message: `${req.user.name} hired you directly for "${scopeTitle.trim()}" — review and sign the contract to get started.`,
    link: "/dashboard/freelancer/applications",
  });

  res.status(201).json({ success: true, data: application });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectManager(project, req.user)) {
    throw new ApiError(403, "You do not have permission to edit this project");
  }

  Object.assign(project, req.body);
  await project.save();
  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectManager(project, req.user)) {
    throw new ApiError(403, "You do not have permission to delete this project");
  }

  await project.deleteOne();
  await Application.deleteMany({ job: project._id, onModel: "Project" });
  res.json({ success: true, message: "Project deleted" });
});

export const applyToProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (project.status !== "open") throw new ApiError(400, "This project is no longer accepting proposals");
  if (project.visibility === "invite_only" && !project.invitedFreelancers.some((id) => id.toString() === req.user._id.toString())) {
    throw new ApiError(403, "This is a private project — you need an invitation to apply");
  }

  const existing = await Application.findOne({ job: project._id, applicant: req.user._id });
  if (existing) throw new ApiError(409, "You have already sent a proposal for this project");

  const application = await Application.create({
    onModel: "Project",
    job: project._id,
    applicant: req.user._id,
    coverLetter: req.body.coverLetter,
    resumeUrl: req.body.resumeUrl,
    proposedRate: req.body.proposedRate || 0,
    deliveryDays: req.body.deliveryDays || 0,
  });

  project.applicationsCount += 1;
  await project.save();

  await notify(req.app, {
    user: project.employer,
    type: "job_application",
    title: "New proposal received",
    message: `${req.user.name} sent a proposal for ${project.title}`,
    link: `/dashboard/client/projects/${project._id}/applicants`,
  });

  res.status(201).json({ success: true, data: application });
});

export const getProjectApplications = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectManager(project, req.user)) {
    throw new ApiError(403, "You do not have permission to view these proposals");
  }

  const applications = await Application.find({ job: project._id, onModel: "Project" })
    .populate("applicant", "name avatar email headline location")
    .sort({ createdAt: -1 });

  await Application.updateMany({ job: project._id, onModel: "Project", viewedAt: null }, { viewedAt: new Date() });

  res.json({ success: true, data: applications });
});

export const getMyProjectAnalytics = asyncHandler(async (req, res) => {
  const projects = await Project.find({ employer: req.user._id }).select("title viewsCount applicationsCount status");
  const projectIds = projects.map((p) => p._id);

  const statusAgg = await Application.aggregate([
    { $match: { job: { $in: projectIds }, onModel: "Project" } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = statusAgg.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  const totalViews = projects.reduce((sum, p) => sum + p.viewsCount, 0);
  const totalApplications = projects.reduce((sum, p) => sum + p.applicationsCount, 0);

  res.json({
    success: true,
    data: { totalViews, totalApplications, byStatus, projects },
  });
});

import Milestone from "../models/Milestone.js";
import Application from "../models/Application.js";
import { ApiError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { notify } from "../utils/notify.js";

async function getOwnedApplication(applicationId, user) {
  const application = await Application.findById(applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const employerId = typeof application.job.employer === "object" ? application.job.employer._id : application.job.employer;
  if (employerId.toString() !== user._id.toString() && user.role !== "super_admin") {
    throw new ApiError(403, "Only the job poster can manage milestones for this application");
  }
  return application;
}

export const createMilestones = asyncHandler(async (req, res) => {
  const application = await getOwnedApplication(req.params.applicationId, req.user);
  if (application.status !== "hired") throw new ApiError(400, "You can only set milestones for a hired freelancer");

  const existing = await Milestone.countDocuments({ application: application._id });
  if (existing > 0) throw new ApiError(400, "Milestones already exist for this application. Delete them first to redefine.");

  const { milestones } = req.body;
  if (!Array.isArray(milestones) || milestones.length === 0) throw new ApiError(400, "Add at least one milestone");

  const cleaned = milestones.map((m, i) => ({
    application: application._id,
    title: String(m.title || "").trim(),
    amount: Number(m.amount),
    order: i,
  }));

  if (cleaned.some((m) => !m.title || !m.amount || m.amount <= 0)) {
    throw new ApiError(400, "Every milestone needs a title and an amount greater than 0");
  }

  const total = cleaned.reduce((sum, m) => sum + m.amount, 0);
  if (application.proposedRate && total > application.proposedRate) {
    throw new ApiError(400, `Milestone amounts (₹${total}) can't exceed the agreed bid of ₹${application.proposedRate}`);
  }

  const created = await Milestone.insertMany(cleaned);

  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;
  await notify(req.app, {
    user: applicantId,
    type: "system",
    title: "Milestones set for your project",
    message: `${created.length} milestone(s) totalling ₹${total} were added for "${application.job.title}".`,
    link: "/dashboard/freelancer/applications",
  });

  res.status(201).json({ success: true, data: created });
});

export const getMilestones = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const employerId = typeof application.job.employer === "object" ? application.job.employer._id : application.job.employer;
  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;
  const isParty = [employerId.toString(), applicantId.toString()].includes(req.user._id.toString());
  if (!isParty && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to view these milestones");
  }

  const milestones = await Milestone.find({ application: application._id }).sort({ order: 1 });
  res.json({ success: true, data: milestones });
});

export const deleteMilestones = asyncHandler(async (req, res) => {
  const application = await getOwnedApplication(req.params.applicationId, req.user);

  const funded = await Milestone.countDocuments({ application: application._id, status: { $ne: "pending" } });
  if (funded > 0) throw new ApiError(400, "Can't delete milestones once one of them has been funded");

  await Milestone.deleteMany({ application: application._id });
  res.json({ success: true, message: "Milestones deleted" });
});

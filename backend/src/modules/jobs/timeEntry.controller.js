import TimeEntry from "./timeEntry.model.js";
import Application from "../shared/application.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

async function getHiredApplicationAsFreelancer(applicationId, user) {
  const application = await Application.findById(applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");
  if (application.applicant.toString() !== user._id.toString()) {
    throw new ApiError(403, "Only the hired freelancer can log time against this application");
  }
  if (application.status !== "hired") throw new ApiError(400, "You can only log time for a hired application");
  return application;
}

export const addTimeEntry = asyncHandler(async (req, res) => {
  const application = await getHiredApplicationAsFreelancer(req.params.applicationId, req.user);

  const { date, hours, description } = req.body;

  const entry = await TimeEntry.create({
    application: application._id,
    freelancer: req.user._id,
    date,
    hours,
    description: description || "",
  });

  res.status(201).json({ success: true, data: entry });
});

export const getTimeEntries = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("job");
  if (!application) throw new ApiError(404, "Application not found");

  const employerId = typeof application.job.employer === "object" ? application.job.employer._id : application.job.employer;
  const applicantId = typeof application.applicant === "object" ? application.applicant._id : application.applicant;
  const isParty = [employerId.toString(), applicantId.toString()].includes(req.user._id.toString());
  if (!isParty && req.user.role !== "super_admin") {
    throw new ApiError(403, "You do not have permission to view this work diary");
  }

  const entries = await TimeEntry.find({ application: application._id }).sort({ date: -1 });
  res.json({ success: true, data: entries });
});

export const deleteTimeEntry = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) throw new ApiError(404, "Time entry not found");
  if (entry.freelancer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own time entries");
  }
  if (entry.billed) throw new ApiError(400, "Can't delete a time entry that's already been billed");

  await entry.deleteOne();
  res.json({ success: true, message: "Time entry deleted" });
});

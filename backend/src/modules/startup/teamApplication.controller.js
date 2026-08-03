import TeamApplication from "./teamApplication.model.js";
import Startup from "./startup.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";
import { assertStartupFounder } from "./founderAuth.js";

export const createTeamApplication = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");

  const { roleTitle, roleType, isCustomRole, bio, experience, skills, resumeUrl } = req.body;
  if (!roleTitle || !bio || !experience) {
    throw new ApiError(400, "Role, bio and experience are required");
  }

  const application = await TeamApplication.create({
    startup: startup._id,
    applicant: req.user._id,
    roleTitle,
    roleType,
    isCustomRole: !!isCustomRole,
    bio,
    experience,
    skills,
    resumeUrl,
  });

  await notify(req.app, {
    user: startup.founder,
    type: "system",
    title: "New team application",
    message: `${req.user.name} applied to join as ${roleTitle}`,
    link: `/startups/${startup._id}`,
  });

  res.status(201).json({ success: true, data: application });
});

export const listTeamApplications = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.startupId);
  if (!startup) throw new ApiError(404, "Startup not found");
  assertStartupFounder(startup, req.user, "Only the founder can view team applications");

  const applications = await TeamApplication.find({ startup: startup._id })
    .populate("applicant", "name avatar email headline")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: applications });
});

export const updateTeamApplicationStatus = asyncHandler(async (req, res) => {
  const application = await TeamApplication.findById(req.params.id).populate("startup");
  if (!application) throw new ApiError(404, "Application not found");

  const startup = application.startup;
  assertStartupFounder(startup, req.user, "You do not have permission to update this application");

  application.status = req.body.status;
  await application.save();

  await notify(req.app, {
    user: application.applicant,
    type: "system",
    title: "Team application update",
    message: `Your application for "${application.roleTitle}" is now "${req.body.status}"`,
    link: `/startups/${startup._id}`,
  });

  res.json({ success: true, data: application });
});

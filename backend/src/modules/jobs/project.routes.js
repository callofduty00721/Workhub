import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import {
  listProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  applyToProject,
  getProjectApplications,
  getMyProjectAnalytics,
  getInvitedProjects,
  inviteFreelancerToProject,
  revokeProjectInvite,
  acceptProjectNda,
  getProjectAttachmentUrl,
  getProjectAccessLog,
} from "./project.controller.js";
import { protect, optionalAuth, authorize } from "../../middleware/auth.js";
import { requireVerifiedForAction } from "../../middleware/roleAuth.js";
import { validate } from "../../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
  inviteFreelancerToProjectSchema,
  applyToProjectSchema,
  listProjectsQuerySchema,
} from "./project.validation.js";

const router = Router();
router.param("freelancerId", validateObjectId);
router.param("id", validateObjectId);

router.get("/", validate(listProjectsQuerySchema, "query"), listProjects);
router.get("/mine", protect, authorize("client", "super_admin"), getMyProjects);
router.get("/invited", protect, authorize("freelancer", "super_admin"), getInvitedProjects);
router.get("/analytics/mine", protect, authorize("client", "super_admin"), getMyProjectAnalytics);
router.get("/:id", optionalAuth, getProjectById);
router.post("/", protect, authorize("client", "super_admin"), requireVerifiedForAction("post_project"), validate(createProjectSchema), createProject);
router.put("/:id", protect, validate(updateProjectSchema), updateProject);
router.delete("/:id", protect, deleteProject);

router.post("/:id/apply", protect, authorize("freelancer", "super_admin"), validate(applyToProjectSchema), applyToProject);
router.get("/:id/applications", protect, authorize("client", "super_admin"), getProjectApplications);

router.put("/:id/invite", protect, authorize("client", "super_admin"), validate(inviteFreelancerToProjectSchema), inviteFreelancerToProject);
router.delete("/:id/invite/:freelancerId", protect, authorize("client", "super_admin"), revokeProjectInvite);
router.post("/:id/accept-nda", protect, acceptProjectNda);
router.get("/:id/attachments/:index/signed-url", protect, getProjectAttachmentUrl);
router.get("/:id/access-log", protect, authorize("client", "super_admin"), getProjectAccessLog);

export default router;

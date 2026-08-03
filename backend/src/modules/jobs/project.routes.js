import { Router } from "express";
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

const router = Router();

router.get("/", listProjects);
router.get("/mine", protect, authorize("client", "super_admin"), getMyProjects);
router.get("/invited", protect, authorize("freelancer", "super_admin"), getInvitedProjects);
router.get("/analytics/mine", protect, authorize("client", "super_admin"), getMyProjectAnalytics);
router.get("/:id", optionalAuth, getProjectById);
router.post("/", protect, authorize("client", "super_admin"), createProject);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

router.post("/:id/apply", protect, authorize("freelancer", "super_admin"), applyToProject);
router.get("/:id/applications", protect, authorize("client", "super_admin"), getProjectApplications);

router.put("/:id/invite", protect, authorize("client", "super_admin"), inviteFreelancerToProject);
router.delete("/:id/invite/:freelancerId", protect, authorize("client", "super_admin"), revokeProjectInvite);
router.post("/:id/accept-nda", protect, acceptProjectNda);
router.get("/:id/attachments/:index/signed-url", protect, getProjectAttachmentUrl);
router.get("/:id/access-log", protect, authorize("client", "super_admin"), getProjectAccessLog);

export default router;

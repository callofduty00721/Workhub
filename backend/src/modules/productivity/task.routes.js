import { Router } from "express";
import { listMyTasks, createTask, toggleTask, deleteTask } from "./task.controller.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

// Personal to-do/calendar entries — not role-gated, since any logged-in user
// can keep their own reminders regardless of role.
router.use(protect);

router.get("/mine", listMyTasks);
router.post("/", createTask);
router.put("/:id/toggle", toggleTask);
router.delete("/:id", deleteTask);

export default router;

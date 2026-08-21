import { Router } from "express";
import { validateObjectId } from "../../middleware/validateObjectId.js";
import { listMyTasks, createTask, toggleTask, deleteTask } from "./task.controller.js";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listMyTasksQuerySchema, createTaskSchema } from "./task.validation.js";

const router = Router();
router.param("id", validateObjectId);

// Personal to-do/calendar entries — not role-gated, since any logged-in user
// can keep their own reminders regardless of role.
router.use(protect);

router.get("/mine", validate(listMyTasksQuerySchema, "query"), listMyTasks);
router.post("/", validate(createTaskSchema), createTask);
router.put("/:id/toggle", toggleTask);
router.delete("/:id", deleteTask);

export default router;

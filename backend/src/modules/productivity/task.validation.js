import { z } from "zod";
import { TASK_TYPE_VALUES } from "./task.model.js";

export const listMyTasksQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    dueAt: z.coerce.date(),
    type: z.enum(TASK_TYPE_VALUES).optional(),
  })
  .strict();

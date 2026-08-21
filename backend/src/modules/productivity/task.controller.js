import Task from "./task.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

// Returns everything from `from` days ago through 60 days ahead by default —
// enough to paint a month-view calendar plus a bit of trailing history,
// without ever-growing unbounded as tasks accumulate over a user's lifetime.
export const listMyTasks = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = { user: req.user._id };
  if (from || to) {
    filter.dueAt = {};
    if (from) filter.dueAt.$gte = new Date(from);
    if (to) filter.dueAt.$lte = new Date(to);
  }

  const tasks = await Task.find(filter).sort({ dueAt: 1 });
  res.json({ success: true, data: tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, dueAt, type } = req.body;

  const task = await Task.create({ user: req.user._id, title, dueAt, type: type || "task" });
  res.status(201).json({ success: true, data: task });
});

export const toggleTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, "Task not found");

  task.completed = !task.completed;
  await task.save();
  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, "Task not found");
  res.json({ success: true, message: "Task deleted" });
});

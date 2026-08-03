import mongoose from "mongoose";

const TASK_TYPES = ["task", "meeting", "call", "deadline"];

// A personal to-do/calendar entry — deliberately not tied to any Job/Project,
// since these are self-added reminders (client calls, delivery dates the
// freelancer set for themselves) rather than platform-generated events.
const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: TASK_TYPES, default: "task" },
    dueAt: { type: Date, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, dueAt: 1 });

export const TASK_TYPE_VALUES = TASK_TYPES;
export default mongoose.model("Task", taskSchema);

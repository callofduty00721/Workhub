import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },
    message: { type: String, default: "" },
    preferredTime: { type: Date },
    status: { type: String, enum: ["requested", "confirmed", "completed", "cancelled"], default: "requested" },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);

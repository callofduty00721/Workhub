import mongoose from "mongoose";

// A founder pitching a specific startup of theirs to a specific investor —
// the high-risk counterpart of an investor marking "interested" on a startup
// (see Startup.interested / toggleInterest). Gated by requireVerifiedForAction
// ("pitch_investor") in pitchRoutes.js, since it's the money-adjacent action
// the founder-verification flow exists for.
const pitchSchema = new mongoose.Schema(
  {
    startup: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    founder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    investor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: "", maxlength: 2000 },
    status: { type: String, enum: ["sent", "viewed"], default: "sent" },
  },
  { timestamps: true }
);

pitchSchema.index({ investor: 1, createdAt: -1 });
pitchSchema.index({ founder: 1, createdAt: -1 });

export default mongoose.model("Pitch", pitchSchema);

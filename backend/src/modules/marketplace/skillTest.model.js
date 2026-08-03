import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: { validator: (v) => v.length >= 2 && v.length <= 6, message: "A question needs 2-6 options" },
    },
    correctIndex: { type: Number, required: true },
  },
  { _id: false }
);

const skillTestSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    questions: {
      type: [questionSchema],
      validate: { validator: (v) => v.length >= 3, message: "A skill test needs at least 3 questions" },
    },
    passingScorePercent: { type: Number, default: 70, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("SkillTest", skillTestSchema);

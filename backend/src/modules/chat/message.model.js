import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // A message must have text and/or attachments — enforced in the controller,
    // not here, since either one alone is a valid message.
    text: { type: String, default: "" },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, default: "" },
        type: { type: String, enum: ["image", "video", "file"], required: true },
        size: { type: Number, default: 0 },
      },
    ],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);

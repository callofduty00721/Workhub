import Conversation from "./conversation.model.js";
import Message from "./message.model.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { notify } from "../../utils/notify.js";

// Per-attachment count is capped in chat.validation.js's sendMessageSchema
// (kept in sync with that file's .max(5)); this one's a cross-field sum, so
// it stays a controller-side check.
const MAX_COMBINED_ATTACHMENT_BYTES = 256 * 1024 * 1024;

export const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("participants", "name avatar role")
    .sort({ lastMessageAt: -1 });

  res.json({ success: true, data: conversations });
});

export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId === req.user._id.toString()) throw new ApiError(400, "Cannot start a conversation with yourself");

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
  }).populate("participants", "name avatar role");

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.user._id, userId] });
    conversation = await conversation.populate("participants", "name avatar role");
  }

  res.json({ success: true, data: conversation });
});

export const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new ApiError(403, "You are not part of this conversation");
  }

  const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });

  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({ success: true, data: messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new ApiError(403, "You are not part of this conversation");
  }

  const { text, attachments = [] } = req.body;
  const combinedBytes = attachments.reduce((sum, a) => sum + (a.size || 0), 0);
  if (combinedBytes > MAX_COMBINED_ATTACHMENT_BYTES) {
    throw new ApiError(400, "Combined attachments must be under 256MB");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text?.trim() || "",
    attachments,
    readBy: [req.user._id],
  });

  const firstAttachment = attachments[0];
  const preview =
    text?.trim() ||
    (attachments.length > 1
      ? `📎 ${attachments.length} files`
      : firstAttachment?.type === "image"
        ? "📷 Photo"
        : firstAttachment?.type === "video"
          ? "🎥 Video"
          : `📎 ${firstAttachment?.name || "File"}`);
  conversation.lastMessage = preview;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const io = req.app.get("io");
  if (io) {
    conversation.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("chat:message", {
        conversationId: conversation._id.toString(),
        message,
      });
    });
  }

  const recipientId = conversation.participants.find((p) => p.toString() !== req.user._id.toString());
  if (recipientId) {
    await notify(req.app, {
      user: recipientId,
      type: "new_message",
      title: "New message",
      message: `${req.user.name}: ${preview.slice(0, 80)}`,
      link: `/dashboard/messages?c=${conversation._id}`,
    });
  }

  res.status(201).json({ success: true, data: message });
});

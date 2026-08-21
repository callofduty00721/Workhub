import Announcement from "../shared/announcement.model.js";
import Notification from "../shared/notification.model.js";
import User from "../shared/user.model.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { parsePagination, paginationMeta } from "../../utils/pagination.js";

// Bulk write (Notification.insertMany) + a per-recipient socket emit loop —
// there's no broadcast room, so real-time delivery to whoever's currently
// connected still goes through the same per-user `user:<id>` room notify()
// uses elsewhere, just called once per id instead of once total. Never
// emails (see notify.js's EMAIL_EXCLUDED_TYPES) — a mass email from one
// click needs its own deliberate decision later, not a side effect of this.
export const sendAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetRole } = req.body;

  const userFilter = targetRole ? { role: targetRole } : { role: { $nin: ["super_admin", "staff"] } };
  const recipientIds = await User.find(userFilter).distinct("_id");

  if (recipientIds.length > 0) {
    const now = new Date();
    await Notification.insertMany(
      recipientIds.map((id) => ({ user: id, type: "announcement", title, message, createdAt: now, updatedAt: now }))
    );

    const io = req.app.get("io");
    if (io) {
      for (const id of recipientIds) {
        io.to(`user:${id}`).emit("notification:new", { type: "announcement", title, message });
      }
    }
  }

  const announcement = await Announcement.create({
    title,
    message,
    targetRole: targetRole || null,
    sentBy: req.user._id,
    recipientCount: recipientIds.length,
  });

  res.status(201).json({ success: true, data: announcement });
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const { pageNum, limitNum, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Announcement.find({}).populate("sentBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Announcement.countDocuments({}),
  ]);

  res.json({ success: true, data: items, pagination: paginationMeta(pageNum, limitNum, total) });
});

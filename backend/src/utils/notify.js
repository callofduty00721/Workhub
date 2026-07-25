import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail, isEmailConfigured } from "./email.js";

// Low-signal, high-volume social notifications (follows/interest toggles) are
// deliberately excluded from email — everything else (messages, application
// status, delivery/escrow events, reviews, sessions) is important enough to
// land in the user's inbox, not just the in-app bell.
const EMAIL_EXCLUDED_TYPES = new Set(["startup_follow", "startup_interest"]);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Creates a persisted notification and, if a Socket.io instance is registered
 * on the Express app, pushes it live to the recipient's `user:<id>` room.
 * Also emails the recipient for anything above the low-signal social types,
 * as long as SMTP is configured — best-effort, never blocks or throws.
 */
export async function notify(app, { user, type, title, message = "", link = "" }) {
  const notification = await Notification.create({ user, type, title, message, link });

  const io = app?.get?.("io");
  if (io) {
    io.to(`user:${user}`).emit("notification:new", notification);
  }

  if (isEmailConfigured() && !EMAIL_EXCLUDED_TYPES.has(type)) {
    sendNotificationEmail(user, title, message, link).catch(() => {});
  }

  return notification;
}

async function sendNotificationEmail(userId, title, message, link) {
  const recipient = await User.findById(userId).select("name email emailNotificationsEnabled");
  if (!recipient?.email || !recipient.emailNotificationsEnabled) return;

  const url = link ? `${FRONTEND_URL}${link.startsWith("/") ? "" : "/"}${link}` : FRONTEND_URL;
  const html = `<p>Hi ${recipient.name},</p><p>${title}</p>${message ? `<p>${message}</p>` : ""}<p><a href="${url}">View on MahaHub</a></p>`;

  await sendEmail({ to: recipient.email, subject: title, html });
}

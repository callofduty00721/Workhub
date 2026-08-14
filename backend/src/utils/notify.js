import Notification from "../modules/shared/notification.model.js";
import User from "../modules/shared/user.model.js";
import { sendEmail, isEmailConfigured } from "./email.js";

// Only genuinely time-sensitive or money-related events warrant an email —
// everything else still lands in the in-app bell (and the socket push),
// just not the inbox too. "system" stays email-eligible since it's the
// catch-all for payments/KYC/disputes/withdrawals — the highest-stakes
// events in the app. new_message is excluded specifically because it's by
// far the highest-volume type; emailing every single chat message is the
// fastest way to make someone turn email notifications off entirely.
const EMAIL_EXCLUDED_TYPES = new Set([
  "startup_follow",
  "startup_interest",
  "startup_pitch",
  "job_application",
  "new_message",
  "session_request",
  "roster_invite",
  "review_received",
]);

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
  const html = `<p>Hi ${recipient.name},</p><p>${title}</p>${message ? `<p>${message}</p>` : ""}<p><a href="${url}">View on GrowHive</a></p>`;

  await sendEmail({ to: recipient.email, subject: title, html });
}

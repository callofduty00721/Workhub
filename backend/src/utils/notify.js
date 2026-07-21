import Notification from "../models/Notification.js";

/**
 * Creates a persisted notification and, if a Socket.io instance is registered
 * on the Express app, pushes it live to the recipient's `user:<id>` room.
 */
export async function notify(app, { user, type, title, message = "", link = "" }) {
  const notification = await Notification.create({ user, type, title, message, link });

  const io = app?.get?.("io");
  if (io) {
    io.to(`user:${user}`).emit("notification:new", notification);
  }

  return notification;
}

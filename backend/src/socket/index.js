import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/tokens.js";
import User from "../models/User.js";

// In-memory presence: userId -> number of open sockets (a user can have multiple tabs).
const onlineUsers = new Map();

export const isUserOnline = (userId) => (onlineUsers.get(String(userId)) ?? 0) > 0;

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    onlineUsers.set(socket.userId, (onlineUsers.get(socket.userId) ?? 0) + 1);

    // Actual message persistence happens over REST (POST /api/chat/conversations/:id/messages),
    // which emits "chat:message" to each participant's `user:<id>` room. Sockets only handle
    // ephemeral signals (room membership for typing indicators) that don't need to be stored.
    socket.on("chat:join", (conversationId) => socket.join(conversationId));
    socket.on("chat:typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("chat:typing", { userId: socket.userId, isTyping });
    });

    socket.on("disconnect", async () => {
      socket.leave(`user:${socket.userId}`);
      const remaining = (onlineUsers.get(socket.userId) ?? 1) - 1;
      if (remaining > 0) {
        onlineUsers.set(socket.userId, remaining);
        return;
      }
      onlineUsers.delete(socket.userId);
      try {
        await User.updateOne({ _id: socket.userId }, { lastActiveAt: new Date() });
      } catch {
        // best-effort — presence is not critical path
      }
    });
  });

  return io;
};

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/api/axios";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Same split as axios.ts's API_BASE — relative in local dev (proxied by
    // Vite), the backend's full URL in production (Vercel/Railway are
    // different origins, so there's no same-origin "/" to connect to).
    socket = io(import.meta.env.VITE_API_URL || "/", {
      path: "/socket.io",
      autoConnect: false,
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}

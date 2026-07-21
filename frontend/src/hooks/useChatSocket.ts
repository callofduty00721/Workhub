import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import type { Message } from "@/types";

export function useChatSocket(onMessage: (payload: { conversationId: string; message: Message }) => void) {
  const { user } = useAuth();
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();
    const handler = (payload: { conversationId: string; message: Message }) => handlerRef.current(payload);
    socket.on("chat:message", handler);

    return () => {
      socket.off("chat:message", handler);
      disconnectSocket();
    };
  }, [user]);

  return getSocket;
}

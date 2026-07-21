import { api } from "./axios";
import type { Conversation, Message } from "@/types";

export const chatApi = {
  conversations: () => api.get<{ success: boolean; data: Conversation[] }>("/chat/conversations").then((r) => r.data.data),

  getOrCreateConversation: (userId: string) =>
    api.post<{ success: boolean; data: Conversation }>("/chat/conversations", { userId }).then((r) => r.data.data),

  messages: (conversationId: string) =>
    api.get<{ success: boolean; data: Message[] }>(`/chat/conversations/${conversationId}/messages`).then((r) => r.data.data),

  sendMessage: (conversationId: string, text: string) =>
    api.post<{ success: boolean; data: Message }>(`/chat/conversations/${conversationId}/messages`, { text }).then((r) => r.data.data),
};

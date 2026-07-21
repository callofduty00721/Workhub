import { api } from "./axios";
import type { AppNotification } from "@/types";

export const notificationApi = {
  list: () =>
    api.get<{ success: boolean; data: AppNotification[]; unreadCount: number }>("/notifications").then((r) => r.data),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () => api.put("/notifications/read-all").then((r) => r.data),

  remove: (id: string) => api.delete(`/notifications/${id}`).then((r) => r.data),
};

import { api } from "./axios";
import type { Review } from "@/types";

export const reviewApi = {
  list: (targetType: Review["targetType"], targetId: string) =>
    api.get<{ success: boolean; data: Review[] }>("/reviews", { params: { targetType, targetId } }).then((r) => r.data.data),

  create: (payload: { targetType: Review["targetType"]; targetId: string; rating: number; comment?: string }) =>
    api.post<{ success: boolean; data: Review }>("/reviews", payload).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/reviews/${id}`).then((r) => r.data),
};

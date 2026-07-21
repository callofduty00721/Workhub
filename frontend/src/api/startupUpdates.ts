import { api } from "./axios";
import type { StartupUpdateItem } from "@/types";

export const startupUpdateApi = {
  list: (startupId: string) =>
    api.get<{ success: boolean; data: StartupUpdateItem[] }>(`/startups/${startupId}/updates`).then((r) => r.data.data),

  create: (startupId: string, payload: { title: string; description?: string; category?: string; image?: string }) =>
    api
      .post<{ success: boolean; data: StartupUpdateItem }>(`/startups/${startupId}/updates`, payload)
      .then((r) => r.data.data),

  toggleLike: (updateId: string) =>
    api
      .put<{ success: boolean; liked: boolean; likeCount: number }>(`/updates/${updateId}/like`)
      .then((r) => r.data),
};

import { api } from "./axios";
import type { JobAlert } from "@/types";

export const alertApi = {
  create: (payload: { keywords: string[]; remoteOnly?: boolean }) =>
    api.post<{ success: boolean; data: JobAlert }>("/alerts", payload).then((r) => r.data.data),

  mine: () => api.get<{ success: boolean; data: JobAlert[] }>("/alerts/mine").then((r) => r.data.data),

  remove: (id: string) => api.delete(`/alerts/${id}`).then((r) => r.data),
};

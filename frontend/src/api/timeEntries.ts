import { api } from "./axios";
import type { TimeEntry } from "@/types";

export const timeEntryApi = {
  add: (applicationId: string, payload: { date: string; hours: number; description?: string }) =>
    api.post<{ success: boolean; data: TimeEntry }>(`/applications/${applicationId}/time-entries`, payload).then((r) => r.data.data),

  list: (applicationId: string) =>
    api.get<{ success: boolean; data: TimeEntry[] }>(`/applications/${applicationId}/time-entries`).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/applications/time-entries/${id}`).then((r) => r.data),
};

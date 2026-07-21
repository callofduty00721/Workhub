import { api } from "./axios";
import type { MentorSession, MentorSummary, Paginated, SessionStatus } from "@/types";

export interface MentorFilters {
  search?: string;
  expertise?: string;
  page?: number;
  limit?: number;
}

export const mentorApi = {
  list: (filters: MentorFilters = {}) => api.get<Paginated<MentorSummary>>("/mentors", { params: filters }).then((r) => r.data),

  getProfile: (id: string) => api.get<{ success: boolean; data: MentorSummary }>(`/mentors/${id}`).then((r) => r.data.data),

  requestSession: (mentorId: string, payload: { topic: string; message?: string; preferredTime?: string }) =>
    api.post<{ success: boolean; data: MentorSession }>(`/mentors/${mentorId}/sessions`, payload).then((r) => r.data.data),

  mySessions: () => api.get<{ success: boolean; data: MentorSession[] }>("/mentors/mine/sessions").then((r) => r.data.data),

  myRequests: () => api.get<{ success: boolean; data: MentorSession[] }>("/mentors/mine/requests").then((r) => r.data.data),

  updateSessionStatus: (sessionId: string, status: SessionStatus) =>
    api.put<{ success: boolean; data: MentorSession }>(`/mentors/sessions/${sessionId}/status`, { status }).then((r) => r.data.data),
};

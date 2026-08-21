import { api } from "./axios";
import type { MentorCategory, MentorSession, MentorSessionFormat, MentorSummary, Paginated, SessionStatus } from "@/types";

export type MentorSort = "rating" | "newest" | "experience";

export interface MentorFilters {
  search?: string;
  expertise?: string;
  category?: MentorCategory;
  location?: string;
  verified?: boolean;
  language?: string;
  sessionFormat?: MentorSessionFormat;
  minPrice?: number;
  maxPrice?: number;
  sort?: MentorSort;
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

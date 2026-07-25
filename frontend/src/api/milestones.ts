import { api } from "./axios";
import type { ProjectMilestone } from "@/types";

export const milestoneApi = {
  create: (applicationId: string, milestones: { title: string; amount: number }[]) =>
    api
      .post<{ success: boolean; data: ProjectMilestone[] }>(`/applications/${applicationId}/milestones`, { milestones })
      .then((r) => r.data.data),

  list: (applicationId: string) =>
    api.get<{ success: boolean; data: ProjectMilestone[] }>(`/applications/${applicationId}/milestones`).then((r) => r.data.data),

  remove: (applicationId: string) => api.delete(`/applications/${applicationId}/milestones`).then((r) => r.data),
};

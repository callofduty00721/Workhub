import { api } from "./axios";
import type { OpenRoleType, TeamApplication, TeamApplicationStatus } from "@/types";

export interface CreateTeamApplicationPayload {
  roleTitle: string;
  roleType: OpenRoleType;
  isCustomRole?: boolean;
  bio: string;
  experience: string;
  skills: string[];
  resumeUrl?: string;
}

export const teamApplicationApi = {
  create: (startupId: string, payload: CreateTeamApplicationPayload) =>
    api
      .post<{ success: boolean; data: TeamApplication }>(`/startups/${startupId}/team-applications`, payload)
      .then((r) => r.data.data),

  list: (startupId: string) =>
    api
      .get<{ success: boolean; data: TeamApplication[] }>(`/startups/${startupId}/team-applications`)
      .then((r) => r.data.data),

  updateStatus: (applicationId: string, status: TeamApplicationStatus) =>
    api
      .put<{ success: boolean; data: TeamApplication }>(`/team-applications/${applicationId}/status`, { status })
      .then((r) => r.data.data),
};

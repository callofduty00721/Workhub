import { api } from "./axios";
import type { RosterInvite, RosterInfluencer, RosterStatus } from "@/types";

export const talentRosterApi = {
  invite: (influencerId: string, message?: string) =>
    api.post<{ success: boolean; message: string }>("/talent-roster/invite", { influencerId, message }).then((r) => r.data),

  respond: (id: string, status: Extract<RosterStatus, "accepted" | "declined">) =>
    api.post<{ success: boolean; data: RosterInvite }>(`/talent-roster/${id}/respond`, { status }).then((r) => r.data.data),

  mine: () => api.get<{ success: boolean; data: RosterInvite[] }>("/talent-roster/mine").then((r) => r.data.data),

  pending: () => api.get<{ success: boolean; data: RosterInvite[] }>("/talent-roster/pending").then((r) => r.data.data),

  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`/talent-roster/${id}`).then((r) => r.data),

  publicRoster: (partnerId: string) =>
    api.get<{ success: boolean; data: RosterInfluencer[] }>(`/talent-roster/public/${partnerId}`).then((r) => r.data.data),
};

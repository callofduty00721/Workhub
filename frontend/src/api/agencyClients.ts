import { api } from "./axios";
import type { AgencyClientRow, AgencyClientStatus } from "@/types";

export const agencyClientApi = {
  invite: (agencyId: string, budget?: number, message?: string) =>
    api.post<{ success: boolean; message: string }>("/agency-clients/invite", { agencyId, budget, message }).then((r) => r.data),

  respond: (id: string, status: Extract<AgencyClientStatus, "accepted" | "declined">) =>
    api.post<{ success: boolean; data: AgencyClientRow }>(`/agency-clients/${id}/respond`, { status }).then((r) => r.data.data),

  // Brand's own view — agencies managing them.
  mine: () => api.get<{ success: boolean; data: AgencyClientRow[] }>("/agency-clients/mine").then((r) => r.data.data),

  // Agency's own view — brands they manage.
  managed: () => api.get<{ success: boolean; data: AgencyClientRow[] }>("/agency-clients/managed").then((r) => r.data.data),

  pending: () => api.get<{ success: boolean; data: AgencyClientRow[] }>("/agency-clients/pending").then((r) => r.data.data),

  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`/agency-clients/${id}`).then((r) => r.data),
};

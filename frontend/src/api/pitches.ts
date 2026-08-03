import { api } from "./axios";

export interface Pitch {
  _id: string;
  startup: { _id: string; name: string; logo?: string; industry?: string };
  founder: { _id: string; name: string; avatar?: string };
  investor: { _id: string; name: string; avatar?: string };
  message: string;
  status: "sent" | "viewed";
  createdAt: string;
}

export const pitchApi = {
  send: (startupId: string, investorId: string, message?: string) =>
    api.post<{ success: boolean; data: Pitch }>("/pitches", { startupId, investorId, message }).then((r) => r.data.data),

  sent: () => api.get<{ success: boolean; data: Pitch[] }>("/pitches/sent").then((r) => r.data.data),

  received: () => api.get<{ success: boolean; data: Pitch[] }>("/pitches/received").then((r) => r.data.data),

  markViewed: (id: string) => api.put<{ success: boolean; data: Pitch }>(`/pitches/${id}/viewed`).then((r) => r.data.data),
};

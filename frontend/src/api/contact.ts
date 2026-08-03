import { api } from "./axios";

export interface ContactMessage {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export const contactApi = {
  send: (payload: ContactMessage) => api.post<{ success: boolean; message: string }>("/contact", payload).then((r) => r.data),
};

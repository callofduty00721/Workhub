import { api } from "./axios";

export interface CompanyMember {
  user: { _id: string; name: string; avatar?: string; email?: string; headline?: string };
  role: "admin" | "member";
  joinedAt: string;
}

export interface Company {
  _id: string;
  name: string;
  owner: string;
  members: CompanyMember[];
  createdAt: string;
}

export const companyApi = {
  mine: () => api.get<{ success: boolean; data: Company | null }>("/companies/mine").then((r) => r.data.data),

  create: (name: string) => api.post<{ success: boolean; data: Company }>("/companies", { name }).then((r) => r.data.data),

  invite: (email: string) => api.post<{ success: boolean; data: Company }>("/companies/invite", { email }).then((r) => r.data.data),

  removeMember: (userId: string) => api.delete<{ success: boolean; data: Company }>(`/companies/members/${userId}`).then((r) => r.data.data),
};

import { api } from "./axios";
import type { User } from "@/types";

export const userApi = {
  updateMe: (payload: Partial<User>) => api.put<{ success: boolean; user: User }>("/users/me", payload).then((r) => r.data.user),
};

import { api } from "./axios";
import type { User, UserRole } from "@/types";

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
}

export const authApi = {
  register: (payload: { name: string; email: string; password: string; phone?: string; role?: UserRole; referralCode?: string }) =>
    api.post<AuthResponse>("/auth/register", payload).then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  googleLogin: (idToken: string) => api.post<AuthResponse>("/auth/google", { idToken }).then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  me: () => api.get<{ success: boolean; user: User }>("/auth/me").then((r) => r.data),

  refresh: () => api.post<AuthResponse>("/auth/refresh").then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post<{ success: boolean; message: string }>(`/auth/reset-password/${token}`, { password }).then((r) => r.data),

  verifyEmail: (token: string) => api.get<{ success: boolean; message: string }>(`/auth/verify-email/${token}`).then((r) => r.data),

  resendVerification: () => api.post<{ success: boolean; message: string }>("/auth/resend-verification").then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api
      .put<{ success: boolean; message: string; accessToken: string }>("/auth/change-password", { currentPassword, newPassword })
      .then((r) => r.data),

  deactivateAccount: (password?: string) =>
    api.post<{ success: boolean; message: string }>("/auth/deactivate", { password }).then((r) => r.data),
};

import { api } from "./axios";
import type { Plan, PlanRole } from "@/types";

// Public reads (Pricing page, checkout) — admin editing lives in adminApi
// (see admin.ts: adminApi.plans / adminApi.updatePlan).
export const plansApi = {
  all: () => api.get<{ success: boolean; data: Plan[] }>("/plans").then((r) => r.data.data),

  forRole: (role: PlanRole) => api.get<{ success: boolean; data: Plan[] }>("/plans", { params: { role } }).then((r) => r.data.data),
};

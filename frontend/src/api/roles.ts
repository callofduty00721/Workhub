import { api } from "./axios";
import type { FounderStage, RoleCategory, UserRole, VerificationStatus } from "@/types";

export interface RoleSummary {
  id: string;
  role: UserRole;
  roles: UserRole[];
  selectedCategory: RoleCategory | null;
  founderStage: FounderStage;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationNote: string;
}

export const rolesApi = {
  selectCategory: (category: RoleCategory) =>
    api.post<{ success: boolean; user: RoleSummary }>("/roles/select-category", { category }).then((r) => r.data),

  addRoles: (roles: UserRole[]) =>
    api.post<{ success: boolean; user: RoleSummary }>("/roles/add-roles", { roles }).then((r) => r.data),

  switchRole: (role: UserRole) =>
    api.post<{ success: boolean; user: RoleSummary }>("/roles/switch", { role }).then((r) => r.data),

  requestVerification: (documents: { url: string; name: string }[]) =>
    api.post<{ success: boolean; user: RoleSummary }>("/roles/verification", { documents }).then((r) => r.data),
};

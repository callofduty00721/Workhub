import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Plus } from "lucide-react";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_ROLES, ROLE_LABELS, dashboardPathForRole } from "@/lib/roles";
import type { UserRole } from "@/types";

// The "Switch role" list only renders when there's more than one role to
// switch between, but "Add another role" always shows (as long as the user
// hasn't already added every role in their category) — this is the only
// entry point in the app back to /onboarding/roles after initial signup.
export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState<UserRole | null>(null);

  // super_admin isn't part of any role category and can't hold other roles
  // alongside it — an admin promoted from an existing account keeps their old
  // `roles`/`selectedCategory` (see adminController.updateUserRole), which
  // would otherwise leak a stale "Add another role"/"Switch role" menu here.
  if (!user || user.role === "super_admin") return null;

  const canAddMoreRoles =
    !!user.selectedCategory && (user.roles?.length ?? 0) < CATEGORY_ROLES[user.selectedCategory].length;

  const handleSwitch = async (role: UserRole) => {
    if (role === user.role || switching) return;
    setSwitching(role);
    try {
      await switchRole(role);
      navigate(dashboardPathForRole(role));
    } finally {
      setSwitching(null);
    }
  };

  if (!user.roles || user.roles.length < 2) {
    if (!canAddMoreRoles) return null;
    return (
      <>
        <DropdownMenuItem onClick={() => navigate("/onboarding/roles")}>
          <Plus className="h-3.5 w-3.5" />
          <span>Add another role</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    );
  }

  return (
    <>
      <DropdownMenuLabel>Switch role</DropdownMenuLabel>
      {user.roles.map((role) => (
        <DropdownMenuItem key={role} onClick={() => handleSwitch(role)} disabled={!!switching}>
          {switching === role ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className={role === user.role ? "h-3.5 w-3.5 opacity-100" : "h-3.5 w-3.5 opacity-0"} />}
          <span>{ROLE_LABELS[role]}</span>
        </DropdownMenuItem>
      ))}
      {canAddMoreRoles && (
        <DropdownMenuItem onClick={() => navigate("/onboarding/roles")}>
          <Plus className="h-3.5 w-3.5" />
          <span>Add another role</span>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
    </>
  );
}

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rolesApi } from "@/api/roles";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_ROLES, ROLE_LABELS, dashboardPathForRole } from "@/lib/roles";
import type { UserRole } from "@/types";

// Multi-select within whatever category was picked in SelectCategory.tsx —
// e.g. under "talent" a user can check Freelancer + Influencer together.
export default function SelectRoles() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [checked, setChecked] = useState<Set<UserRole>>(new Set(user?.roles ?? []));
  const [submitting, setSubmitting] = useState(false);

  if (!user?.selectedCategory) {
    return <Navigate to="/onboarding/category" replace />;
  }

  const roleOptions = CATEGORY_ROLES[user.selectedCategory];

  const toggle = (role: UserRole) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const handleContinue = async () => {
    if (checked.size === 0) return;
    setSubmitting(true);
    try {
      const res = await rolesApi.addRoles(Array.from(checked));
      await refreshUser();
      navigate(dashboardPathForRole(res.user.role));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold text-foreground">Pick your role(s)</h1>
      <p className="mt-1 text-sm text-muted-foreground">Select as many as apply — you can switch between them anytime from the navbar.</p>

      <div className="mt-6 space-y-2">
        {roleOptions.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-colors",
              checked.has(role) ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
            )}
          >
            <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                checked.has(role) ? "border-primary bg-primary text-primary-foreground" : "border-border"
              )}
            >
              {checked.has(role) ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>

      <Button variant="gradient" size="lg" className="mt-6 w-full" disabled={checked.size === 0 || submitting} onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}

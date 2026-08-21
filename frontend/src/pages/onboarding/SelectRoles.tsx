import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rolesApi } from "@/api/roles";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, dashboardPathForRole } from "@/lib/roles";
import { CATEGORY_STYLES } from "@/lib/categoryUI";
import { OnboardingStepper } from "./OnboardingStepper";
import type { UserRole } from "@/types";

// Multi-select within whatever category was picked in SelectCategory.tsx —
// e.g. under "talent" a user can check Freelancer + Influencer together.
export default function SelectRoles() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [checked, setChecked] = useState<Set<UserRole>>(new Set(user?.roles ?? []));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user?.selectedCategory) {
    return <Navigate to="/onboarding/category" replace />;
  }

  const roleOptions = CATEGORY_ROLES[user.selectedCategory];
  const style = CATEGORY_STYLES[user.selectedCategory];

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
    setError(null);
    try {
      const res = await rolesApi.addRoles(Array.from(checked));
      await refreshUser();
      navigate(dashboardPathForRole(res.user.role));
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || "Something went wrong. Please try again." : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <OnboardingStepper step={2} />
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Pick your role(s)</h1>
      <p className="mt-1 text-sm text-muted-foreground">Select as many as apply — you can switch between them anytime from the navbar.</p>

      <div className="mt-6 space-y-2.5">
        {roleOptions.map((role) => {
          const active = checked.has(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => toggle(role)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-150",
                active ? cn(style.border, style.tint) : "border-border bg-card hover:border-foreground/15 hover:bg-accent/40"
              )}
            >
              <div>
                <p className="font-medium text-foreground">{ROLE_LABELS[role]}</p>
                <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-white transition-colors",
                  active ? cn(style.border, "bg-gradient-to-br", style.gradient) : "border-border"
                )}
              >
                {active && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/onboarding/category")}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          &larr; Back
        </button>
        <Button
          className={cn("flex-1 bg-gradient-to-r text-white shadow-md transition-opacity hover:opacity-90", style.gradient)}
          size="lg"
          disabled={checked.size === 0 || submitting}
          onClick={handleContinue}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}

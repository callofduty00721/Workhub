import { useState } from "react";
import { Rocket, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { rolesApi } from "@/api/roles";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_LABELS, CATEGORY_ROLES, ROLE_LABELS, dashboardPathForRole } from "@/lib/roles";
import type { RoleCategory, UserRole } from "@/types";

const CATEGORY_OPTIONS: { value: RoleCategory; desc: string; icon: typeof Rocket }[] = [
  { value: "talent", desc: "Find gigs, jobs, or grow as a creator", icon: Briefcase },
  { value: "hiring", desc: "Hire freelancers or full-time employees", icon: Building2 },
  { value: "startup", desc: "Build, invest in, or support startups", icon: Rocket },
];

// The same two-step choice as the /onboarding pages (pick a category, then a
// role within it), collapsed into one dialog so it can be triggered inline —
// from a reminder banner, or right when a roleless user hits a role-gated
// action — without navigating away from wherever they were.
export function RolePickerModal({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (role: UserRole) => void;
}) {
  const { refreshUser } = useAuth();
  const [category, setCategory] = useState<RoleCategory | null>(null);
  const [checked, setChecked] = useState<Set<UserRole>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory(null);
    setChecked(new Set());
  };

  const toggleRole = (role: UserRole) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!category || checked.size === 0) return;
    setSubmitting(true);
    try {
      await rolesApi.selectCategory(category);
      const res = await rolesApi.addRoles(Array.from(checked));
      await refreshUser();
      onOpenChange(false);
      reset();
      onComplete?.(res.user.role);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>What brings you to MahaHub?</DialogTitle>
          <DialogDescription>
            {category ? "Pick as many roles as apply — you can switch between them anytime." : "Choose one — you'll pick specific roles next."}
          </DialogDescription>
        </DialogHeader>

        {!category ? (
          <div className="space-y-2.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className="flex w-full items-center gap-3.5 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <opt.icon className="h-5.5 w-5.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[opt.value]}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full pt-1 text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Skip for now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {CATEGORY_ROLES[category].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                    checked.has(role) ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{ROLE_LABELS[role]}</span>
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

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCategory(null)}>
                Back
              </Button>
              <Button variant="gradient" className="flex-1" disabled={checked.size === 0 || submitting} onClick={handleConfirm}>
                Continue
              </Button>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Skip for now
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Convenience for callers that just want "go to whatever the role landed on"
// after the modal closes, mirroring the onboarding pages' own redirect.
export function roleDashboardPath(role: UserRole) {
  return dashboardPathForRole(role);
}

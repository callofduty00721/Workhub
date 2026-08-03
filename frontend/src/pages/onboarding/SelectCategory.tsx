import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rolesApi } from "@/api/roles";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_LABELS } from "@/lib/roles";
import type { RoleCategory } from "@/types";

const CATEGORY_OPTIONS: { value: RoleCategory; desc: string; icon: typeof Rocket }[] = [
  { value: "talent", desc: "Find gigs, jobs, or grow as a creator", icon: Briefcase },
  { value: "hiring", desc: "Hire freelancers or full-time employees", icon: Building2 },
  { value: "startup", desc: "Build, invest in, or support startups", icon: Rocket },
];

// A user picks exactly one category here; SelectRoles.tsx (next step) then
// lets them add any number of roles from within it. Roles from a different
// category are never mixed — picking a new one here clears any roles already
// added under the old category (enforced server-side too, see roleController).
export default function SelectCategory() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [selected, setSelected] = useState<RoleCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await rolesApi.selectCategory(selected);
      await refreshUser();
      navigate("/onboarding/roles");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold text-foreground">What brings you to MahaHub?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose one — you'll pick specific roles next.</p>

      <div className="mt-6 space-y-3">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={cn(
              "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
              selected === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
            )}
          >
            <opt.icon className={cn("h-6 w-6 flex-shrink-0", selected === opt.value ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="font-semibold text-foreground">{CATEGORY_LABELS[opt.value]}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <Button variant="gradient" size="lg" className="mt-6 w-full" disabled={!selected || submitting} onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}

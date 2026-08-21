import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rolesApi } from "@/api/roles";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_LABELS } from "@/lib/roles";
import { CATEGORY_OPTIONS, CATEGORY_STYLES } from "@/lib/categoryUI";
import { OnboardingStepper } from "./OnboardingStepper";
import type { RoleCategory } from "@/types";

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
      <OnboardingStepper step={1} />
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">What brings you to GrowHive?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose one — you'll pick specific roles next.</p>

      <div className="mt-6 space-y-3">
        {CATEGORY_OPTIONS.map((opt) => {
          const style = CATEGORY_STYLES[opt.value];
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                "relative flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                active ? cn(style.border, style.tint, "ring-2", style.ring, style.glow) : "border-border bg-card hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
              )}
            >
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors", active ? style.iconBg : "bg-muted")}>
                <opt.icon className={cn("h-5 w-5", active ? style.iconColor : "text-muted-foreground")} />
              </span>
              <div>
                <p className="font-semibold text-foreground">{CATEGORY_LABELS[opt.value]}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              {active && (
                <motion.span
                  layoutId="select-category-check"
                  className={cn("absolute right-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br text-white", style.gradient)}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      <Button variant="gradient" size="lg" className="mt-6 w-full" disabled={!selected || submitting} onClick={handleContinue}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Continue
      </Button>
    </div>
  );
}

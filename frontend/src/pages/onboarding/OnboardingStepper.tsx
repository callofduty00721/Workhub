import { cn } from "@/lib/utils";

const STEPS = ["Category", "Roles"] as const;

// Two-step progress indicator shared by SelectCategory.tsx and
// SelectRoles.tsx (the "add another role" flow reachable from the navbar).
export function OnboardingStepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const index = (i + 1) as 1 | 2;
        const done = index < step;
        const active = index === step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                  done ? "bg-success text-success-foreground" : active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {index}
              </span>
              <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

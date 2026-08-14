import type { LucideIcon } from "lucide-react";

// Compact icon+value+label cell used in the info-dense grids on the
// freelancer/gig/startup cards (e.g. "★ 4.9 RATING").
export function InfoCell({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{value}</p>
        <p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground/80">{label}</p>
      </div>
    </div>
  );
}

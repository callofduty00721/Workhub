import { cn } from "@/lib/utils";

// Marks cards/profiles created by backend/scripts/seed/seedDemoContent.js.
// The platform has zero real users yet, so seeded content needs to be
// visually distinguishable from a genuine listing rather than presented as
// if real — render only when the item's own `isDemo` field is true, never
// as a styling default.
export function DemoBadge({ className }: { className?: string }) {
  return (
    <div className={cn("absolute right-0 top-0 z-10 h-20 w-20 overflow-hidden rounded-tr-[inherit]", className)}>
      <span className="absolute right-[-34px] top-[15px] w-[120px] rotate-45 bg-red-600 py-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
        Demo
      </span>
    </div>
  );
}

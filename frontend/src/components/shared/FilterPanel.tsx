import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Shared building blocks for the left-column filter sidebars across the
// Freelance hub's tabs (Freelancers/Gigs/Projects) — each tab has its own
// filter fields, but they all render as the same labeled-block-of-selects
// layout inside a sticky card.
//
// On mobile this stacks above the results grid, so a fully-expanded panel
// (7+ fields) would push every card below the fold — it starts collapsed
// there, with the header itself as the toggle. From `lg:` up it's the
// permanently-visible sidebar next to the grid, so it's always expanded and
// the toggle button is hidden (`lg:hidden` on the chevron).
//
// `variant="dark"` is opt-in — only the Freelancers page's premium redesign
// passes it; Influencers/Projects/Gigs keep the original light card
// untouched since this component is shared with all of them.
export function FilterSidebarShell({
  title,
  subtitle,
  children,
  variant = "default",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  variant?: "default" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const dark = variant === "dark";

  return (
    <aside
      className={cn(
        "h-fit shrink-0 rounded-2xl border p-5 lg:sticky lg:top-24",
        dark ? "border-white/10 bg-[#0A0A0A]" : "border-neutral-200 bg-white"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left lg:pointer-events-none"
      >
        <div>
          <p className={cn("text-sm font-bold", dark ? "text-white" : "text-neutral-900")}>{title}</p>
          <p className={cn("text-xs", dark ? "text-[#A1A1AA]" : "text-neutral-400")}>{subtitle}</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform lg:hidden", dark ? "text-[#A1A1AA]" : "text-neutral-400", open && "rotate-180")}
        />
      </button>
      <div className={cn("space-y-5 pt-5 lg:block", open ? "block" : "hidden")}>{children}</div>
    </aside>
  );
}

export function FilterBlock({ label, children, variant = "default" }: { label: string; children: React.ReactNode; variant?: "default" | "dark" }) {
  return (
    <div className="space-y-1.5">
      <p className={cn("text-xs font-medium", variant === "dark" ? "text-[#A1A1AA]" : "text-neutral-500")}>{label}</p>
      {children}
    </div>
  );
}

export function FullSelect({
  value,
  onChange,
  placeholder,
  children,
  variant = "default",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  variant?: "default" | "dark";
}) {
  const dark = variant === "dark";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-9 w-full rounded-lg text-[13px]",
          dark ? "border-white/10 bg-white/5 text-white [&>svg]:text-white/40" : "border-neutral-200 text-neutral-700"
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={dark ? "border-white/10 bg-[#0D0D0D] text-white" : undefined}>{children}</SelectContent>
    </Select>
  );
}

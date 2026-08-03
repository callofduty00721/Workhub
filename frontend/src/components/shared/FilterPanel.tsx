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
export function FilterSidebarShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="h-fit shrink-0 rounded-2xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left lg:pointer-events-none"
      >
        <div>
          <p className="text-sm font-bold text-neutral-900">{title}</p>
          <p className="text-xs text-neutral-400">{subtitle}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform lg:hidden", open && "rotate-180")} />
      </button>
      <div className={cn("space-y-5 pt-5 lg:block", open ? "block" : "hidden")}>{children}</div>
    </aside>
  );
}

export function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      {children}
    </div>
  );
}

export function FullSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full rounded-lg border-neutral-200 text-[13px] text-neutral-700">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

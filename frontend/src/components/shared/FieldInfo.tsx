import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Small round info icon shown next to a field label — hover/focus reveals a
// short tooltip explaining what to put in that field. Pure CSS (group-hover),
// no extra dependency, since only @radix-ui/react-tooltip was missing for a
// "real" tooltip primitive and this doesn't need its full feature set.
export function FieldInfo({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        tabIndex={0}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground/70 hover:text-primary focus:text-primary focus:outline-none"
        aria-label={text}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] leading-snug text-popover-foreground opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

// Drop-in replacement for <Label> that appends a FieldInfo icon after the
// text — use wherever a field needs both a label and inline guidance.
export function FieldLabel({ children, info, htmlFor }: { children: React.ReactNode; info: string; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
      {children}
      <FieldInfo text={info} />
    </Label>
  );
}

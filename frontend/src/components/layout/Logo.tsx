import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-glow">
        <span className="text-base font-bold text-white">M</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-foreground">MahaHub</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Connect · Build · Grow</span>
      </span>
    </Link>
  );
}

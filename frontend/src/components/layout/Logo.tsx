import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Navbar/Footer always sit on a dark (bg-black) surface regardless of page
// theme, so "Grow" defaults to white. AuthShell's left column is a light
// surface — pass variant="light" there so "Grow" stays readable instead of
// rendering white-on-white.
export function Logo({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" } = {}) {
  return (
    <Link
      to="/"
      className={cn(
        "flex items-center gap-0.5 text-2xl font-extrabold tracking-tight select-none",
        className
      )}
      aria-label="GrowHive home"
    >
      <span className={variant === "light" ? "text-black" : "text-white"}>Grow</span>
      <span className="bg-gradient-to-b from-[#E8FF25] to-[#22C55E] bg-clip-text text-transparent">
        Hive
      </span>
    </Link>
  );
}

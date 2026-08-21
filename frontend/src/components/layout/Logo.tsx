import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
      <span className={variant === "light" ? "text-[#111111]" : "text-white"}>Grow</span>
      <span className={variant === "light" ? "text-[#3F6212]" : "text-[#B6FF00]"}>Hive</span>
    </Link>
  );
}

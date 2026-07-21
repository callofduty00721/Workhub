import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "lg";
}) {
  const dimension = size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(!onChange && "cursor-default")}
        >
          <Star className={cn(dimension, star <= value ? "fill-warning text-warning" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}

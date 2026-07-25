import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// A lightweight horizontal, scroll-snapping strip with optional prev/next
// arrow buttons — used anywhere a row of cards/chips should "slide" instead
// of wrapping onto multiple lines or being cut off by the container width.
export function HorizontalSlider({
  children,
  className,
  itemClassName,
  showArrows = true,
}: {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  showArrows?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="group relative">
      {showArrows && children.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="absolute -left-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent group-hover:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="absolute -right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent group-hover:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      <div
        ref={scrollerRef}
        className={cn("flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 scrollbar-thin", className)}
      >
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

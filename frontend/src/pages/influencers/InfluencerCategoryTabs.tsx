import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { INFLUENCER_CATEGORY_NAMES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

// Compact pill row (not tied to any other page, so it stays permanently
// dark/premium — no variant prop needed like FreelancerList's shared
// CategoryBrowsePanel).
export function InfluencerCategoryTabs({ active, onSelect }: { active: string; onSelect: (category: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const updateScrollButtons = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };
  useEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, []);
  const scrollBy = (amount: number) => rowRef.current?.scrollBy({ left: amount, behavior: "smooth" });

  const pillClass = (isActive: boolean) =>
    cn(
      "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13.5px] font-medium transition-all duration-200",
      isActive
        ? "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#65d838]"
        : "border-white/[0.08] bg-white/[0.03] text-[#A1A1AA] hover:border-white/20 hover:text-white"
    );

  return (
    <div className="relative border-b border-white/[0.08] bg-black">
      <button
        type="button"
        aria-label="Scroll categories left"
        disabled={!canScrollLeft}
        onClick={() => scrollBy(-240)}
        className={cn(
          "absolute left-0 top-0 z-10 flex h-full w-8 shrink-0 items-center justify-center bg-gradient-to-r from-black via-black/90 to-transparent",
          canScrollLeft ? "text-[#A1A1AA] hover:text-white" : "text-white/10"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div ref={rowRef} onScroll={updateScrollButtons} className="container flex items-center gap-2 overflow-x-auto py-3 pl-8 scrollbar-hide">
        <button type="button" onClick={() => onSelect("all")} className={pillClass(active === "all")}>
          <Sparkles className={cn("h-3.5 w-3.5", active === "all" ? "text-[#65d838]" : "text-[#71717A]")} />
          All Categories
        </button>
        {INFLUENCER_CATEGORY_NAMES.map((name) => (
          <button key={name} type="button" onClick={() => onSelect(name)} className={pillClass(active === name)}>
            <Sparkles className={cn("h-3.5 w-3.5", active === name ? "text-[#65d838]" : "text-[#71717A]")} />
            {name}
          </button>
        ))}
      </div>

      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollBy(240)}
          className="absolute right-0 top-0 z-10 flex h-full w-8 shrink-0 items-center justify-center bg-gradient-to-l from-black via-black/90 to-transparent text-[#A1A1AA] hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

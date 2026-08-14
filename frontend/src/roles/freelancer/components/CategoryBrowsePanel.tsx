import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface Props {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectSubCategory: (category: string, subCategory: string) => void;
  onViewAll: (category: string) => void;
  className?: string;
  // The Navbar's hover mega-menu already wraps this whole component in its
  // own popup, so there the section grid can just stay inline. Embedded
  // on-page (the freelancer listing) it isn't wrapped in anything, so
  // `popup` makes the grid itself a click-to-open/click-outside-to-close
  // dropdown instead of a permanently-expanded block eating page height.
  popup?: boolean;
  // "dark": compact pill styling for placing this panel directly on a black
  // section (the Freelancers page hero area) — every other caller (Navbar
  // mega-menu, Influencers/Projects/Gigs pages) keeps the default light
  // underline-tab styling untouched.
  variant?: "default" | "dark";
}

// Real 3-level category browse grid (Category -> Section -> skill), shared
// between the Navbar's hover mega-menu and the on-page panel on the
// freelancer listing — same SERVICE_CATEGORIES taxonomy that already backs
// the gig/service filters and the freelancer's own category/sub-category
// profile fields (via SERVICE_SUBCATEGORIES' flattened view), so every skill
// shown here is one a real freelancer could actually have. Section headers
// are a visual grouping only — clicking a skill is what actually filters.
export function CategoryBrowsePanel({
  activeCategory,
  onSelectCategory,
  onSelectSubCategory,
  onViewAll,
  className,
  popup = false,
  variant = "default",
}: Props) {
  const dark = variant === "dark";
  const sections = SERVICE_CATEGORIES[activeCategory] ?? {};
  const sectionEntries = Object.entries(sections);

  const [sectionsOpen, setSectionsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tabsRowRef = useRef<HTMLDivElement>(null);

  // The tabs row scrolls horizontally (13 categories rarely fit one width),
  // but a plain vertical mouse wheel does nothing on an overflow-x element
  // by default — only trackpad/touch swipes or shift+wheel do. Redirecting
  // normal wheel scroll here is what makes it actually feel scrollable.
  // This has to be a real addEventListener with { passive: false }, not
  // React's onWheel — React (and browsers by default) treat wheel listeners
  // as passive for scroll-performance reasons, which silently no-ops
  // preventDefault() and lets the whole page scroll along with the row.
  useEffect(() => {
    const el = tabsRowRef.current;
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

  // Explicit, always-discoverable scroll controls — a plain vertical mouse
  // wheel needs a JS handler to move a horizontal-only strip at all, and
  // that's easy to miss, so click arrows are the reliable fallback.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const updateScrollButtons = () => {
    const el = tabsRowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };
  useEffect(() => {
    updateScrollButtons();
    const el = tabsRowRef.current;
    if (!el) return;
    const onResize = () => updateScrollButtons();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const scrollTabsBy = (amount: number) => {
    tabsRowRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    if (!popup || !sectionsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSectionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popup, sectionsOpen]);

  const handleTabClick = (name: string) => {
    onSelectCategory(name);
    if (!popup) return;
    setSectionsOpen((open) => (open && name === activeCategory ? false : true));
  };

  // "All Categories" clears the filter outright — there's nothing to browse
  // under it, so unlike the real category tabs it never opens the dropdown.
  const handleAllClick = () => {
    onSelectCategory("all");
    setSectionsOpen(false);
  };

  const handleSelectSubCategory = (category: string, skill: string) => {
    onSelectSubCategory(category, skill);
    setSectionsOpen(false);
  };

  const handleViewAll = (category: string) => {
    onViewAll(category);
    setSectionsOpen(false);
  };

  const grid = (
    <>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-5 sm:grid-cols-3 lg:grid-cols-4">
        {sectionEntries.map(([section, skills]) => (
          <div key={section} className="min-w-0">
            <p className={cn("mb-1.5 truncate text-[12px] font-normal", dark ? "text-white" : "text-neutral-900")}>{section}</p>
            <div className="flex flex-col">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSelectSubCategory(activeCategory, skill)}
                  className={cn(
                    "truncate rounded-md px-2 py-1 text-left text-[13px] transition-colors",
                    dark ? "text-[#A1A1AA] hover:bg-white/5 hover:text-white" : "text-neutral-600 hover:bg-[#F5F5F5] hover:text-[#171717]"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => handleViewAll(activeCategory)}
        className={cn(
          "mb-1 inline-flex items-center gap-1 text-[12.5px] font-semibold hover:underline",
          dark ? "text-[#65d838]" : "text-[#171717]"
        )}
      >
        View all {activeCategory} freelancers <ArrowRight className="h-3 w-3" />
      </button>
    </>
  );

  return (
    <div ref={wrapperRef} className={cn("w-full", popup && "relative", className)}>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll categories left"
          disabled={!canScrollLeft}
          onClick={() => scrollTabsBy(-240)}
          className={cn(
            "absolute left-0 top-0 z-10 flex h-full w-8 shrink-0 items-center justify-center",
            dark ? "bg-gradient-to-r from-black via-black/90 to-transparent" : "bg-gradient-to-r from-white via-white/90 to-transparent",
            canScrollLeft
              ? dark
                ? "text-[#A1A1AA] hover:text-white"
                : "text-neutral-500 hover:text-[#171717]"
              : dark
                ? "text-white/10"
                : "text-neutral-200"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={tabsRowRef}
          onScroll={updateScrollButtons}
          className={cn(
            "flex items-center overflow-x-auto scrollbar-hide",
            dark ? "gap-2 py-3 pl-7" : "gap-1 border-b border-neutral-200 pl-7"
          )}
        >
          {dark ? (
            <>
              <CategoryPill active={activeCategory === "all"} onClick={handleAllClick}>
                All Categories
              </CategoryPill>
              {SERVICE_CATEGORY_NAMES.map((name) => (
                <CategoryPill key={name} active={activeCategory === name} onClick={() => handleTabClick(name)}>
                  {name}
                </CategoryPill>
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAllClick}
                className={cn(
                  "shrink-0 border-b-2 px-3.5 py-2.5 text-[15px] font-semibold transition-colors",
                  activeCategory === "all" ? "border-[#171717] text-[#171717]" : "border-transparent text-neutral-500 hover:text-neutral-900"
                )}
              >
                All Categories
              </button>
              {SERVICE_CATEGORY_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleTabClick(name)}
                  className={cn(
                    "shrink-0 border-b-2 px-3.5 py-2.5 text-[15px] font-medium transition-colors",
                    activeCategory === name ? "border-[#171717] text-[#171717]" : "border-transparent text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  {name}
                </button>
              ))}
            </>
          )}
        </div>

        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollTabsBy(240)}
            className={cn(
              "absolute right-0 top-0 z-10 flex h-full w-8 shrink-0 items-center justify-center",
              dark
                ? "bg-gradient-to-l from-black via-black/90 to-transparent text-[#A1A1AA] hover:text-white"
                : "bg-gradient-to-l from-white via-white/90 to-transparent text-neutral-500 hover:text-[#171717]"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {popup ? (
        sectionsOpen && (
          <div
            className={cn(
              "absolute left-0 right-0 top-full z-40 rounded-b-2xl border border-t-0 px-5 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.2)]",
              dark ? "border-white/[0.08] bg-[#0A0A0A]" : "border-neutral-200 bg-white"
            )}
          >
            {grid}
          </div>
        )
      ) : (
        grid
      )}
    </div>
  );
}

// Compact pill — icon + name, used only in the dark/premium variant. No
// per-category icon or live count exists in SERVICE_CATEGORIES yet, so this
// stays a generic marker rather than inventing data the API doesn't have.
function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13.5px] font-medium transition-all duration-200",
        active
          ? "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#65d838]"
          : "border-white/[0.08] bg-white/[0.03] text-[#A1A1AA] hover:border-white/20 hover:text-white"
      )}
    >
      <Sparkles className={cn("h-3.5 w-3.5", active ? "text-[#65d838]" : "text-[#71717A]")} />
      {children}
    </button>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
}: Props) {
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
            <p className="mb-1.5 truncate text-[12.5px] font-bold text-neutral-900">{section}</p>
            <div className="flex flex-col">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSelectSubCategory(activeCategory, skill)}
                  className="truncate rounded-md px-2 py-1 text-left text-[13px] text-neutral-600 transition-colors hover:bg-primary/5 hover:text-primary"
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
        className="mb-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
      >
        View all {activeCategory} freelancers <ArrowRight className="h-3 w-3" />
      </button>
    </>
  );

  return (
    <div ref={wrapperRef} className={cn("w-full", popup && "relative", className)}>
      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollTabsBy(-240)}
            className="absolute left-0 top-0 z-10 flex h-full w-8 shrink-0 items-center justify-center bg-gradient-to-r from-white via-white/90 to-transparent text-neutral-500 hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={tabsRowRef}
          onScroll={updateScrollButtons}
          className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 scrollbar-hide"
        >
          <button
            type="button"
            onClick={handleAllClick}
            className={cn(
              "shrink-0 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
              activeCategory === "all"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
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
                "shrink-0 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                activeCategory === name
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              )}
            >
              {name}
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollTabsBy(240)}
            className="absolute right-0 top-0 z-10 flex h-full w-8 shrink-0 items-center justify-center bg-gradient-to-l from-white via-white/90 to-transparent text-neutral-500 hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {popup ? (
        sectionsOpen && (
          <div className="absolute left-0 right-0 top-full z-40 rounded-b-2xl border border-t-0 border-neutral-200 bg-white px-5 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.2)]">
            {grid}
          </div>
        )
      ) : (
        grid
      )}
    </div>
  );
}

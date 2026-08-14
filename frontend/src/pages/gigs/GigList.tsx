import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GigListCard } from "@/pages/gigs/GigListCard";
import { Pagination } from "@/components/shared/Pagination";
import { CategoryBrowsePanel } from "@/roles/freelancer/components/CategoryBrowsePanel";
import GigFilterSidebar from "@/roles/freelancer/components/GigFilterSidebar";
import { SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { serviceApi, type ServiceSort } from "@/api/freelancers";

// Self-contained Gigs browsing tab — only loaded (code-split) once someone
// actually opens the "Gigs" tab on the Freelance hub, instead of bundling
// gig-search logic into FreelancerList.tsx itself. Owns its own category
// and price filter state, independent from the Freelancers tab's filters.
export default function GigList({ search }: { search: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // URL-synced (not just local state) so the selection survives a back-nav
  // from a gig's details page or a tab switch away and back — matching how
  // the Freelancers tab's own category filter already behaves.
  const initialCategory = searchParams.get("category");
  const [category, setCategoryState] = useState<string>(
    initialCategory && SERVICE_CATEGORY_NAMES.includes(initialCategory) ? initialCategory : "all"
  );
  const [subCategory, setSubCategoryState] = useState<string>(searchParams.get("subCategory") ?? "all");

  // Both fields update together in one setSearchParams call — calling it
  // twice back-to-back (once for category, once for subCategory) would have
  // each read the same stale `prev`, so the second call would silently
  // clobber the first.
  const applyCategory = (cat: string, sub: string) => {
    setCategoryState(cat);
    setSubCategoryState(sub);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === "all") next.delete("category");
      else next.set("category", cat);
      if (sub === "all") next.delete("subCategory");
      else next.set("subCategory", sub);
      return next;
    });
  };
  const [budget, setBudget] = useState<string>("any");
  const [maxDeliveryDays, setMaxDeliveryDays] = useState<string>("any");
  const [level, setLevel] = useState<string>("any");
  const [minRating, setMinRating] = useState<string>("any");
  const [language, setLanguage] = useState<string>("any");
  const [sort, setSort] = useState<ServiceSort>("best_match");
  const [page, setPage] = useState(1);

  const [priceMin, priceMax] =
    budget === "any" ? [undefined, undefined] : budget.split("-").map((v) => (v ? Number(v) : undefined));

  const selectCategory = (v: string) => {
    applyCategory(v, "all");
    setPage(1);
  };
  const selectSubCategory = (cat: string, sub: string) => {
    applyCategory(cat, sub);
    setPage(1);
  };

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", { search, category, subCategory, budget, maxDeliveryDays, level, minRating, language, sort, page }],
    queryFn: () =>
      serviceApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: subCategory === "all" ? undefined : subCategory,
        priceMin,
        priceMax,
        maxDeliveryDays: maxDeliveryDays === "any" ? undefined : Number(maxDeliveryDays),
        level: level === "any" ? undefined : (level as "new" | "level_1" | "top_rated"),
        minRating: minRating === "any" ? undefined : Number(minRating),
        language: language === "any" ? undefined : language,
        sort,
        page,
        limit: 12,
      }),
  });

  const resetPage = () => setPage(1);
  const total = services?.pagination.total ?? 0;
  const pages = services?.pagination.pages ?? 1;

  return (
    <div>
      {/* Category browse panel */}
      <div className="-mx-4 mb-6 border-b border-border bg-card px-4 sm:mx-0 sm:rounded-xl sm:border lg:sticky lg:top-[136px] lg:z-[25]">
        <CategoryBrowsePanel activeCategory={category} onSelectCategory={selectCategory} onSelectSubCategory={selectSubCategory} onViewAll={selectCategory} popup />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
        <GigFilterSidebar
          category={category}
          setCategory={selectCategory}
          subCategory={subCategory}
          setSubCategory={(v) => {
            applyCategory(category, v);
            resetPage();
          }}
          budget={budget}
          setBudget={(v) => {
            setBudget(v);
            resetPage();
          }}
          maxDeliveryDays={maxDeliveryDays}
          setMaxDeliveryDays={(v) => {
            setMaxDeliveryDays(v);
            resetPage();
          }}
          minRating={minRating}
          setMinRating={(v) => {
            setMinRating(v);
            resetPage();
          }}
          level={level}
          setLevel={(v) => {
            setLevel(v);
            resetPage();
          }}
          language={language}
          setLanguage={(v) => {
            setLanguage(v);
            resetPage();
          }}
          sort={sort}
          setSort={(v) => {
            setSort(v);
            resetPage();
          }}
          resultCount={total}
        />

        <div>
          {isLoading ? (
            <GridSkeleton />
          ) : !services?.data.length ? (
            <EmptyState text="No gigs found. Try adjusting your filters." />
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {services.data.map((s) => (
                  <GigListCard key={s._id} service={s} />
                ))}
              </div>
              <Pagination page={page} pages={pages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-[22px]" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <Briefcase className="h-9 w-9 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

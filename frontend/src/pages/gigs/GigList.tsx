import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GigListCard } from "@/components/gigs/GigListCard";
import { Pagination } from "@/components/shared/Pagination";
import { CategoryBrowsePanel } from "@/roles/freelancer/components/CategoryBrowsePanel";
import GigFilterSidebar from "@/roles/freelancer/components/GigFilterSidebar";
import { serviceApi, type ServiceSort } from "@/api/freelancers";

// Self-contained Gigs browsing tab — only loaded (code-split) once someone
// actually opens the "Gigs" tab on the Freelance hub, instead of bundling
// gig-search logic into FreelancerList.tsx itself. Owns its own category
// and price filter state, independent from the Freelancers tab's filters.
export default function GigList({ search }: { search: string }) {
  const [category, setCategory] = useState<string>("all");
  const [subCategory, setSubCategory] = useState<string>("all");
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
    setCategory(v);
    setSubCategory("all");
    setPage(1);
  };
  const selectSubCategory = (cat: string, sub: string) => {
    setCategory(cat);
    setSubCategory(sub);
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
      <div className="-mx-4 mb-6 border-b border-neutral-200 bg-white px-4 sm:mx-0 sm:rounded-xl sm:border">
        <CategoryBrowsePanel activeCategory={category} onSelectCategory={selectCategory} onSelectSubCategory={selectSubCategory} onViewAll={selectCategory} popup />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
        <GigFilterSidebar
          category={category}
          setCategory={selectCategory}
          subCategory={subCategory}
          setSubCategory={(v) => {
            setSubCategory(v);
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

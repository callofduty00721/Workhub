import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ChevronRight, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceCard } from "@/components/gigs/ServiceCard";
import { serviceApi } from "@/api/freelancers";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";

// Self-contained Gigs browsing tab — only loaded (code-split) once someone
// actually opens the "Gigs" tab on the Freelance hub, instead of bundling
// gig-search logic into FreelancerList.tsx itself. Owns its own category
// and price filter state, independent from the Freelancers tab's filters.
export default function GigList({ search }: { search: string }) {
  const [category, setCategory] = useState<string>("all");
  const [subCategory, setSubCategory] = useState<string>("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [maxDeliveryDays, setMaxDeliveryDays] = useState<string>("any");

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", { search, category, subCategory, priceMin, priceMax, maxDeliveryDays }],
    queryFn: () =>
      serviceApi.list({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        subCategory: subCategory === "all" ? undefined : subCategory,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        maxDeliveryDays: maxDeliveryDays === "any" ? undefined : Number(maxDeliveryDays),
        limit: 12,
      }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="space-y-6">
        <CategorySidebar
          category={category}
          subCategory={subCategory}
          onSelectCategory={(c) => {
            setCategory(c);
            setSubCategory("all");
          }}
          onSelectSubCategory={setSubCategory}
        />
        <FilterPanel title="Filters">
          <FilterField label="Price (₹)">
            <div className="flex items-center gap-2">
              <Input type="number" min={0} placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="h-8 text-xs" />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="number" min={0} placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="h-8 text-xs" />
            </div>
          </FilterField>
          <FilterField label="Delivery Time">
            <Select value={maxDeliveryDays} onValueChange={setMaxDeliveryDays}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">Up to 1 day</SelectItem>
                <SelectItem value="3">Up to 3 days</SelectItem>
                <SelectItem value="7">Up to 7 days</SelectItem>
                <SelectItem value="14">Up to 14 days</SelectItem>
                <SelectItem value="30">Up to 30 days</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </FilterPanel>
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <GridSkeleton />
        ) : !services?.data.length ? (
          <EmptyState text="No gigs listed yet." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {services.data.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySidebar({
  category,
  subCategory,
  onSelectCategory,
  onSelectSubCategory,
}: {
  category: string;
  subCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectSubCategory: (subCategory: string) => void;
}) {
  return (
    <aside className="h-fit rounded-xl border border-border bg-card lg:sticky lg:top-4">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Categories</h3>
      </div>
      <nav className="max-h-[70vh] overflow-y-auto py-1.5 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
            category === "all" ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-accent"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0" /> All Categories
        </button>
        {SERVICE_CATEGORY_NAMES.map((c) => {
          const isActive = category === c;
          const subOptions = SERVICE_CATEGORIES[c] ?? [];
          return (
            <div key={c}>
              <button
                type="button"
                onClick={() => onSelectCategory(isActive ? "all" : c)}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-accent"
                }`}
              >
                <span className="truncate">{c}</span>
                {subOptions.length > 0 && <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${isActive ? "rotate-90" : ""}`} />}
              </button>
              {isActive && subOptions.length > 0 && (
                <div className="pb-1">
                  {subOptions.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => onSelectSubCategory(sub)}
                      className={`flex w-full items-center gap-2 py-1.5 pl-9 pr-4 text-left text-xs transition-colors ${
                        subCategory === sub ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function FilterPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 w-full rounded-xl" />
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

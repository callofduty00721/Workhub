import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SimpleHero, type SimpleHeroTrustPoint } from "@/components/shared/SimpleHero";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types";

interface DirectoryListProps<T> {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyIcon: LucideIcon;
  emptyMessage: string;
  queryKey: string;
  queryFn: (params: { search?: string; limit: number; category?: string }) => Promise<Paginated<T>>;
  getItemKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  skeletonClassName?: string;
  // When provided, renders an "All" + one pill per category above the grid —
  // opt-in, so MentorList/PartnerList (no category taxonomy) are unaffected.
  categoryOptions?: string[];
  // Lets a caller with a taller/wider card (e.g. InfluencerCard's stats +
  // social-presence layout) use fewer, wider columns instead of the default
  // 4-up grid built for compact cards.
  gridClassName?: string;
  // Opt-in — when provided, swaps the plain title/subtitle/search block for
  // the same blob-background hero used on Jobs/Freelancers, instead of
  // changing every caller's layout. `title`/`subtitle`/`searchPlaceholder`
  // above still drive the plain fallback when this is omitted.
  hero?: {
    badgeIcon: LucideIcon;
    badgeText: (total: number) => string;
    heroTitle: string;
    accent: string;
    trustPoints: SimpleHeroTrustPoint[];
  };
  // Opt-in — a "how it works" strip or similar block rendered between the
  // hero and the filter/grid container, matching the process-strip pattern
  // used on Jobs/Freelancers/Influencers. Only meaningful alongside `hero`.
  afterHero?: ReactNode;
}

// Shared by MentorList, InfluencerList, PartnerList — same directory-page shape
// (title/subtitle, search box, skeleton grid, empty state, responsive card
// grid), differing only in copy, the API call, and how each item renders.
export function DirectoryList<T>({
  title,
  subtitle,
  searchPlaceholder,
  emptyIcon: EmptyIcon,
  emptyMessage,
  queryKey,
  queryFn,
  getItemKey,
  renderCard,
  skeletonClassName = "h-48",
  categoryOptions,
  gridClassName = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  hero,
  afterHero,
}: DirectoryListProps<T>) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, { search, category }],
    queryFn: () => queryFn({ search: search || undefined, limit: 12, category }),
  });

  return (
    <div>
      {hero ? (
        <SimpleHero
          badgeIcon={hero.badgeIcon}
          badgeText={hero.badgeText(data?.pagination.total ?? 0)}
          title={hero.heroTitle}
          accent={hero.accent}
          description={subtitle}
          trustPoints={hero.trustPoints}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
        />
      ) : (
        <div className="container pt-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="relative mb-6 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} className="pl-9" />
          </div>
        </div>
      )}

      {hero && afterHero}

      <div className={cn("container py-10", hero && !afterHero && "border-t border-neutral-100")}>
      {categoryOptions && categoryOptions.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge
            variant={!category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategory(undefined)}
          >
            All
          </Badge>
          {categoryOptions.map((c) => (
            <Badge
              key={c}
              variant={category === c ? "default" : "outline"}
              className={cn("cursor-pointer", category === c && "bg-primary text-primary-foreground")}
              onClick={() => setCategory(c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className={gridClassName}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={`${skeletonClassName} w-full rounded-xl`} />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <EmptyIcon className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className={gridClassName}>
          {data.data.map((item) => (
            <div key={getItemKey(item)}>{renderCard(item)}</div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

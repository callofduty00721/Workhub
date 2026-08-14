import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ShieldCheck, Megaphone, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import { SimpleHero } from "@/components/shared/SimpleHero";
import { DirectoryTabs } from "./DirectoryTabs";
import { DirectoryCard } from "./DirectoryCard";
import { publicProfileApi } from "@/api/publicProfiles";
import { usePageMeta } from "@/lib/usePageMeta";
import { BRAND_CATEGORIES } from "@/lib/mockData";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified brands", color: "text-green-500" },
  { icon: Megaphone, label: "Real open campaigns", color: "text-blue-500" },
  { icon: TrendingUp, label: "Direct hiring", color: "text-purple-500" },
];

export default function BrandList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  usePageMeta("Brands — GrowHive", "Discover brands hiring influencers on GrowHive.");

  const { data, isLoading } = useQuery({
    queryKey: ["public-profiles", "brand", "list", { search, category, page }],
    queryFn: () => publicProfileApi.listBrands({ search: search || undefined, category: category === "all" ? undefined : category, page, limit: 12 }),
  });

  return (
    <div>
      <DirectoryTabs />

      <SimpleHero
        badgeIcon={Building2}
        badgeText={(data?.pagination.total ?? 0) > 0 ? `${data!.pagination.total.toLocaleString()} brands hiring` : "Browse brands"}
        title="Discover"
        accent="brands"
        description="Brands running influencer campaigns on GrowHive — see who's hiring and what they're looking for."
        trustPoints={TRUST_POINTS}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search brands..."
      />

      <div className="container py-10">
        <div className="mb-6 flex justify-end">
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {BRAND_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <Building2 className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No brands found. Try a different search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.data.map((brand) => (
                <DirectoryCard
                  key={brand._id}
                  id={brand._id}
                  to={`/brands/${brand._id}`}
                  name={brand.name}
                  avatar={brand.avatar}
                  headline={brand.headline}
                  location={brand.location}
                  isVerified={brand.isVerified}
                  rating={brand.rating}
                  reviewCount={brand.reviewCount}
                  stat={brand.brandProfile?.industry}
                  categories={brand.brandProfile?.categories}
                  totalCampaignsCount={brand.totalCampaignsCount}
                  hiredInfluencersCount={brand.hiredInfluencersCount}
                  totalReach={brand.totalReach}
                  website={brand.brandProfile?.website}
                  socialLinks={brand.brandProfile?.socialLinks}
                />
              ))}
            </div>
            <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

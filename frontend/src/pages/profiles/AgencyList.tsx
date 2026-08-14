import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ShieldCheck, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { SimpleHero } from "@/components/shared/SimpleHero";
import { DirectoryTabs } from "./DirectoryTabs";
import { DirectoryCard } from "./DirectoryCard";
import { publicProfileApi } from "@/api/publicProfiles";
import { usePageMeta } from "@/lib/usePageMeta";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified agencies", color: "text-green-500" },
  { icon: Users, label: "Real creator rosters", color: "text-blue-500" },
  { icon: TrendingUp, label: "Direct campaigns", color: "text-purple-500" },
];

export default function AgencyList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  usePageMeta("Agencies — GrowHive", "Discover influencer marketing agencies on GrowHive.");

  const { data, isLoading } = useQuery({
    queryKey: ["public-profiles", "agency", "list", { search, page }],
    queryFn: () => publicProfileApi.listAgencies({ search: search || undefined, page, limit: 12 }),
  });

  return (
    <div>
      <DirectoryTabs />

      <SimpleHero
        badgeIcon={Briefcase}
        badgeText={(data?.pagination.total ?? 0) > 0 ? `${data!.pagination.total.toLocaleString()} agencies` : "Browse agencies"}
        title="Discover"
        accent="agencies"
        description="Agencies running influencer campaigns for their clients — browse services, rosters, and past work."
        trustPoints={TRUST_POINTS}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search agencies..."
      />

      <div className="container py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <Briefcase className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No agencies found. Try a different search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.data.map((agency) => (
                <DirectoryCard
                  key={agency._id}
                  id={agency._id}
                  to={`/agencies/${agency._id}`}
                  name={agency.name}
                  avatar={agency.avatar}
                  headline={agency.headline}
                  location={agency.location}
                  isVerified={agency.isVerified}
                  rating={agency.rating}
                  reviewCount={agency.reviewCount}
                  stat={agency.agencyProfile?.agencyType}
                  website={agency.agencyProfile?.website}
                  socialLinks={agency.agencyProfile?.socialLinks}
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

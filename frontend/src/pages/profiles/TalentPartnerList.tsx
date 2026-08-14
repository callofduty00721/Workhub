import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Handshake, ShieldCheck, Star, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { SimpleHero } from "@/components/shared/SimpleHero";
import { DirectoryTabs } from "./DirectoryTabs";
import { DirectoryCard } from "./DirectoryCard";
import { publicProfileApi } from "@/api/publicProfiles";
import { usePageMeta } from "@/lib/usePageMeta";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified partners", color: "text-green-500" },
  { icon: Users, label: "Consent-based rosters", color: "text-blue-500" },
  { icon: Star, label: "Real reviews", color: "text-purple-500" },
];

export default function TalentPartnerList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  usePageMeta("Talent Partners — GrowHive", "Discover talent partners and creator managers on GrowHive.");

  const { data, isLoading } = useQuery({
    queryKey: ["public-profiles", "talent_partner", "list", { search, page }],
    queryFn: () => publicProfileApi.listTalentPartners({ search: search || undefined, page, limit: 12 }),
  });

  return (
    <div>
      <DirectoryTabs />

      <SimpleHero
        badgeIcon={Handshake}
        badgeText={(data?.pagination.total ?? 0) > 0 ? `${data!.pagination.total.toLocaleString()} talent partners` : "Browse talent partners"}
        title="Discover"
        accent="talent partners"
        description="Talent managers and partners who represent creators — every roster you see here was accepted, not claimed."
        trustPoints={TRUST_POINTS}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search talent partners..."
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
            <Handshake className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No talent partners found. Try a different search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.data.map((partner) => (
                <DirectoryCard
                  key={partner._id}
                  id={partner._id}
                  to={`/talent-partners/${partner._id}`}
                  name={partner.name}
                  avatar={partner.avatar}
                  headline={partner.headline}
                  location={partner.location}
                  isVerified={partner.isVerified}
                  rating={partner.rating}
                  reviewCount={partner.reviewCount}
                  stat={partner.talentPartnerProfile?.partnerType}
                  website={partner.talentPartnerProfile?.website}
                  socialLinks={partner.talentPartnerProfile?.socialLinks}
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

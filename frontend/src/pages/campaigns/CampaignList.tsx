import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Megaphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { campaignApi } from "@/api/campaigns";
import { useAuth } from "@/context/AuthContext";
import { DirectoryTabs } from "@/pages/profiles/DirectoryTabs";
import { CampaignCard } from "@/pages/campaigns/CampaignCard";

export default function CampaignList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["campaigns", { search, page }],
    queryFn: () => campaignApi.list({ search: search || undefined, page, limit: 12 }),
  });

  return (
    <div>
      <DirectoryTabs />

      <div className="container py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">Browse influencer marketing campaigns posted by brands on GrowHive.</p>
          </div>
          {(user?.role === "employer" || user?.role === "client" || user?.role === "brand" || user?.role === "agency" || user?.role === "talent_partner") && (
            <Button variant="gradient" asChild>
              <Link to="/dashboard/employer/post-campaign">
                <Plus className="h-4 w-4" /> Post a Campaign
              </Link>
            </Button>
          )}
        </div>

        <div className="mb-6 relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search campaigns, brands, niches..."
            className="pl-9"
          />
        </div>

        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[26rem] w-full rounded-[22px]" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-5 py-8 text-center text-sm text-danger">
            Couldn&apos;t load campaigns right now. Make sure the API server is running.
          </div>
        )}

        {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No open campaigns right now</p>
            <p className="text-sm text-muted-foreground">Check back soon, or try a different search.</p>
          </div>
        )}

        {!isLoading && !isError && !!data?.data.length && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((c) => (
              <CampaignCard key={c._id} campaign={c} />
            ))}
          </div>
        )}

        {!!data && data.pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.pages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

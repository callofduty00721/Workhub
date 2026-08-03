import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Megaphone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { campaignApi } from "@/api/campaigns";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  facebook: "Facebook",
  other: "Other",
};

export default function CampaignList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["campaigns", { search, page }],
    queryFn: () => campaignApi.list({ search: search || undefined, page, limit: 12 }),
  });

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse influencer marketing campaigns posted by brands on MahaHub.</p>
        </div>
        {(user?.role === "employer" || user?.role === "client") && (
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
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
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
            <Link key={c._id} to={`/campaigns/${c._id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                      {c.companyName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.companyName}</p>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {PLATFORM_LABELS[c.platform] ?? c.platform}
                    </Badge>
                    {c.niche && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.niche}
                      </Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                      <MapPin className="h-2.5 w-2.5" /> {c.location}
                    </Badge>
                  </div>
                  {c.budgetMin > 0 && (
                    <p className="mt-auto text-sm font-semibold text-success">
                      {formatCurrency(c.budgetMin, c.currency as "INR" | "USD")}
                      {c.budgetMax > c.budgetMin ? ` - ${formatCurrency(c.budgetMax, c.currency as "INR" | "USD")}` : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
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
  );
}

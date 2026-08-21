import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Lock, Unlock, Trash2, Star } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { adminApi } from "@/api/admin";
import { formatCurrency } from "@/lib/utils";

export default function AdminCampaigns() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "campaigns", { search, page }],
    queryFn: () => adminApi.campaigns({ search: search || undefined, page, limit: 20 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleCampaignStatus(id),
    onSuccess: invalidate,
  });

  const featureMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleCampaignFeatured(id),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminApi.removeCampaign(id),
    onSuccess: invalidate,
  });

  return (
    <DashboardLayout role="super_admin" title="Manage Campaigns" subtitle="Moderate brand/agency influencer-marketing campaigns.">
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by campaign title..."
          className="pl-9"
        />
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No campaigns match this search.</p>
        ) : (
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Posted By</th>
                <th className="px-5 py-3 font-medium">Budget</th>
                <th className="px-5 py-3 font-medium">Applications</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((c) => {
                const employer = typeof c.employer === "object" ? c.employer : null;
                const onBehalfOf = typeof c.onBehalfOf === "object" ? c.onBehalfOf : null;
                return (
                  <tr key={c._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/campaigns/${c._id}`} className="font-medium hover:underline">
                          {c.title}
                        </Link>
                        {c.isFeatured && (
                          <Badge variant="warning" className="shrink-0 gap-1 text-[10px]">
                            <Star className="h-2.5 w-2.5 fill-current" /> Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.campaignId ?? c.companyName}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {employer?.name ?? "—"}
                      {onBehalfOf && <p className="text-xs">on behalf of {onBehalfOf.name}</p>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatCurrency(c.budgetMin)}
                      {c.budgetMax > c.budgetMin && ` – ${formatCurrency(c.budgetMax)}`}
                    </td>
                    <td className="px-5 py-3">{c.applicationsCount}</td>
                    <td className="px-5 py-3">
                      <Badge variant={c.status === "open" ? "success" : c.status === "draft" ? "outline" : "outline"} className="capitalize">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(c.isFeatured && "text-warning hover:bg-warning/10")}
                          disabled={featureMutation.isPending}
                          onClick={() => featureMutation.mutate(c._id)}
                        >
                          <Star className={cn("h-3.5 w-3.5", c.isFeatured && "fill-current")} />
                        </Button>
                        {c.status !== "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={toggleMutation.isPending}
                            onClick={() => toggleMutation.mutate(c._id)}
                          >
                            {c.status === "open" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            {c.status === "open" ? "Close" : "Reopen"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          disabled={removeMutation.isPending}
                          onClick={() => confirm(`Remove "${c.title}"? This can't be undone.`) && removeMutation.mutate(c._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
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
    </DashboardLayout>
  );
}

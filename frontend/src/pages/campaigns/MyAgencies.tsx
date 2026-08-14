import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Megaphone } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { agencyClientApi } from "@/api/agencyClients";
import { campaignApi } from "@/api/campaigns";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";

// Brand's side of the Brand↔Agency delegation flow — which agencies manage
// them, and the campaigns those agencies are running on their behalf (see
// campaign.controller.js's getCampaignsOnBehalfOfMe).
export default function MyAgencies() {
  const { user } = useAuth();
  const dashboardRole = (user?.role ?? "brand") as DashboardRole;

  const { data: agencies, isLoading: agenciesLoading } = useQuery({ queryKey: ["agency-clients", "mine"], queryFn: agencyClientApi.mine });
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", "on-behalf-of-me"],
    queryFn: campaignApi.onBehalfOfMe,
  });

  return (
    <DashboardLayout role={dashboardRole} title="My Agencies" subtitle="Agencies managing your campaigns, and what they're running.">
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-3 text-base font-semibold">Agencies</h3>
          {agenciesLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : !agencies?.length ? (
            <p className="text-sm text-muted-foreground">No agencies managing your campaigns yet — invite one from their profile page.</p>
          ) : (
            <div className="space-y-2">
              {agencies.map((row) => (
                <div key={row._id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={row.agency?.avatar} alt={row.agency?.name} />
                    <AvatarFallback className="bg-neutral-900 text-xs text-white">{initialsFromName(row.agency?.name ?? "")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.agency?.name}</p>
                    {row.agency?.agencyProfile?.agencyType && <p className="truncate text-xs text-muted-foreground">{row.agency.agencyProfile.agencyType}</p>}
                  </div>
                  {!!row.budget && <Badge variant="secondary">{formatCurrency(row.budget)}</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Megaphone className="h-4 w-4" /> Campaigns Run For You
          </h3>
          {campaignsLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : !campaigns?.length ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No campaigns run on your behalf yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => {
                const runBy = typeof c.employer === "object" ? c.employer.name : "";
                return (
                  <div key={c._id} className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{c.title}</p>
                        <Badge variant={c.status === "open" ? "success" : "outline"} className="text-[10px] capitalize">
                          {c.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">Run by {runBy} · {c.applicationsCount} applicants</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <Link to={`/dashboard/employer/campaigns/${c._id}/report`}>
                        <FileText className="h-3.5 w-3.5" /> View Report
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";

export default function AdminFlaggedStartups() {
  const queryClient = useQueryClient();

  const { data: flagged, isLoading } = useQuery({ queryKey: ["admin", "flagged-startups"], queryFn: adminApi.flaggedStartups });

  const resolveMutation = useMutation({
    mutationFn: ({ startupId, action }: { startupId: string; action: "dismiss" | "suspend" }) => adminApi.resolveFlaggedStartup(startupId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "flagged-startups"] }),
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Flagged Startups"
      subtitle="Startups reported by users, or auto-detected for suspicious funding activity."
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !flagged?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <ShieldCheck className="h-8 w-8 text-success" />
            <p className="text-sm font-medium">Nothing flagged right now</p>
            <p className="text-sm text-muted-foreground">Reported or suspicious startups will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flagged.map((f) => (
            <Card key={f.startupId}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/startups/${f.startupId}`} className="font-semibold hover:underline">
                        {f.name}
                      </Link>
                      {f.isSuspended && <Badge variant="danger">Suspended</Badge>}
                      {f.autoFlagged && (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Auto-flagged
                        </Badge>
                      )}
                      {f.reportCount > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Flag className="h-3 w-3" /> {f.reportCount} report{f.reportCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    {f.founder && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Founder: {f.founder.name} ({f.founder.email})
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveMutation.mutate({ startupId: f.startupId, action: "dismiss" })}
                      disabled={resolveMutation.isPending}
                    >
                      Dismiss
                    </Button>
                    {!f.isSuspended && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger hover:bg-danger/10"
                        onClick={() => resolveMutation.mutate({ startupId: f.startupId, action: "suspend" })}
                        disabled={resolveMutation.isPending}
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> Suspend
                      </Button>
                    )}
                  </div>
                </div>

                {f.autoReason && (
                  <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                    <span className="font-semibold">System detected:</span> {f.autoReason}
                  </p>
                )}

                {f.reports.length > 0 && (
                  <div className="space-y-1.5 border-t border-border pt-3">
                    {f.reports.map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{r.user?.name ?? "Unknown user"}</span>
                        {r.reason ? `: ${r.reason}` : " reported this startup (no reason given)"} ·{" "}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

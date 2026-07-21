import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Rocket } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { startupApi } from "@/api/startups";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending_review: { label: "Pending Review", className: "bg-warning/10 text-warning" },
  published: { label: "Published", className: "bg-success/10 text-success" },
};

export default function MyStartups() {
  const { data: myStartups, isLoading } = useQuery({ queryKey: ["startups", "mine"], queryFn: startupApi.mine });

  return (
    <DashboardLayout
      role="founder"
      title="My Startups"
      subtitle="Manage every startup you've posted on MahaHub."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/founder/startup">
            <Plus className="h-4 w-4" /> New Startup
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : myStartups?.length ? (
            <div className="space-y-3">
              {myStartups.map((s) => {
                const statusMeta = STATUS_LABELS[s.status] ?? STATUS_LABELS.draft;
                return (
                  <div key={s._id} className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white">
                      {s.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{s.name}</p>
                        <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                        <Badge variant="secondary" className="capitalize">
                          {s.stage.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{s.tagline}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{s.industry}</Badge>
                        <Badge variant="outline">{s.location}</Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/founder/startup/${s._id}`}>Edit</Link>
                      </Button>
                      {s.status === "published" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/startups/${s._id}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
              <Rocket className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You haven&apos;t posted a startup yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Share your idea and start connecting with investors, mentors and partners.
              </p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to="/dashboard/founder/startup">Post Your Startup</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

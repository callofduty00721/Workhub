import { useQuery } from "@tanstack/react-query";
import { Users, Rocket, Briefcase, Wrench, Trophy } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import { formatCompactNumber } from "@/lib/utils";

export default function AdminOverview() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats });

  const metrics = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Total Startups", value: stats?.totalStartups ?? 0, icon: Rocket, color: "text-secondary bg-secondary/10" },
    { label: "Total Jobs", value: stats?.totalJobs ?? 0, icon: Briefcase, color: "text-success bg-success/10" },
    { label: "Total Services", value: stats?.totalServices ?? 0, icon: Wrench, color: "text-warning bg-warning/10" },
    { label: "Total Contests", value: stats?.totalContests ?? 0, icon: Trophy, color: "text-primary bg-primary/10" },
  ];

  return (
    <DashboardLayout role="super_admin" title="Admin Overview" subtitle="Platform-wide metrics and user breakdown.">
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((m) => (
            <Card key={m.label} className="p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{formatCompactNumber(m.value)}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold">Users by Role</h3>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats &&
                Object.entries(stats.roleBreakdown).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-lg border border-border p-3.5">
                    <span className="text-sm text-muted-foreground">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

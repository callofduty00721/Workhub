import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trophy, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { contestApi } from "@/api/contests";
import { formatCurrency } from "@/lib/utils";

export default function MyContests({
  role = "employer",
  basePath = "/dashboard/employer",
}: {
  role?: "employer" | "client";
  basePath?: string;
}) {
  const { data: contests, isLoading } = useQuery({ queryKey: ["contests", "mine"], queryFn: contestApi.mine });

  return (
    <DashboardLayout
      role={role}
      title="My Contests"
      subtitle="Contests you've posted and the entries submitted so far."
      actions={
        <Button variant="gradient" asChild>
          <Link to={`${basePath}/post-contest`}>
            <Plus className="h-4 w-4" /> Post a Contest
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !contests?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You haven&apos;t posted any contests yet</p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to={`${basePath}/post-contest`}>Post a Contest</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {contests.map((contest) => (
                <div key={contest._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{contest.title}</p>
                      <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                        {contest.status}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> {formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {contest.entriesCount} entries
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${basePath}/contests/${contest._id}/entries`}>Review Entries</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${basePath}/contests/${contest._id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

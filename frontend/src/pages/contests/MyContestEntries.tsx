import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { contestApi } from "@/api/contests";
import { formatCurrency } from "@/lib/utils";

export default function MyContestEntries() {
  const { data: entries, isLoading } = useQuery({ queryKey: ["contests", "entries", "mine"], queryFn: contestApi.myEntries });

  return (
    <DashboardLayout
      role="freelancer"
      title="My Contest Entries"
      subtitle="Track contests you've entered and see if you've won."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/contests">
            <Trophy className="h-4 w-4" /> Browse Contests
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
          ) : !entries?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You haven&apos;t entered any contests yet</p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to="/contests">Browse Contests</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const contest = typeof entry.contest === "object" ? entry.contest : null;
                return (
                  <div key={entry._id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={contest ? `/contests/${contest._id}` : "#"} className="truncate text-sm font-semibold hover:underline">
                            {contest?.title ?? "Contest"}
                          </Link>
                          {entry.isWinner && (
                            <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                              <Trophy className="h-3 w-3" /> Winner
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{entry.title}</p>
                        {contest && (
                          <p className="mt-1.5 text-xs font-medium text-foreground/80">
                            Prize: {formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {contest?.status ?? "open"}
                      </Badge>
                    </div>
                    {entry.fileUrl && (
                      <a
                        href={entry.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View your submission
                      </a>
                    )}
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

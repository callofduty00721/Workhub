import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Heart, Bookmark, Rocket, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StartupCard } from "@/roles/founder/components/StartupCard";
import { Skeleton } from "@/components/ui/skeleton";
import { investorApi } from "@/api/investors";
import { pitchApi } from "@/api/pitches";
import { useAuth } from "@/context/AuthContext";
import { VerificationBanner } from "@/components/shared/VerificationBanner";

export default function InvestorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["investors", "mine", "deal-flow"], queryFn: investorApi.dealFlow });
  const { data: pitches, isLoading: pitchesLoading } = useQuery({ queryKey: ["pitches", "received"], queryFn: pitchApi.received });

  const viewMutation = useMutation({
    mutationFn: (pitchId: string) => pitchApi.markViewed(pitchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pitches", "received"] }),
  });

  return (
    <DashboardLayout role="investor" title={`Welcome back, ${user?.name.split(" ")[0]} 👋`} subtitle="Track startups you're interested in and following.">
      <VerificationBanner />
      <Tabs defaultValue="interested">
        <TabsList>
          <TabsTrigger value="interested">
            <Heart className="mr-1.5 h-3.5 w-3.5" /> Interested
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved / Following
          </TabsTrigger>
          <TabsTrigger value="pitches">
            <Rocket className="mr-1.5 h-3.5 w-3.5" /> Pitches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interested">
          {isLoading ? (
            <SkeletonGrid />
          ) : !data?.interested.length ? (
            <EmptyState text="Mark startups as interesting to track them here." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.interested.map((s) => (
                <StartupCard key={s._id} startup={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {isLoading ? (
            <SkeletonGrid />
          ) : !data?.saved.length ? (
            <EmptyState text="Follow startups to save them here." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.saved.map((s) => (
                <StartupCard key={s._id} startup={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pitches">
          {pitchesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !pitches?.length ? (
            <EmptyState text="Founders who pitch a startup directly to you will show up here." />
          ) : (
            <div className="space-y-3">
              {pitches.map((p) => (
                <Card key={p._id}>
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold">{p.founder.name}</p>
                        <span className="text-xs text-muted-foreground">pitched</span>
                        <Link to={`/startups/${p.startup._id}`} className="text-sm font-semibold text-primary hover:underline">
                          {p.startup.name}
                        </Link>
                      </div>
                      {p.message && <p className="mt-1 max-w-md text-sm text-foreground/80">{p.message}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={p.status === "viewed" ? "success" : "outline"}>{p.status === "viewed" ? "Viewed" : "New"}</Badge>
                      {p.status === "sent" && (
                        <Button size="sm" variant="outline" disabled={viewMutation.isPending} onClick={() => viewMutation.mutate(p._id)}>
                          <Eye className="h-3.5 w-3.5" /> Mark viewed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-56 w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      <Link to="/startups" className="text-sm font-medium text-primary hover:underline">
        Explore Startups
      </Link>
    </div>
  );
}

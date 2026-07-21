import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Heart, Bookmark } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StartupCard } from "@/components/startup/StartupCard";
import { Skeleton } from "@/components/ui/skeleton";
import { investorApi } from "@/api/investors";
import { useAuth } from "@/context/AuthContext";

export default function InvestorDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["investors", "mine", "deal-flow"], queryFn: investorApi.dealFlow });

  return (
    <DashboardLayout role="investor" title={`Welcome back, ${user?.name.split(" ")[0]} 👋`} subtitle="Track startups you're interested in and following.">
      <Tabs defaultValue="interested">
        <TabsList>
          <TabsTrigger value="interested">
            <Heart className="mr-1.5 h-3.5 w-3.5" /> Interested
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved / Following
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

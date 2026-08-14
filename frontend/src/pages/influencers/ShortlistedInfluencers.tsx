import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { InfluencerCard } from "./InfluencerCard";
import { userApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";

// Hiring roles only ever save influencers (unlike Freelancer/Job/Project/
// Service/Contest, which are freelancer-side saves) — so this is a plain
// single list, not a multi-tab page like SavedItems.tsx.
export default function ShortlistedInfluencers() {
  const { user } = useAuth();
  const dashboardRole = (user?.role ?? "brand") as DashboardRole;

  const { data, isLoading } = useQuery({ queryKey: ["saved-items"], queryFn: userApi.getSavedItems });
  const influencers = data?.influencers ?? [];

  return (
    <DashboardLayout role={dashboardRole} title="Shortlisted Influencers" subtitle="Influencers you've saved to consider later.">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] w-full rounded-xl" />
          ))}
        </div>
      ) : !influencers.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Bookmark className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm font-medium">No influencers shortlisted yet</p>
          <p className="text-sm text-muted-foreground">Tap the bookmark icon on any influencer card or profile to save them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {influencers.map((influencer) => (
            <InfluencerCard key={influencer._id} influencer={influencer} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

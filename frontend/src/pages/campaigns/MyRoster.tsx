import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Search, UserPlus, Trash2, Loader2, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { talentRosterApi } from "@/api/talentRoster";
import { influencerApi } from "@/api/influencers";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName } from "@/lib/utils";

// Shared by agency and talent_partner — both build the exact same
// consent-gated roster, just called "Creators/Influencers" vs "Our Creators"
// on their respective public profile pages.
export default function MyRoster() {
  const { user } = useAuth();
  const dashboardRole = (user?.role ?? "agency") as DashboardRole;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const { data: roster, isLoading: rosterLoading } = useQuery({ queryKey: ["talent-roster", "mine"], queryFn: talentRosterApi.mine });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["influencers", "roster-search", search],
    queryFn: () => influencerApi.list({ search, limit: 12 }),
    enabled: search.trim().length > 1,
  });

  const inviteMutation = useMutation({
    mutationFn: (influencerId: string) => talentRosterApi.invite(influencerId),
    onSuccess: () => setInviteError(null),
    onError: (err) => setInviteError(isAxiosError(err) ? err.response?.data?.message || "Failed to send invite" : "Something went wrong"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => talentRosterApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["talent-roster", "mine"] }),
  });

  const rosterInfluencerIds = new Set((roster ?? []).map((r) => r.influencer?._id));

  return (
    <DashboardLayout role={dashboardRole} title="Roster" subtitle="Invite influencers to your roster — they only appear on your public profile once they accept.">
      <Card>
        <CardContent className="space-y-3 p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Search className="h-4 w-4" /> Find Influencers to Invite
          </h3>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." />
          {inviteError && <p className="text-sm text-danger">{inviteError}</p>}
          {search.trim().length > 1 && (
            <div className="space-y-2">
              {searchLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : !searchResults?.data.length ? (
                <p className="text-sm text-muted-foreground">No influencers found.</p>
              ) : (
                searchResults.data.map((inf) => (
                  <div key={inf._id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={inf.avatar} alt={inf.name} />
                      <AvatarFallback className="bg-neutral-900 text-xs text-white">{initialsFromName(inf.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{inf.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{inf.influencerProfile?.niche || inf.influencerProfile?.category || "Influencer"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rosterInfluencerIds.has(inf._id) || inviteMutation.isPending}
                      onClick={() => inviteMutation.mutate(inf._id)}
                    >
                      {rosterInfluencerIds.has(inf._id) ? (
                        "On Roster"
                      ) : inviteMutation.isPending && inviteMutation.variables === inf._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" /> Invite
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4" /> My Roster ({roster?.length ?? 0})
          </h3>
          {rosterLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : !roster?.length ? (
            <p className="text-sm text-muted-foreground">No creators on your roster yet — invite one above.</p>
          ) : (
            <div className="space-y-2">
              {roster.map((r) => (
                <div key={r._id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={r.influencer?.avatar} alt={r.influencer?.name} />
                    <AvatarFallback className="bg-neutral-900 text-xs text-white">{initialsFromName(r.influencer?.name ?? "")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.influencer?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.influencer?.influencerProfile?.niche || r.influencer?.influencerProfile?.category}</p>
                  </div>
                  <button
                    type="button"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(r._id)}
                    className="text-danger hover:opacity-80 disabled:opacity-50"
                    aria-label="Remove from roster"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

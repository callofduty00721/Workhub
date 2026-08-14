import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, Handshake } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { talentRosterApi } from "@/api/talentRoster";
import { initialsFromName } from "@/lib/utils";

export default function RosterInvites() {
  const queryClient = useQueryClient();
  const { data: invites, isLoading } = useQuery({ queryKey: ["talent-roster", "pending"], queryFn: talentRosterApi.pending });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "declined" }) => talentRosterApi.respond(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["talent-roster", "pending"] }),
  });

  return (
    <DashboardLayout role="influencer" title="Roster Invites" subtitle="Agencies and talent partners who want to represent you — accepting adds you to their public profile.">
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !invites?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
              <Handshake className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No pending roster invites right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((inv) => (
                <div key={inv._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={inv.partner?.avatar} alt={inv.partner?.name} />
                      <AvatarFallback className="bg-neutral-900 text-sm text-white">{initialsFromName(inv.partner?.name ?? "")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{inv.partner?.name}</p>
                      {inv.partner?.headline && <p className="text-xs text-muted-foreground">{inv.partner.headline}</p>}
                      {inv.message && <p className="mt-1 text-xs text-muted-foreground">&ldquo;{inv.message}&rdquo;</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ id: inv._id, status: "declined" })}
                    >
                      {respondMutation.isPending && respondMutation.variables?.id === inv._id && respondMutation.variables.status === "declined" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="gradient"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ id: inv._id, status: "accepted" })}
                    >
                      {respondMutation.isPending && respondMutation.variables?.id === inv._id && respondMutation.variables.status === "accepted" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Accept
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

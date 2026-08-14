import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, Building2, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { agencyClientApi } from "@/api/agencyClients";
import { initialsFromName, formatCurrency } from "@/lib/utils";

// Agency's side of the Brand↔Agency delegation flow (see
// agencyClient.controller.js) — pending invites from brands to respond to,
// and the list of brands already managed.
export default function MyClients() {
  const queryClient = useQueryClient();

  const { data: pending, isLoading: pendingLoading } = useQuery({ queryKey: ["agency-clients", "pending"], queryFn: agencyClientApi.pending });
  const { data: managed, isLoading: managedLoading } = useQuery({ queryKey: ["agency-clients", "managed"], queryFn: agencyClientApi.managed });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "declined" }) => agencyClientApi.respond(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-clients", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["agency-clients", "managed"] });
    },
  });

  return (
    <DashboardLayout role="agency" title="My Clients" subtitle="Brands who've invited you to manage their campaigns.">
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-3 text-base font-semibold">Pending Invites</h3>
          {pendingLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !pending?.length ? (
            <p className="text-sm text-muted-foreground">No pending client invites right now.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((inv) => (
                <div key={inv._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={inv.brand?.avatar} alt={inv.brand?.name} />
                      <AvatarFallback className="bg-neutral-900 text-sm text-white">{initialsFromName(inv.brand?.name ?? "")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{inv.brand?.name}</p>
                      {!!inv.budget && <p className="text-xs text-muted-foreground">Budget: {formatCurrency(inv.budget)}</p>}
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

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4" /> Managed Clients ({managed?.length ?? 0})
          </h3>
          {managedLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : !managed?.length ? (
            <p className="text-sm text-muted-foreground">No clients yet — accept an invite above, or get one from your public profile.</p>
          ) : (
            <div className="space-y-2">
              {managed.map((row) => (
                <div key={row._id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={row.brand?.avatar} alt={row.brand?.name} />
                    <AvatarFallback className="bg-neutral-900 text-xs text-white">
                      <Building2 className="h-4 w-4" />
                      {initialsFromName(row.brand?.name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.brand?.name}</p>
                    {!!row.budget && <p className="truncate text-xs text-muted-foreground">Budget: {formatCurrency(row.budget)}</p>}
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

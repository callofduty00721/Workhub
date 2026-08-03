import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Wallet, Send, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { investmentApi } from "@/api/investments";
import { pitchApi } from "@/api/pitches";
import { useFounderInvestments } from "@/hooks/useFounderInvestments";
import { initialsFromName, formatCurrency } from "@/lib/utils";
import type { InvestmentStatus } from "@/types";

const STATUS_META: Record<InvestmentStatus, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending: { label: "Pending Confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  declined: { label: "Declined", variant: "danger" },
};

const NEW_INVESTOR_WINDOW_DAYS = 7;
function isRecentAccount(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < NEW_INVESTOR_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

const TABS = ["All", "Pending", "Confirmed", "Declined"] as const;

export default function FounderInvestors() {
  const queryClient = useQueryClient();
  const { investments, isLoading, pendingCount } = useFounderInvestments();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const { data: sentPitches, isLoading: pitchesLoading } = useQuery({ queryKey: ["pitches", "sent"], queryFn: pitchApi.sent });

  const statusMutation = useMutation({
    mutationFn: (variables: { investmentId: string; startupId: string; status: "confirmed" | "declined" }) =>
      investmentApi.updateStatus(variables.investmentId, variables.status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["startups", variables.startupId, "investments"] });
      queryClient.invalidateQueries({ queryKey: ["startups", variables.startupId] });
    },
  });

  const filtered = tab === "All" ? investments : investments.filter((inv) => inv.status === tab.toLowerCase());
  const totalConfirmed = investments.filter((inv) => inv.status === "confirmed").reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <DashboardLayout
      role="founder"
      title="Investors"
      subtitle={pendingCount > 0 ? `${pendingCount} investment report${pendingCount > 1 ? "s" : ""} waiting for your review.` : "Everyone who has reported investing across your startups."}
    >
      {!isLoading && investments.length > 0 && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-2xl font-bold">{investments.length}</p>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold">{investments.filter((i) => i.status === "confirmed").length}</p>
            <p className="text-xs text-muted-foreground">Confirmed Investors</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold">{formatCurrency(totalConfirmed)}</p>
            <p className="text-xs text-muted-foreground">Total Confirmed Amount</p>
          </Card>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No investors here yet</p>
            <p className="text-sm text-muted-foreground">When someone reports an investment in your startups, it&apos;ll show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const meta = STATUS_META[inv.status];
            return (
              <Card key={inv._id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
                      {inv.investor.avatar ? <img src={inv.investor.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : initialsFromName(inv.investor.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold">{inv.investor.name}</p>
                        {inv.verified && (
                          <Badge className="flex items-center gap-1 bg-primary/10 text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </Badge>
                        )}
                        {isRecentAccount(inv.investor.createdAt) && <Badge variant="danger">New Investor</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(inv.amount)} in{" "}
                        <Link to={`/startups/${inv.startup}`} className="text-primary hover:underline">
                          {inv.startupName}
                        </Link>{" "}
                        · {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                      {inv.note && <p className="mt-1 max-w-md text-xs text-foreground/80">{inv.note}</p>}
                      {inv.refunded && <p className="mt-1 text-xs text-muted-foreground">Verification fee auto-refunded (no response within 15 days).</p>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    {inv.status === "pending" && (
                      <>
                        <button
                          onClick={() => statusMutation.mutate({ investmentId: inv._id, startupId: inv.startup, status: "confirmed" })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg border border-success px-2.5 py-1 text-xs font-bold text-success hover:bg-success/10"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ investmentId: inv._id, startupId: inv.startup, status: "declined" })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-accent"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <h3 className="mb-3 text-base font-semibold">Pitches You've Sent</h3>
        {pitchesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !sentPitches?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Send className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No pitches sent yet — visit an investor's profile to pitch one of your startups.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sentPitches.map((p) => (
              <Card key={p._id}>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {p.startup.name} → {p.investor.name}
                    </p>
                    {p.message && <p className="mt-0.5 text-xs text-muted-foreground">{p.message}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={p.status === "viewed" ? "success" : "outline"} className="flex w-fit items-center gap-1">
                    {p.status === "viewed" && <Eye className="h-3 w-3" />}
                    {p.status === "viewed" ? "Viewed" : "Sent"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

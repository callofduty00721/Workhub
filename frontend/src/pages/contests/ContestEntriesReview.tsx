import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, Mail, MapPin, Trophy, ExternalLink, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { contestApi } from "@/api/contests";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCurrency } from "@/lib/utils";

export default function ContestEntriesReview({
  role = "employer",
  basePath = "/dashboard/employer",
}: {
  role?: "employer" | "client";
  basePath?: string;
}) {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [payError, setPayError] = useState<string | null>(null);

  const { data: contest } = useQuery({ queryKey: ["contests", id], queryFn: () => contestApi.getById(id), enabled: !!id });
  const { data: entries, isLoading } = useQuery({
    queryKey: ["contests", id, "entries"],
    queryFn: () => contestApi.entries(id),
    enabled: !!id,
  });

  const { data: myPayments } = useQuery({ queryKey: ["payments", "mine", "all"], queryFn: () => paymentApi.myPayments({ limit: 200 }) });
  const prizePaid = (myPayments?.data ?? []).some((p) => p.type === "contest_prize" && p.status === "paid" && p.contest === id);

  const pickWinnerMutation = useMutation({
    mutationFn: (entryId: string) => contestApi.pickWinner(id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests", id, "entries"] });
      queryClient.invalidateQueries({ queryKey: ["contests", id] });
    },
  });

  const payMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createContestPrizePayment(id, entryId),
        verify: (payload) => paymentApi.verifyMarketplacePayment(payload),
        description: contest ? `Prize for ${contest.title}` : "Contest prize",
        prefill: { name: user!.name, email: user!.email },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments", "mine"] }),
      });
    },
    onError: (err) => setPayError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable"),
  });

  const isClosed = contest?.status === "closed";

  return (
    <DashboardLayout
      role={role}
      title={contest ? `Entries for ${contest.title}` : "Contest Entries"}
      subtitle="Review submissions and pick a winner."
    >
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={`${basePath}/contests`}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Contests
        </Link>
      </Button>

      {payError && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{payError}</div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !entries?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium">No entries yet</p>
            <p className="text-sm text-muted-foreground">Once freelancers submit entries, they&apos;ll show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const freelancer = typeof entry.freelancer === "object" ? entry.freelancer : null;
            return (
              <Card key={entry._id} className={entry.isWinner ? "border-success" : undefined}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                      {freelancer ? initialsFromName(freelancer.name) : "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{freelancer?.name}</p>
                        {entry.isWinner && (
                          <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                            <Trophy className="h-3 w-3" /> Winner
                          </Badge>
                        )}
                      </div>
                      {freelancer?.headline && <p className="text-xs text-muted-foreground">{freelancer.headline}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {freelancer?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {freelancer.email}
                          </span>
                        )}
                        {freelancer?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {freelancer.location}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium">{entry.title}</p>
                      <p className="mt-1 line-clamp-3 max-w-md text-xs text-foreground/80">{entry.description}</p>
                      {entry.fileUrl && (
                        <a
                          href={entry.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View submitted file
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {!entry.isWinner && !isClosed && (
                      <Button
                        variant="gradient"
                        size="sm"
                        disabled={pickWinnerMutation.isPending}
                        onClick={() => pickWinnerMutation.mutate(entry._id)}
                      >
                        {pickWinnerMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
                        Pick as Winner
                      </Button>
                    )}
                    {entry.isWinner &&
                      (prizePaid ? (
                        <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Prize Paid
                        </Badge>
                      ) : (
                        <Button variant="gradient" size="sm" disabled={payMutation.isPending} onClick={() => payMutation.mutate(entry._id)}>
                          {payMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                          Pay {contest ? formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD") : "Prize"}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

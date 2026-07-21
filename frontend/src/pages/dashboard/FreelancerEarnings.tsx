import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Briefcase, FolderKanban, Trophy } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentApi } from "@/api/payments";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { PaymentType } from "@/types";

const TYPE_LABELS: Record<PaymentType, string> = {
  gig_order: "Gig Order",
  job_hire: "Job / Project",
  contest_prize: "Contest Prize",
};

const TYPE_ICONS: Record<PaymentType, typeof Briefcase> = {
  gig_order: Briefcase,
  job_hire: FolderKanban,
  contest_prize: Trophy,
};

export default function FreelancerEarnings() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["payments", "earnings", { page }],
    queryFn: () => paymentApi.myEarnings({ page, limit: 20 }),
  });

  return (
    <DashboardLayout role="freelancer" title="Earnings" subtitle="Track payments you've received for gigs, projects, and contests.">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                  <p className="text-lg font-bold">{formatCurrency(data?.totalEarnings ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
            {(["gig_order", "job_hire", "contest_prize"] as PaymentType[]).map((type) => {
              const Icon = TYPE_ICONS[type];
              return (
                <Card key={type}>
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{TYPE_LABELS[type]}</p>
                      <p className="text-lg font-bold">{formatCurrency(data?.byType[type] ?? 0)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Payment History</h3>
              {!data?.payments.length ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No payments received yet</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Earnings from ordered gigs, hired projects, and won contests will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.payments.map((payment) => {
                    const payer = typeof payment.payer === "object" ? payment.payer : null;
                    return (
                      <div key={payment._id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white">
                            {payer ? initialsFromName(payer.name) : "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{payer?.name ?? "Client"}</p>
                            <p className="truncate text-xs text-muted-foreground">{payment.note || TYPE_LABELS[payment.type]}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABELS[payment.type]}
                          </Badge>
                          <span className="text-sm font-semibold text-success">{formatCurrency(payment.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {data && data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

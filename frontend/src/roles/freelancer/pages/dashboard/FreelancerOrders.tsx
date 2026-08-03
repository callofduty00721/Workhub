import { useQuery } from "@tanstack/react-query";
import { Briefcase, FolderKanban, Trophy, Megaphone, ClipboardList } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusPanel } from "@/components/payments/OrderStatusPanel";
import { paymentApi } from "@/api/payments";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { PaymentType } from "@/types";

const TYPE_LABELS: Record<PaymentType, string> = {
  gig_order: "Gig Order",
  job_hire: "Job / Project",
  contest_prize: "Contest Prize",
  campaign: "Influencer Campaign",
};

const TYPE_ICONS: Record<PaymentType, typeof Briefcase> = {
  gig_order: Briefcase,
  job_hire: FolderKanban,
  contest_prize: Trophy,
  campaign: Megaphone,
};

export default function FreelancerOrders() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["payments", "earnings", "orders"],
    queryFn: () => paymentApi.myEarnings({ limit: 200 }),
  });

  const orders = (data?.payments ?? []).filter((p) => p.orderStatus && p.orderStatus !== "not_applicable");

  return (
    <DashboardLayout role="freelancer" title="My Orders" subtitle="Track and deliver work for the gigs and projects you've been paid for.">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm font-medium">No active orders yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">Once a client pays for one of your gigs or hires you for a project, it'll show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((payment) => {
            const payer = typeof payment.payer === "object" ? payment.payer : null;
            const payee = typeof payment.payee === "object" ? payment.payee : null;
            const isTeammateOrder = !!payee && payee._id !== user?.id;
            const Icon = TYPE_ICONS[payment.type];
            return (
              <Card key={payment._id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white">
                        {payer ? initialsFromName(payer.name) : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{payer?.name ?? "Client"}</p>
                        <p className="truncate text-xs text-muted-foreground">{payment.note || TYPE_LABELS[payment.type]}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isTeammateOrder && payee && (
                        <Badge variant="secondary" className="text-[10px]">
                          For {payee.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[payment.type]}
                      </Badge>
                      <span className="text-sm font-semibold text-success">{formatCurrency(payment.netAmount || payment.amount)}</span>
                    </div>
                  </div>
                  <OrderStatusPanel payment={payment} viewerRole="freelancer" invalidateKey={["payments", "earnings", "orders"]} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Users, CheckCircle2, Clock, Banknote, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { formatCurrency, cn } from "@/lib/utils";
import type { AdminSubscriptionRow } from "@/api/admin";

// Same stagger pattern as AdminOverview.tsx's stat-card grid — quick,
// subtle entrance rather than an instant pop-in.
const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const PROVIDER_OPTIONS = [
  { value: "all", label: "All gateways" },
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
];

const TIER_OPTIONS = [
  { value: "all", label: "All tiers" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

function isLapsed(sub: AdminSubscriptionRow) {
  return sub.status === "active" && sub.expiresAt !== undefined && new Date(sub.expiresAt) <= new Date();
}

function statusBadge(sub: AdminSubscriptionRow) {
  if (sub.status === "active" && isLapsed(sub)) return <Badge variant="warning">Expired</Badge>;
  if (sub.status === "active") return <Badge variant="success">Active</Badge>;
  if (sub.status === "pending") return <Badge variant="outline">Pending</Badge>;
  if (sub.status === "failed") return <Badge variant="danger">Failed</Badge>;
  if (sub.status === "cancelled") return <Badge variant="outline">Cancelled</Badge>;
  return <Badge variant="outline">{sub.status}</Badge>;
}

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [tier, setTier] = useState("all");
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "stats"],
    queryFn: adminApi.subscriptionStats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions", { search, status, provider, tier, page }],
    queryFn: () =>
      adminApi.subscriptions({
        search: search || undefined,
        status: status === "all" ? undefined : status,
        provider: provider === "all" ? undefined : provider,
        tier: tier === "all" ? undefined : tier,
        page,
        limit: 20,
      }),
  });

  const metrics = [
    { label: "Total Subscribers", value: stats?.totalSubscribers ?? 0, icon: Users, accent: "text-[#2563EB] bg-[#EFF6FF]", format: "count" as const },
    { label: "Active", value: stats?.activeCount ?? 0, icon: CheckCircle2, accent: "text-[#16A34A] bg-[#ECFDF3]", format: "count" as const },
    { label: "Expired", value: stats?.expiredCount ?? 0, icon: Clock, accent: "text-[#D97706] bg-[#FFFBEB]", format: "count" as const },
    { label: "Revenue", value: stats?.revenue ?? 0, icon: Banknote, accent: "text-[#7C3AED] bg-[#F5F3FF]", format: "currency" as const },
  ];
  // Cancelled has no way to happen yet (no cancel endpoint exists) — only
  // show the tile once it's actually possible to have a nonzero count, so
  // it isn't a permanently-dead "0" card in the meantime.
  if ((stats?.cancelledCount ?? 0) > 0) {
    metrics.push({ label: "Cancelled", value: stats!.cancelledCount, icon: XCircle, accent: "text-[#DC2626] bg-[#FEF2F2]", format: "count" as const });
  }

  return (
    <DashboardLayout role="super_admin" title="Subscriptions" subtitle="Every plan subscription across the platform, and what it's worth.">
      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div variants={gridVariants} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <motion.div key={m.label} variants={cardVariants}>
              <Card className="rounded-2xl p-5 transition-shadow duration-200 hover:shadow-md">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", m.accent)}>
                  <m.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                  {m.format === "currency" ? formatCurrency(m.value) : m.value.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="mb-5 mt-6 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={provider}
          onValueChange={(v) => {
            setPage(1);
            setProvider(v);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tier}
          onValueChange={(v) => {
            setPage(1);
            setTier(v);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No subscriptions match these filters.</p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Billing Cycle</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Gateway</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((sub) => (
                <tr key={sub._id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="truncate font-medium">{sub.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{sub.user.email}</p>
                  </td>
                  <td className="px-5 py-3">{sub.planName}</td>
                  <td className="px-5 py-3 capitalize text-muted-foreground">{sub.billingCycle}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(sub.amount)}</td>
                  <td className="px-5 py-3 capitalize text-muted-foreground">{sub.provider}</td>
                  <td className="px-5 py-3">{statusBadge(sub)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/subscriptions/${sub._id}/invoice`)}>
                      View Invoice
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
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
    </DashboardLayout>
  );
}

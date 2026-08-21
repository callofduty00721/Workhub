import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Rocket, Briefcase, Wrench, Trophy, FileText, ShieldCheck, Flag, AlertTriangle, Scale, Banknote, CheckCircle2, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import { formatCompactNumber, cn } from "@/lib/utils";

// Shared stagger containers/items for the two card grids below — kept small
// and quick (30-40ms steps, ~0.3s each) since these are dashboard metrics an
// admin will look at repeatedly, not a one-time landing page hero.
const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const METRICS = [
  { key: "totalUsers" as const, label: "Total Users", icon: Users, accent: "text-[#2563EB] bg-[#EFF6FF]" },
  { key: "totalStartups" as const, label: "Total Startups", icon: Rocket, accent: "text-[#7C3AED] bg-[#F5F3FF]" },
  { key: "totalJobs" as const, label: "Total Jobs", icon: Briefcase, accent: "text-[#16A34A] bg-[#ECFDF3]" },
  { key: "totalServices" as const, label: "Total Services", icon: Wrench, accent: "text-[#D97706] bg-[#FFFBEB]" },
  { key: "totalContests" as const, label: "Total Contests", icon: Trophy, accent: "text-[#DB2777] bg-[#FDF2F8]" },
];

// Each review-queue count comes straight from the same endpoint its own admin
// page uses to list them — nothing here is estimated or cached separately,
// so this panel can never drift out of sync with what an admin sees after
// clicking through.
function useReviewQueueCounts() {
  const kyc = useQuery({ queryKey: ["admin", "kyc-requests", "count"], queryFn: () => adminApi.kycRequests({ limit: 1 }) });
  const roleVerifications = useQuery({
    queryKey: ["admin", "role-verifications", "count"],
    queryFn: () => adminApi.roleVerificationRequests({ limit: 1 }),
  });
  const flaggedStartups = useQuery({ queryKey: ["admin", "flagged-startups"], queryFn: adminApi.flaggedStartups });
  const grievances = useQuery({
    queryKey: ["admin", "grievances", "open"],
    queryFn: () => adminApi.grievances({ status: "open", limit: 1 }),
  });
  const disputes = useQuery({
    queryKey: ["admin", "payments", "disputes"],
    queryFn: () => adminApi.payments({ disputeStatus: "raised", limit: 1 }),
  });
  const withdrawals = useQuery({
    queryKey: ["admin", "withdrawals", "pending"],
    queryFn: () => adminApi.withdrawals({ status: "pending", limit: 1 }),
  });

  const isLoading =
    kyc.isLoading || roleVerifications.isLoading || flaggedStartups.isLoading || grievances.isLoading || disputes.isLoading || withdrawals.isLoading;

  return {
    isLoading,
    queues: [
      { label: "KYC Requests", to: "/dashboard/admin/kyc", icon: FileText, count: kyc.data?.pagination.total ?? 0 },
      {
        label: "Role Verifications",
        to: "/dashboard/admin/role-verifications",
        icon: ShieldCheck,
        count: roleVerifications.data?.pagination.total ?? 0,
      },
      { label: "Flagged Startups", to: "/dashboard/admin/flagged-startups", icon: Flag, count: flaggedStartups.data?.length ?? 0 },
      { label: "Open Grievances", to: "/dashboard/admin/grievances", icon: AlertTriangle, count: grievances.data?.pagination.total ?? 0 },
      { label: "Payment Disputes", to: "/dashboard/admin/payments", icon: Scale, count: disputes.data?.pagination.total ?? 0 },
      { label: "Pending Withdrawals", to: "/dashboard/admin/withdrawals", icon: Banknote, count: withdrawals.data?.pagination.total ?? 0 },
    ],
  };
}

export default function AdminOverview() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats });
  const { queues, isLoading: queuesLoading } = useReviewQueueCounts();

  const roleEntries = stats
    ? (Object.entries(stats.roleBreakdown) as [keyof typeof ROLE_LABELS, number][])
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
    : [];
  const maxRoleCount = roleEntries[0]?.[1] ?? 1;

  return (
    <DashboardLayout role="super_admin" title="Admin Overview" subtitle="Platform-wide metrics and user breakdown.">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {METRICS.map((m) => (
            <motion.div key={m.key} variants={cardVariants}>
              <Card className="rounded-2xl p-5 transition-shadow duration-200 hover:shadow-md">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", m.accent)}>
                  <m.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatCompactNumber(stats?.[m.key] ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-foreground">Needs Review</h3>
        {queuesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {queues.map((q) => {
              const pending = q.count > 0;
              return (
                <motion.div key={q.label} variants={cardVariants} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={q.to}
                    className={cn(
                      "group flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors duration-200 hover:shadow-md",
                      pending ? "border-[#FDE68A] bg-[#FFFBEB]" : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          pending ? "bg-[#FEF3C7] text-[#B45309]" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {pending ? <q.icon className="h-4.5 w-4.5" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{q.label}</p>
                        <p className={cn("text-xs", pending ? "font-medium text-[#B45309]" : "text-muted-foreground")}>
                          {pending ? `${q.count} pending` : "All clear"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <Card className="mt-6 rounded-2xl">
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Users by Role</h3>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : roleEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {roleEntries.map(([role, count], i) => (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-36 shrink-0 truncate text-sm text-muted-foreground">{ROLE_LABELS[role]}</span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((count / maxRoleCount) * 100, 3)}%` }}
                      transition={{ duration: 0.6, delay: 0.15 + i * 0.03, ease: "easeOut" }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-semibold text-foreground">{count}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Gift } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { formatCurrency, initialsFromName } from "@/lib/utils";

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function AdminReferrals() {
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "referrals", "stats"],
    queryFn: adminApi.referralStats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "referrals", page],
    queryFn: () => adminApi.topReferrers({ page, limit: 20 }),
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Referrals"
      subtitle="Who's bringing in new users, and what's been paid out for it — visibility only, there's no payout/redemption flow to manage yet."
    >
      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div variants={gridVariants} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
          <motion.div variants={cardVariants}>
            <Card className="rounded-2xl p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                <Users className="h-5 w-5" />
              </span>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {(stats?.referredUserCount ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">Users referred (all time)</p>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-2xl p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">
                <Gift className="h-5 w-5" />
              </span>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatCurrency(stats?.totalBonusPaid ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Total referral bonus credited</p>
            </Card>
          </motion.div>
        </motion.div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-foreground">Top Referrers</h3>
        <Card className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.data.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No one has earned a referral bonus yet.</p>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Referral Code</th>
                  <th className="px-5 py-3 font-medium text-right">People Referred</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                  <th className="px-5 py-3 font-medium text-right">Lifetime Total</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((u) => (
                  <tr key={u._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback className="text-[10px]">{initialsFromName(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{u.referralCode}</td>
                    <td className="px-5 py-3 text-right">{u.referredCount}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(u.referralBonusBalance)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(u.referralBonusTotal)}</td>
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
      </div>
    </DashboardLayout>
  );
}

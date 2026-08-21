import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { ADMIN_PERMISSION_LABELS } from "@/types";
import type { AdminActivityEntry } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  ...ADMIN_PERMISSION_LABELS,
  withdrawals: "Withdrawals",
  payments: "Payment Disputes",
};

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function AdminActivity() {
  const { data: entries, isLoading } = useQuery({ queryKey: ["admin", "activity"], queryFn: adminApi.activity });

  return (
    <DashboardLayout
      role="super_admin"
      title="Staff Activity"
      subtitle="Every review action across the admin panel — yours and any staff account's — with who did it and when."
    >
      <Card className="divide-y divide-border">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !entries?.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-sm text-muted-foreground">KYC reviews, grievance resolutions, and other admin actions will show up here.</p>
          </div>
        ) : (
          <motion.div variants={gridVariants} initial="hidden" animate="show" className="divide-y divide-border">
          {entries.map((entry: AdminActivityEntry, i: number) => (
            <motion.div key={i} variants={rowVariants} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="shrink-0 text-[11px]">
                  {TYPE_LABELS[entry.type] ?? entry.type}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{entry.detail}</p>
                  <p className="text-xs text-muted-foreground">{entry.target}</p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>
                  {entry.actor ? (
                    <>
                      {entry.actor.name}{" "}
                      {entry.actor.role === "staff" && (
                        <Badge variant="outline" className="text-[10px]">
                          Staff
                        </Badge>
                      )}
                    </>
                  ) : (
                    "Unknown"
                  )}
                </p>
                <p>{new Date(entry.at).toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </Card>
    </DashboardLayout>
  );
}

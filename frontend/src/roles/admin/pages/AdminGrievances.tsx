import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { CheckCircle2, MailCheck, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/api/admin";
import { cn } from "@/lib/utils";
import type { Grievance, GrievanceStatus } from "@/types";

// IT Rules 2021 deadlines this page is built to help admins watch:
// acknowledge within 24 hours of submission, resolve within 15 days.
const ACKNOWLEDGE_DEADLINE_HOURS = 24;
const RESOLVE_DEADLINE_DAYS = 15;

const TABS: { value: GrievanceStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
];

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function hoursSince(dateStr: string) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function AcknowledgeDeadlineBadge({ grievance }: { grievance: Grievance }) {
  if (grievance.status !== "open") return null;
  const hoursLeft = ACKNOWLEDGE_DEADLINE_HOURS - hoursSince(grievance.createdAt);
  const overdue = hoursLeft < 0;
  return (
    <Badge variant="outline" className={cn(overdue ? "border-danger/40 text-danger" : "border-warning/40 text-warning")}>
      {overdue ? "Acknowledge overdue" : `Acknowledge within ${Math.ceil(hoursLeft)}h`}
    </Badge>
  );
}

function ResolveDeadlineBadge({ grievance }: { grievance: Grievance }) {
  if (grievance.status === "resolved") return null;
  const daysLeft = RESOLVE_DEADLINE_DAYS - hoursSince(grievance.createdAt) / 24;
  const overdue = daysLeft < 0;
  return (
    <Badge variant="outline" className={cn(overdue ? "border-danger/40 text-danger" : "border-border text-muted-foreground")}>
      {overdue ? "Resolve overdue" : `Resolve within ${Math.ceil(daysLeft)}d`}
    </Badge>
  );
}

export default function AdminGrievances() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<GrievanceStatus>("open");
  const [resolving, setResolving] = useState<Grievance | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "grievances", tab],
    queryFn: () => adminApi.grievances({ status: tab, limit: 50 }),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (grievanceId: string) => adminApi.updateGrievance(grievanceId, "acknowledge"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "grievances"] }),
  });

  const resolveMutation = useMutation({
    mutationFn: () => adminApi.updateGrievance(resolving!._id, "resolve", note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "grievances"] });
      setResolving(null);
      setNote("");
    },
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Grievances"
      subtitle="Contact form submissions and IT Rules 2021 grievances — acknowledge within 24 hours, resolve within 15 days."
    >
      <div className="mb-4 flex items-center gap-2 rounded-full border border-border p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-border">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">No {tab} grievances</p>
            <p className="text-sm text-muted-foreground">Contact form submissions will show up here.</p>
          </div>
        ) : (
          <motion.div variants={gridVariants} initial="hidden" animate="show" className="divide-y divide-border">
          {data.data.map((g) => (
            <motion.div key={g._id} variants={rowVariants} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{g.subject || "(No subject)"}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.name} · {g.email} · {new Date(g.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AcknowledgeDeadlineBadge grievance={g} />
                  <ResolveDeadlineBadge grievance={g} />
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{g.message}</p>
              {g.status === "resolved" && g.adminNote && (
                <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  <strong>Resolution:</strong> {g.adminNote}
                </p>
              )}
              {g.status !== "resolved" && (
                <div className="mt-3 flex items-center gap-2">
                  {g.status === "open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={acknowledgeMutation.isPending}
                      onClick={() => acknowledgeMutation.mutate(g._id)}
                    >
                      <MailCheck className="h-3.5 w-3.5" /> Acknowledge
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-success hover:bg-success/10" onClick={() => setResolving(g)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
          </motion.div>
        )}
      </Card>

      <Dialog open={!!resolving} onOpenChange={(open) => !open && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve this grievance?</DialogTitle>
            <DialogDescription>Add a note on how this was handled — kept on record.</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note..." className="min-h-[100px]" />
          {resolveMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(resolveMutation.error) ? resolveMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button className="mt-2 w-full" variant="gradient" disabled={resolveMutation.isPending || !note.trim()} onClick={() => resolveMutation.mutate()}>
            {resolveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Resolved
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

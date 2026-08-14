import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Rocket, Briefcase, Wallet, ArrowUpRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { startupApi } from "@/api/startups";
import { cn, formatFundingCompact } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending_review: { label: "Pending Review", className: "bg-warning/10 text-warning" },
  published: { label: "Published", className: "bg-success/10 text-success" },
};

// The six real stages a startup moves through — order carries meaning here,
// so a ladder is the right visual (not decoration, an actual progression).
const STAGE_ORDER = [
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

function StageLadder({ stage }: { stage: string }) {
  const activeIdx = Math.max(0, STAGE_ORDER.findIndex((s) => s.value === stage));
  return (
    <div className="flex items-center">
      {STAGE_ORDER.map((s, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        return (
          <div key={s.value} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "shrink-0 rounded-full transition-colors",
                  current ? "h-3 w-3 bg-primary ring-4 ring-primary/15" : done ? "h-2 w-2 bg-primary/60" : "h-2 w-2 bg-muted"
                )}
              />
              <span className={cn("hidden whitespace-nowrap text-[9px] font-semibold sm:block", current ? "text-primary" : "text-muted-foreground/70")}>
                {s.label}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <div className="mx-1 h-[2px] flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: done ? 1 : 0 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="h-full bg-primary/60"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LivePill({ icon: Icon, tone = "primary", children }: { icon: typeof Briefcase; tone?: "primary" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold",
        tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {tone === "primary" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", tone === "primary" ? "bg-primary" : "bg-muted-foreground/60")} />
      </span>
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}

export default function MyStartups() {
  const { data: myStartups, isLoading } = useQuery({ queryKey: ["startups", "mine"], queryFn: startupApi.mine });

  return (
    <DashboardLayout
      role="founder"
      title="My Startups"
      subtitle="Manage every startup you've posted on GrowHive."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/founder/startup">
            <Plus className="h-4 w-4" /> New Startup
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : myStartups?.length ? (
            <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-3">
              {myStartups.map((s) => {
                const statusMeta = STATUS_LABELS[s.status] ?? STATUS_LABELS.draft;
                const openRoleCount = s.openRoles?.length ?? 0;
                const isHiring = openRoleCount > 0;
                const isSeekingInvestment = (s.fundingRaised ?? 0) < (s.fundingNeeded ?? 0) && (s.fundingNeeded ?? 0) > 0;

                return (
                  <motion.div
                    key={s._id}
                    variants={fadeUp}
                    whileHover={{ y: -3 }}
                    className="group rounded-2xl border border-border p-4 transition-colors hover:border-primary/30 hover:shadow-hover"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
                        {s.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display font-bold">{s.name}</p>
                          <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{s.tagline}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline">{s.industry}</Badge>
                          <Badge variant="outline">{s.location}</Badge>
                          {isHiring && (
                            <LivePill icon={Briefcase}>
                              Hiring {openRoleCount} role{openRoleCount === 1 ? "" : "s"}
                            </LivePill>
                          )}
                          {isSeekingInvestment ? (
                            <LivePill icon={Wallet}>Seeking {formatFundingCompact(s.fundingNeeded - (s.fundingRaised ?? 0))}</LivePill>
                          ) : (s.fundingNeeded ?? 0) > 0 ? (
                            <LivePill icon={Wallet} tone="muted">
                              Fully Funded
                            </LivePill>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/dashboard/founder/startup/${s._id}`}>Edit</Link>
                        </Button>
                        {s.status === "published" && (
                          <Button variant="outline" size="sm" asChild className="group/view">
                            <Link to={`/startups/${s._id}`} className="flex items-center gap-1">
                              View
                              <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover/view:translate-x-0.5 group-hover/view:-translate-y-0.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Stage progression — the same six-stage ladder used across GrowHive */}
                    <div className="mt-4 border-t border-border pt-3">
                      <StageLadder stage={s.stage} />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
              <Rocket className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You haven&apos;t posted a startup yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Share your idea and start connecting with investors, mentors and partners.
              </p>
              <Button variant="gradient" asChild size="sm" className="mt-1">
                <Link to="/dashboard/founder/startup">Post Your Startup</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

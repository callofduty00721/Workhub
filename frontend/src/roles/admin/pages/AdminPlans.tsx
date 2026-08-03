import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Check, X, Pencil } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { Plan, PlanRole, PlanTier } from "@/types";

const TIER_LABELS: Record<PlanTier, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const TIER_ORDER: PlanTier[] = ["free", "pro", "enterprise"];

export default function AdminPlans() {
  const { data: plans, isLoading } = useQuery({ queryKey: ["admin", "plans"], queryFn: adminApi.plans });

  const grouped = plans?.reduce<Record<string, Plan[]>>((acc, plan) => {
    (acc[plan.role] ??= []).push(plan);
    return acc;
  }, {});

  return (
    <DashboardLayout role="super_admin" title="Plans" subtitle="Edit pricing and features for each role's Free / Pro / Enterprise plan.">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped ?? {}).map(([role, rolePlans]) => (
            <div key={role}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{ROLE_LABELS[role as PlanRole] ?? role}</h3>
              <div className="grid gap-4 lg:grid-cols-3">
                {TIER_ORDER.map((tier) => {
                  const plan = rolePlans.find((p) => p.tier === tier);
                  return plan ? <PlanCard key={plan._id} plan={plan} /> : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [priceInInr, setPriceInInr] = useState(String(plan.priceInInr));
  const [featuresText, setFeaturesText] = useState(plan.features.join("\n"));
  const [maxListings, setMaxListings] = useState(String(plan.maxListings));

  useEffect(() => {
    setName(plan.name);
    setPriceInInr(String(plan.priceInInr));
    setFeaturesText(plan.features.join("\n"));
    setMaxListings(String(plan.maxListings));
  }, [plan]);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updatePlan(plan._id, {
        name,
        priceInInr: Number(priceInInr),
        features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
        maxListings: Number(maxListings),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Plan[]>(["admin", "plans"], (prev) => prev?.map((p) => (p._id === updated._id ? updated : p)));
      setEditing(false);
    },
  });

  const price = Number(priceInInr);
  const listings = Number(maxListings);
  const isValid = name.trim() !== "" && !Number.isNaN(price) && price >= 0 && !Number.isNaN(listings) && (listings === -1 || listings >= 0);

  return (
    <Card className={cn(plan.tier === "pro" && "border-primary/30")}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{TIER_LABELS[plan.tier]}</span>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {editing ? (
          <>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name" />
            <div className="relative">
              <Input
                type="number"
                min={0}
                value={priceInInr}
                onChange={(e) => setPriceInInr(e.target.value)}
                className="pl-7"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
            </div>
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={4}
              placeholder="One feature per line"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs"
            />
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Max active listings (-1 = unlimited)</label>
              <Input type="number" min={-1} value={maxListings} onChange={(e) => setMaxListings(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="gradient" disabled={!isValid || mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={mutation.isPending}
                onClick={() => {
                  setEditing(false);
                  setName(plan.name);
                  setPriceInInr(String(plan.priceInInr));
                  setFeaturesText(plan.features.join("\n"));
                  setMaxListings(String(plan.maxListings));
                }}
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
            {mutation.isError && (
              <p className="text-xs text-danger">
                {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-foreground">{plan.name}</p>
            <p className="text-xl font-extrabold tabular-nums text-foreground">
              ₹{plan.priceInInr}
              {plan.priceInInr > 0 && <span className="text-xs font-normal text-muted-foreground">/month</span>}
            </p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-muted-foreground">
                  • {f}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              Max listings: {plan.maxListings === -1 ? "Unlimited" : plan.maxListings}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

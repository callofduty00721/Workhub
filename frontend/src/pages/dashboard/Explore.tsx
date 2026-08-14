import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { UserCircle2, Compass, Rocket, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { rolesApi } from "@/api/roles";
import { CATEGORY_LABELS, CATEGORY_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, dashboardPathForRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { RoleCategory, UserRole } from "@/types";

const CATEGORY_OPTIONS: { value: RoleCategory; desc: string; icon: typeof Rocket }[] = [
  { value: "talent", desc: "Find gigs, jobs, or grow as a creator", icon: Briefcase },
  { value: "hiring", desc: "Hire freelancers or full-time employees", icon: Building2 },
  { value: "startup", desc: "Build, invest in, or support startups", icon: Rocket },
];

// One accent per category — echoes the GrowHive mark (teal/emerald "Grow" +
// orange "Hive"), plus violet for Startup Ecosystem as a third, distinct
// identity. Scoped to just this page rather than changing --primary
// globally (that's every button/accent app-wide, a much bigger call).
const CATEGORY_STYLES: Record<
  RoleCategory,
  { iconBg: string; iconColor: string; border: string; tint: string; ring: string; gradient: string }
> = {
  talent: {
    iconBg: "bg-teal-100 dark:bg-teal-500/15",
    iconColor: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500",
    tint: "bg-teal-50 dark:bg-teal-500/10",
    ring: "ring-teal-500/30",
    gradient: "from-teal-500 to-emerald-500",
  },
  hiring: {
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
    tint: "bg-amber-50 dark:bg-amber-500/10",
    ring: "ring-amber-500/30",
    gradient: "from-amber-500 to-orange-500",
  },
  startup: {
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500",
    tint: "bg-violet-50 dark:bg-violet-500/10",
    ring: "ring-violet-500/30",
    gradient: "from-violet-500 to-purple-500",
  },
};

// Landing spot for a registered user who hasn't picked a role yet. Nothing
// here is role-gated: a banner for the (role-independent) basic profile, and
// the role picker itself shown inline (category -> roles) rather than tucked
// behind a modal click, so a first-time visitor sees the actual options
// right on this page. Once a role is picked, this page has no more reason to
// be visited — but the very first time it does get one, it detours through
// profile completion rather than dropping straight into an empty dashboard.
export default function Explore() {
  const { user, refreshUser } = useAuth();
  const [category, setCategory] = useState<RoleCategory | null>(null);
  const [checked, setChecked] = useState<Set<UserRole>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const hasBasics = Boolean(user?.avatar || user?.bio || user?.location);

  if (user?.role) {
    return <Navigate to={hasBasics ? dashboardPathForRole(user.role) : "/dashboard/profile"} replace />;
  }

  const toggleRole = (role: UserRole) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!category || checked.size === 0) return;
    setSubmitting(true);
    try {
      await rolesApi.selectCategory(category);
      await rolesApi.addRoles(Array.from(checked));
      await refreshUser();
      // Redirect happens automatically once user.role is set (see the
      // Navigate above) — refreshUser() re-renders this component with it.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome to GrowHive, {user?.name?.split(" ")[0]}.</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You're in — no role picked yet. Browse around, and choose what you're here to do whenever you're ready.
        </p>
      </div>

      {!hasBasics && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Complete your basic profile</p>
              <p className="text-xs text-muted-foreground">A photo, location, and short bio — works no matter what role you pick.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="flex-shrink-0">
            <Link to="/dashboard/profile">Complete</Link>
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-amber-500 to-violet-500">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Choose your role</p>
            <p className="text-xs text-muted-foreground">Pick a category, then any specific roles that fit — you can add more anytime.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {CATEGORY_OPTIONS.map((opt) => {
            const style = CATEGORY_STYLES[opt.value];
            const active = category === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategory(opt.value);
                  setChecked(new Set());
                }}
                className={cn(
                  "flex flex-col items-start gap-2.5 rounded-lg border-2 p-3.5 text-left transition-all",
                  active ? cn(style.border, style.tint, "ring-2", style.ring) : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                )}
              >
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", active ? style.iconBg : "bg-muted")}>
                  <opt.icon className={cn("h-4.5 w-4.5", active ? style.iconColor : "text-muted-foreground")} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[opt.value]}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {category && (
          <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-medium text-muted-foreground">Pick as many as apply:</p>
            {CATEGORY_ROLES[category].map((role) => {
              const style = CATEGORY_STYLES[category];
              const active = checked.has(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border-2 p-3 text-left transition-all",
                    active ? cn(style.border, style.tint) : "border-border bg-card hover:bg-accent/40"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{ROLE_LABELS[role]}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white transition-colors",
                      active ? cn(style.border, "bg-gradient-to-br", style.gradient) : "border-border"
                    )}
                  >
                    {active ? "✓" : ""}
                  </span>
                </button>
              );
            })}

            <Button
              className={cn(
                "mt-2 w-full bg-gradient-to-r text-white shadow-md transition-opacity hover:opacity-90",
                CATEGORY_STYLES[category].gradient
              )}
              disabled={checked.size === 0 || submitting}
              onClick={handleConfirm}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

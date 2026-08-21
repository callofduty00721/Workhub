import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { isAxiosError } from "axios";
import { UserCircle2, Compass, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { rolesApi } from "@/api/roles";
import { CATEGORY_LABELS, CATEGORY_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, dashboardPathForRole } from "@/lib/roles";
import { CATEGORY_OPTIONS, CATEGORY_STYLES } from "@/lib/categoryUI";
import { cn } from "@/lib/utils";
import type { RoleCategory, UserRole } from "@/types";

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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      await rolesApi.selectCategory(category);
      await rolesApi.addRoles(Array.from(checked));
      await refreshUser();
      // Redirect happens automatically once user.role is set (see the
      // Navigate above) — refreshUser() re-renders this component with it.
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || "Something went wrong. Please try again." : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to GrowHive, {user?.name?.split(" ")[0]}.</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You're in — no role picked yet. Browse around, and choose what you're here to do whenever you're ready.
        </p>
      </div>

      {!hasBasics && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            </span>
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

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-amber-500 to-violet-500 shadow-glow">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Choose your role</p>
            <p className="text-xs text-muted-foreground">Pick a category, then any specific roles that fit — you can add more anytime.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                  "group relative flex cursor-pointer flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                  active
                    ? cn(style.border, style.tint, "ring-2", style.ring, style.glow)
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
                )}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", active ? style.iconBg : "bg-muted")}>
                  <opt.icon className={cn("h-5 w-5", active ? style.iconColor : "text-muted-foreground")} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[opt.value]}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{opt.desc}</p>
                </div>
                {active && (
                  <motion.span
                    layoutId="explore-category-check"
                    className={cn("absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-white", style.gradient)}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {category && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-2 border-t border-border/60 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pick as many as apply</p>
                {CATEGORY_ROLES[category].map((role) => {
                  const style = CATEGORY_STYLES[category];
                  const active = checked.has(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-150",
                        active ? cn(style.border, style.tint) : "border-border bg-card hover:border-foreground/15 hover:bg-accent/40"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{ROLE_LABELS[role]}</p>
                        <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
                      </div>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-white transition-colors",
                          active ? cn(style.border, "bg-gradient-to-br", style.gradient) : "border-border"
                        )}
                      >
                        {active && <Check className="h-3 w-3" strokeWidth={3} />}
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
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continue
                </Button>
                {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

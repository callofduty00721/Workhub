import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { Loader2, Percent, Phone, AlertTriangle, Mail, Plus, X, Briefcase, UserX } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { adminApi } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import type { PhoneAuthProvider, UserRole } from "@/types";

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };
const iconBox = "flex h-8 w-8 items-center justify-center rounded-lg text-[#2563EB] bg-[#EFF6FF]";

// super_admin/staff have no public signup path (staff accounts are only ever
// created by another admin via Admin > Staff) — disabling them here would be
// a no-op, so they're left out of the picker even though the backend enum
// technically allows them.
const SIGNUP_ROLES = (Object.keys(ROLE_LABELS) as UserRole[]).filter((r) => r !== "super_admin" && r !== "staff");

const PHONE_PROVIDER_OPTIONS: { value: PhoneAuthProvider; label: string; desc: string }[] = [
  { value: "disabled", label: "Disabled", desc: "No phone verification gate at all." },
  { value: "firebase", label: "Firebase", desc: "Client-side OTP via Firebase phone auth." },
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [commissionPercent, setCommissionPercent] = useState("");
  const [phoneAuthProvider, setPhoneAuthProvider] = useState<PhoneAuthProvider>("disabled");
  const [allowedEmailDomains, setAllowedEmailDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [disabledRoles, setDisabledRoles] = useState<string[]>([]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminApi.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setCommissionPercent(String(settings.commissionPercent));
      setPhoneAuthProvider(settings.phoneAuthProvider);
      setAllowedEmailDomains(settings.allowedEmailDomains ?? []);
      setDisabledRoles(settings.disabledRoles ?? []);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateSettings(Number(commissionPercent)),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "settings"], data);
    },
  });

  const phoneMutation = useMutation({
    mutationFn: (provider: PhoneAuthProvider) => adminApi.updateSettings(settings?.commissionPercent ?? 0, provider),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "settings"], data);
      setPhoneAuthProvider(data.phoneAuthProvider);
    },
  });

  const isProviderConfigured = (provider: PhoneAuthProvider) => provider === "disabled" || settings?.firebaseConfigured;

  const domainsMutation = useMutation({
    mutationFn: (domains: string[]) => adminApi.updateSettings(settings?.commissionPercent ?? 0, undefined, domains),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "settings"], data);
      setAllowedEmailDomains(data.allowedEmailDomains ?? []);
    },
  });

  const jobsEnabledMutation = useMutation({
    mutationFn: (enabled: boolean) => adminApi.updateSettings(settings?.commissionPercent ?? 0, undefined, undefined, enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "settings"], data);
      queryClient.invalidateQueries({ queryKey: ["settings", "jobs-enabled"] });
    },
  });

  const disabledRolesMutation = useMutation({
    mutationFn: (roles: string[]) => adminApi.updateSettings(settings?.commissionPercent ?? 0, undefined, undefined, undefined, roles),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "settings"], data);
      setDisabledRoles(data.disabledRoles ?? []);
    },
  });

  const toggleDisabledRole = (role: UserRole) => {
    const next = disabledRoles.includes(role) ? disabledRoles.filter((r) => r !== role) : [...disabledRoles, role];
    disabledRolesMutation.mutate(next);
  };

  const addDomain = () => {
    const domain = domainInput.trim().toLowerCase().replace(/^@/, "");
    if (!domain || allowedEmailDomains.includes(domain)) return;
    domainsMutation.mutate([...allowedEmailDomains, domain]);
    setDomainInput("");
  };

  const removeDomain = (domain: string) => {
    domainsMutation.mutate(allowedEmailDomains.filter((d) => d !== domain));
  };

  const value = Number(commissionPercent);
  const isValid = commissionPercent !== "" && !Number.isNaN(value) && value >= 0 && value <= 100;

  return (
    <DashboardLayout role="super_admin" title="Platform Settings" subtitle="Control the commission the platform takes from every payment.">
      {isLoading ? (
        <Skeleton className="h-56 w-full max-w-lg" />
      ) : (
        <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card className="max-w-lg p-6">
          <div className="flex items-center gap-2.5">
            <span className={iconBox}>
              <Percent className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Platform Commission</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            This percentage is deducted from every gig order, job hire/milestone, and contest prize before the freelancer's wallet is
            credited. It already covers the Razorpay gateway cost — clients only ever see the price they agreed to pay, and never see this
            fee.
          </p>

          <div className="mt-5 flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Commission percent</label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Button variant="gradient" disabled={!isValid || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>

          {!isValid && commissionPercent !== "" && <p className="mt-2 text-xs text-danger">Enter a number between 0 and 100.</p>}
          {saveMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(saveMutation.error) ? saveMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          {saveMutation.isSuccess && !saveMutation.isPending && <p className="mt-2 text-xs text-success">Commission updated.</p>}

          {isValid && (
            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4 text-xs">
              <p className="font-medium text-foreground">Example: on a ₹1,000 payment</p>
              <p className="mt-1 text-muted-foreground">
                Client pays ₹1,000 → Platform commission ₹{((value / 100) * 1000).toFixed(0)} → Freelancer receives ₹
                {(1000 - (value / 100) * 1000).toFixed(0)}
              </p>
            </div>
          )}
        </Card>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card className="mt-6 max-w-lg p-6">
          <div className="flex items-center gap-2.5">
            <span className={iconBox}>
              <Phone className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Phone Verification</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Which provider (if any) verifies a user's mobile number. Switching providers doesn't affect users already verified.
          </p>

          <div className="mt-4 space-y-2">
            {PHONE_PROVIDER_OPTIONS.map((opt) => {
              const configured = isProviderConfigured(opt.value);
              const active = phoneAuthProvider === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={phoneMutation.isPending}
                  onClick={() => phoneMutation.mutate(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!configured && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-warning">
                        <AlertTriangle className="h-3 w-3" /> Not configured
                      </span>
                    )}
                    {phoneMutation.isPending && phoneMutation.variables === opt.value ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      active && <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            "Not configured" means the server's FIREBASE_* env vars (and this app's VITE_FIREBASE_* env vars) aren't set yet —
            selecting it will fail verification attempts until they are.
          </p>

          {phoneMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(phoneMutation.error) ? phoneMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
        </Card>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card className="mt-6 max-w-lg p-6">
          <div className="flex items-center gap-2.5">
            <span className={iconBox}>
              <Mail className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Email Domain Allowlist</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sign-up blocks known disposable/temp-mail domains automatically. No public blocklist is ever complete or free of false
            positives — if a real business domain gets wrongly flagged, add it here to override the block, without a code change.
          </p>

          <div className="mt-4 flex gap-2">
            <Input
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDomain())}
              placeholder="yourcompany.com"
              className="flex-1"
            />
            <Button variant="outline" disabled={!domainInput.trim() || domainsMutation.isPending} onClick={addDomain}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>

          {allowedEmailDomains.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {allowedEmailDomains.map((domain) => (
                <span
                  key={domain}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
                >
                  {domain}
                  <button
                    type="button"
                    disabled={domainsMutation.isPending}
                    onClick={() => removeDomain(domain)}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No overrides added yet — every domain goes through the default check.</p>
          )}

          {domainsMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(domainsMutation.error) ? domainsMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
        </Card>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card className="mt-6 max-w-lg p-6">
          <div className="flex items-center gap-2.5">
            <span className={iconBox}>
              <Briefcase className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Jobs Feature</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Turns the public Jobs board on or off — the "Jobs" nav link and the /jobs, /jobs/:id pages. Existing employer/job seeker
            accounts and dashboard job management are unaffected either way.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">{settings?.jobsEnabled ? "Enabled" : "Disabled"}</p>
              <p className="text-xs text-muted-foreground">
                {settings?.jobsEnabled ? "Visitors can browse and open job listings." : "The Jobs nav link and pages are hidden."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!settings?.jobsEnabled}
              disabled={jobsEnabledMutation.isPending}
              onClick={() => jobsEnabledMutation.mutate(!settings?.jobsEnabled)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                settings?.jobsEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  settings?.jobsEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {jobsEnabledMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(jobsEnabledMutation.error) ? jobsEnabledMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
        </Card>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card className="mt-6 max-w-lg p-6">
          <div className="flex items-center gap-2.5">
            <span className={iconBox}>
              <UserX className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Disabled Roles</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Blocks new sign-ups from picking a disabled role — at registration and when an existing user adds a new role. Anyone who
            already holds a role keeps full access to it either way; this only stops it from being picked going forward.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SIGNUP_ROLES.map((role) => {
              const disabled = disabledRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  disabled={disabledRolesMutation.isPending}
                  onClick={() => toggleDisabledRole(role)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors disabled:opacity-50",
                    disabled ? "border-danger/40 bg-danger/5 text-danger" : "border-border text-foreground hover:bg-accent"
                  )}
                >
                  <span className="truncate">{ROLE_LABELS[role]}</span>
                  {disabled && <span className="shrink-0 text-[10px] font-semibold uppercase">Off</span>}
                </button>
              );
            })}
          </div>

          {disabledRolesMutation.isError && (
            <p className="mt-3 text-xs text-danger">
              {isAxiosError(disabledRolesMutation.error) ? disabledRolesMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
        </Card>
        </motion.div>
      )}
    </DashboardLayout>
  );
}

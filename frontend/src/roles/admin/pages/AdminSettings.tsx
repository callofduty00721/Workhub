import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Percent, Phone, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { adminApi } from "@/api/admin";
import type { PhoneAuthProvider } from "@/types";

const PHONE_PROVIDER_OPTIONS: { value: PhoneAuthProvider; label: string; desc: string }[] = [
  { value: "disabled", label: "Disabled", desc: "No phone verification gate at all." },
  { value: "firebase", label: "Firebase", desc: "Client-side OTP via Firebase phone auth." },
  { value: "twilio", label: "Twilio", desc: "Real SMS OTP via Twilio Verify." },
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [commissionPercent, setCommissionPercent] = useState("");
  const [phoneAuthProvider, setPhoneAuthProvider] = useState<PhoneAuthProvider>("disabled");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminApi.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setCommissionPercent(String(settings.commissionPercent));
      setPhoneAuthProvider(settings.phoneAuthProvider);
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

  const isProviderConfigured = (provider: PhoneAuthProvider) =>
    provider === "disabled" || (provider === "firebase" ? settings?.firebaseConfigured : settings?.twilioConfigured);

  const value = Number(commissionPercent);
  const isValid = commissionPercent !== "" && !Number.isNaN(value) && value >= 0 && value <= 100;

  return (
    <DashboardLayout role="super_admin" title="Platform Settings" subtitle="Control the commission the platform takes from every payment.">
      {isLoading ? (
        <Skeleton className="h-56 w-full max-w-lg" />
      ) : (
        <Card className="max-w-lg p-6">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
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
      )}

      {!isLoading && (
        <Card className="mt-6 max-w-lg p-6">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
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
            "Not configured" means the server's env vars for that provider (FIREBASE_* or TWILIO_*) aren't set yet — selecting it will
            fail verification attempts until they are.
          </p>

          {phoneMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(phoneMutation.error) ? phoneMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}

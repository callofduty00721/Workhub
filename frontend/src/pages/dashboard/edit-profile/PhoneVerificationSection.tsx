import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { userApi } from "@/api/users";
import { publicSettingsApi } from "@/api/settings";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import { VerificationStatusPill } from "./shared";
import type { User } from "@/types";

// Firebase is the only phone-verification provider (besides "disabled") —
// SMS send happens entirely client-side via invisible reCAPTCHA, and only
// the resulting ID token ever reaches the backend, to be verified there.
// See backend/src/modules/shared/user.controller.js's verifyPhoneFirebaseToken.
export function PhoneVerificationSection({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["settings", "phone-auth-provider"],
    queryFn: publicSettingsApi.phoneAuthProvider,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!recaptchaContainerRef.current) throw new Error("Verifier isn't ready yet — try again");
      const auth = getFirebaseAuth();
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: "invisible" });
      confirmationRef.current = await signInWithPhoneNumber(auth, `+91${user.phone}`, verifier);
    },
    onSuccess: () => setOtpSent(true),
  });
  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!confirmationRef.current) throw new Error("Request a code first");
      const result = await confirmationRef.current.confirm(otpInput);
      const idToken = await result.user.getIdToken();
      return userApi.verifyPhoneFirebaseToken(idToken);
    },
    onSuccess: () => refreshUser(),
  });

  const errorMessage = () => {
    for (const m of [sendMutation.error, verifyMutation.error]) {
      if (!m) continue;
      if (isAxiosError(m)) return m.response?.data?.message ?? "Something went wrong.";
      if (m instanceof Error) return m.message;
    }
    return null;
  };
  const error = errorMessage();

  return (
    <div className="space-y-2 border-b border-border pb-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Mobile</p>
        <VerificationStatusPill verified={user.isPhoneVerified} />
      </div>

      {!user.isPhoneVerified && !providerLoading && provider === "disabled" && (
        <p className="text-xs text-muted-foreground">Phone verification is currently unavailable.</p>
      )}

      {!user.isPhoneVerified && provider && provider !== "disabled" && (
        <>
          <p className="text-xs text-muted-foreground">
            We&apos;ll text a code to confirm your mobile number ({user.phone || "add a phone number above"}).
          </p>
          {/* Invisible reCAPTCHA host for Firebase — renders nothing visible, required to exist in the DOM before sendFirebaseOtp runs. */}
          <div ref={recaptchaContainerRef} />
          {!otpSent ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!user.phone || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send Verification Code
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="6-digit code" className="w-40" />
              <Button
                type="button"
                variant="gradient"
                size="sm"
                disabled={!otpInput || verifyMutation.isPending}
                onClick={() => verifyMutation.mutate()}
              >
                {verifyMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Verify
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
                Resend Code
              </Button>
            </div>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </>
      )}
    </div>
  );
}

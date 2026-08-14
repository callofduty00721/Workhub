import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { AuthShell } from "./AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreedToTerms: z.boolean().refine((v) => v === true, { message: "You must agree to the Terms of Service and Privacy Policy" }),
});

type FormValues = z.infer<typeof schema>;

// Set once sign-up moves to the OTP step — holds the signed ticket from
// /auth/register plus the email the code went to (shown back to the user
// so they know where to look for it). Phone sign-up has no working OTP
// provider right now (see auth.controller.js's register()), so this form
// only ever offers email.
interface PendingOtp {
  ticket: string;
  destination: string;
}

export default function Register() {
  const { register: registerUser, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") ?? undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingOtp, setPendingOtp] = useState<PendingOtp | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const agreedToTerms = watch("agreedToTerms");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const result = await registerUser(values.name, { email: values.email }, values.password, undefined, referralCode);
      if ("requiresOtpVerification" in result) {
        setPendingOtp({ ticket: result.ticket, destination: result.destination });
        return;
      }
      navigate(dashboardPathForRole(result.role), { replace: true });
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setServerError(message || "Something went wrong. Please try again.");
    }
  };

  if (pendingOtp) {
    return (
      <OtpStep
        destination={pendingOtp.destination}
        onVerify={async (otp) => {
          const user = await verifyOtp(pendingOtp.ticket, otp);
          navigate(dashboardPathForRole(user.role), { replace: true });
        }}
        onResend={async () => {
          const newTicket = await resendOtp(pendingOtp.ticket);
          setPendingOtp((prev) => (prev ? { ...prev, ticket: newTicket } : prev));
        }}
        onBack={() => setPendingOtp(null)}
      />
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join GrowHive and start your journey"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {referralCode && (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          You were invited by a GrowHive member — referral code <span className="font-mono">{referralCode}</span> will be applied.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{serverError}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="Enter your full name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Checkbox
              id="agreedToTerms"
              checked={agreedToTerms === true}
              onCheckedChange={(checked) => setValue("agreedToTerms", checked === true, { shouldValidate: true })}
              className="mt-0.5"
            />
            <Label htmlFor="agreedToTerms" className="text-xs font-normal leading-snug text-muted-foreground">
              I agree to GrowHive's{" "}
              <Link to="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </Label>
          </div>
          {errors.agreedToTerms && <p className="text-xs text-danger">{errors.agreedToTerms.message}</p>}
        </div>

        <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </Button>

        <p className="text-center text-xs text-muted-foreground">You'll choose what you're here to do right after.</p>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4">
        <GoogleSignInButton />
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        By continuing with Google, you agree to our{" "}
        <Link to="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}

// Facebook-style confirmation step — shown after sign-up until the emailed
// code is confirmed.
function OtpStep({
  destination,
  onVerify,
  onResend,
  onBack,
}: {
  destination: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);
    try {
      await onVerify(otp);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(message || "Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await onResend();
      setResendMessage("We sent a new code to your email.");
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(message || "Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the code we sent to ${destination}`}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleVerify} className="space-y-5" noValidate>
        {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        {resendMessage && (
          <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">{resendMessage}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoFocus
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>

        <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isVerifying || otp.length < 4}>
          {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify & Continue
        </Button>

        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={onBack} className="font-medium text-muted-foreground hover:text-foreground">
            &larr; Back
          </button>
          <button type="button" onClick={handleResend} disabled={isResending} className="font-semibold text-primary hover:underline disabled:opacity-50">
            {isResending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

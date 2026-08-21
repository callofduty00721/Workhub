import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, User, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { isAxiosError } from "axios";
import { AuthShell } from "./AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "Enter your first name"),
  lastName: z.string().min(1, "Enter your last name"),
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

// Step pill shown above the card title — purely cosmetic orientation, not a
// gate (Google sign-up skips step 2 entirely, which is fine).
function StepPill({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", step === 1 ? "bg-brand" : "bg-success")} />
      Step {step} of 2 · {step === 1 ? "Account details" : "Verify email"}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password) || password.length >= 12];
  const score = checks.filter(Boolean).length;
  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][score];
  const color = ["bg-danger", "bg-danger", "bg-amber-500", "bg-teal-500", "bg-success"][score];
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex h-1 flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-full flex-1 rounded-full transition-colors duration-300", i < score ? color : "bg-border")} />
        ))}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
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
  const password = watch("password") ?? "";

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
      const result = await registerUser(fullName, { email: values.email }, values.password, undefined, referralCode);
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

  return (
    <AuthShell
      title={pendingOtp ? "Verify your email" : "Create your account"}
      subtitle={pendingOtp ? `Enter the 6-digit code we sent to ${pendingOtp.destination}` : "Join GrowHive and start your journey"}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {pendingOtp ? (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <StepPill step={2} />
            <OtpStep
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
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <StepPill step={1} />

            {referralCode && (
              <p className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                You were invited by a GrowHive member — referral code <span className="font-mono">{referralCode}</span> will be applied.
              </p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
              {serverError && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{serverError}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="First name"
                      className="pl-10"
                      {...register("firstName")}
                      aria-invalid={!!errors.firstName}
                    />
                  </div>
                  {errors.firstName && <p className="text-xs text-danger">{errors.firstName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Last name" {...register("lastName")} aria-invalid={!!errors.lastName} />
                  {errors.lastName && <p className="text-xs text-danger">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
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
                <PasswordStrength password={password} />
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
            </form>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-3">
              <GoogleSignInButton />
            </div>
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
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
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}

const OTP_LENGTH = 6;

// Six-box code entry — auto-advances on type, supports backspace-to-previous
// and pasting the full code in one go (e.g. from a copied email).
function OtpBoxes({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, digit: string) => {
    const next = value.split("");
    next[index] = digit;
    const joined = next.join("").slice(0, OTP_LENGTH);
    onChange(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          inputMode="numeric"
          autoFocus={i === 0}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-full min-w-0 rounded-lg border border-input bg-card text-center text-lg font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={1}
        />
      ))}
    </div>
  );
}

function OtpStep({
  onVerify,
  onResend,
  onBack,
}: {
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
      setOtp("");
      setResendMessage("We sent a new code to your email.");
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setError(message || "Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-5" noValidate>
      <div className="flex justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
          <ShieldCheck className="h-6 w-6 text-brand" />
        </span>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</div>}
      {resendMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {resendMessage}
        </div>
      )}

      <div className="space-y-2">
        <Label>Verification Code</Label>
        <OtpBoxes value={otp} onChange={setOtp} disabled={isVerifying} />
      </div>

      <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isVerifying || otp.length < OTP_LENGTH}>
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
  );
}

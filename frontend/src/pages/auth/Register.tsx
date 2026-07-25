import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Rocket, Briefcase, Building2, TrendingUp, GraduationCap, Handshake, Users } from "lucide-react";
import { isAxiosError } from "axios";
import { AuthShell } from "./AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string; icon: typeof Rocket }[] = [
  { value: "founder", label: "Founder", desc: "I'm building a startup", icon: Rocket },
  { value: "freelancer", label: "Freelancer", desc: "I want to find gigs or jobs", icon: Briefcase },
  { value: "employer", label: "Employer", desc: "I want to hire", icon: Building2 },
  { value: "investor", label: "Investor", desc: "I want to invest", icon: TrendingUp },
  { value: "mentor", label: "Mentor", desc: "I want to mentor", icon: GraduationCap },
  { value: "partner", label: "Partner", desc: "Accelerator, NGO, etc.", icon: Handshake },
  { value: "client", label: "Client", desc: "I want to hire freelancers", icon: Users },
];

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(10, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["founder", "freelancer", "employer", "investor", "mentor", "partner", "client"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") ?? undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "founder" } });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const user = await registerUser(values.name, values.email, values.password, values.phone, values.role, referralCode);
      navigate(dashboardPathForRole(user.role), { replace: true });
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setServerError(message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join MahaHub and start your journey"
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
          You were invited by a MahaHub member — referral code <span className="font-mono">{referralCode}</span> will be applied.
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
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" placeholder="+91 98765 43210" {...register("phone")} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm your password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-danger">{errors.confirmPassword.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>I am a</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    title={opt.desc}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors",
                      field.value === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                    )}
                  >
                    <opt.icon className={cn("h-4.5 w-4.5", field.value === opt.value ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4">
        <GoogleSignInButton />
      </div>
    </AuthShell>
  );
}

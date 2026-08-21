import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { postLoginPath } from "@/lib/roles";
import { isAxiosError } from "axios";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\d{10}$/;

const schema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email or mobile number")
    .refine((v) => EMAIL_RE.test(v) || PHONE_RE.test(v), "Enter a valid email address or 10-digit mobile number"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetSuccess] = useState(() => Boolean((location.state as { resetSuccess?: boolean } | null)?.resetSuccess));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const identifier = EMAIL_RE.test(values.identifier) ? { email: values.identifier } : { phone: values.identifier };
      const user = await login(identifier, values.password);
      const redirectTo = (location.state as { from?: string } | null)?.from ?? postLoginPath(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      setServerError(message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your GrowHive account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {resetSuccess && !serverError && (
          <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
            Your password has been reset. Log in with your new password.
          </div>
        )}
        {serverError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{serverError}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="identifier">Email or Mobile Number</Label>
          <Input
            id="identifier"
            placeholder="you@example.com or 98765 43210"
            {...register("identifier")}
            aria-invalid={!!errors.identifier}
          />
          {errors.identifier && <p className="text-xs text-danger">{errors.identifier.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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

        <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Log In
        </Button>
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

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authApi } from "@/api/auth";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await authApi.forgotPassword(values.email);
    setSent(true);
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-5 py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="text-sm font-medium text-foreground">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

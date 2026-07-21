import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { authApi } from "@/api/auth";

export default function VerifyEmail() {
  const { token = "" } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(isAxiosError(err) ? err.response?.data?.message || "Verification failed" : "Verification failed");
      });
  }, [token]);

  return (
    <AuthShell
      title="Email Verification"
      subtitle="Confirming your MahaHub account"
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-5 py-10 text-center">
        {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
        {status === "success" && <CheckCircle2 className="h-8 w-8 text-success" />}
        {status === "error" && <XCircle className="h-8 w-8 text-danger" />}
        <p className="text-sm font-medium text-foreground">{status === "loading" ? "Verifying your email..." : message}</p>
        {status !== "loading" && (
          <Button variant="gradient" asChild size="sm" className="mt-2">
            <Link to="/login">Continue to Log In</Link>
          </Button>
        )}
      </div>
    </AuthShell>
  );
}

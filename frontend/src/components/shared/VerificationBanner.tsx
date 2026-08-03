import { Link } from "react-router-dom";
import { ShieldAlert, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { VERIFICATION_REQUIRED_ROLES } from "@/lib/roles";

// Shown at the top of Employer/Founder/Investor dashboards — the account
// itself is never locked out of the dashboard (that would block low-risk
// actions too), but this makes the "you need to verify" state impossible to
// miss before they try a gated action and hit a 403. See
// backend/src/middleware/roleAuth.js for what's actually enforced.
export function VerificationBanner() {
  const { user } = useAuth();
  if (!user || !user.role || !VERIFICATION_REQUIRED_ROLES.includes(user.role) || user.isVerified) return null;

  const status = user.verificationStatus ?? "unverified";

  if (status === "pending") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
        <Clock className="h-4.5 w-4.5 shrink-0" />
        <p className="flex-1">Your verification documents are under review. High-risk actions stay locked until approved.</p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mb-6 flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <XCircle className="h-4.5 w-4.5 shrink-0" />
          <p>Your verification was rejected{user.verificationNote ? `: ${user.verificationNote}` : "."}</p>
        </div>
        <Link to="/dashboard/verify-role" className="font-semibold underline shrink-0">
          Resubmit documents
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
        <p className="text-foreground/90">Verify your account to unlock high-risk actions for this role.</p>
      </div>
      <Link to="/dashboard/verify-role" className="font-semibold text-primary underline shrink-0">
        Get verified
      </Link>
    </div>
  );
}

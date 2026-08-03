import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { UserCircle2, Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";
import { RolePickerModal } from "@/components/shared/RolePickerModal";

// Landing spot for a registered user who hasn't picked a role yet. Nothing
// here is role-gated: a banner for the (role-independent) basic profile, and
// a "Choose your role" entry point into RolePickerModal. Once a role is
// picked, this page has no more reason to be visited — but the very first
// time it does get one, it detours through profile completion rather than
// dropping straight into an empty dashboard.
export default function Explore() {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasBasics = Boolean(user?.avatar || user?.bio || user?.location);

  if (user?.role) {
    return <Navigate to={hasBasics ? dashboardPathForRole(user.role) : "/dashboard/profile"} replace />;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome to MahaHub, {user?.name?.split(" ")[0]}.</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You're in — no role picked yet. Browse around, and choose what you're here to do whenever you're ready.
        </p>
      </div>

      {!hasBasics && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Complete your basic profile</p>
              <p className="text-xs text-muted-foreground">A photo, location, and short bio — works no matter what role you pick.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="flex-shrink-0">
            <Link to="/dashboard/profile">Complete</Link>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Compass className="h-8 w-8 flex-shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Choose your role</p>
            <p className="text-xs text-muted-foreground">Founder, freelancer, investor, and more — pick any that fit.</p>
          </div>
        </div>
        <Button size="sm" className="flex-shrink-0 gap-1.5" onClick={() => setPickerOpen(true)}>
          Choose role <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <RolePickerModal open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}

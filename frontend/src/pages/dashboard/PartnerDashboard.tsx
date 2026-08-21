import { Link } from "react-router-dom";
import { Eye, Rocket, Link2, Pencil } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBanner } from "@/components/shared/VerificationBanner";
import { useAuth } from "@/context/AuthContext";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  agency: "Agency",
  company: "Company",
  consultant: "Consultant",
  service_provider: "Service Provider",
  technology_partner: "Technology Partner",
  strategic_partner: "Strategic Partner",
};

export default function PartnerDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="partner"
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle="Your partner profile, at a glance."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/profile">
            <Pencil className="h-4 w-4" /> Edit Partner Details
          </Link>
        </Button>
      }
    >
      <VerificationBanner />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Eye className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{user?.profileViews ?? 0}</p>
          <p className="text-xs text-muted-foreground">Profile Views</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <Rocket className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{user?.clientsServed ?? 0}</p>
          <p className="text-xs text-muted-foreground">Clients Served</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Link2 className="h-5 w-5" />
          </div>
          <p className="truncate text-2xl font-bold">{user?.partnerType ? PARTNER_TYPE_LABELS[user.partnerType] ?? user.partnerType : "—"}</p>
          <p className="text-xs text-muted-foreground">Partner Type</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Services & Program Details</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/profile">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </Button>
          </div>
          {user?.services && user.services.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.services.map((s) => (
                <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {s}
                </span>
              ))}
            </div>
          )}
          {user?.programDetails ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{user.programDetails}</p>
          ) : !user?.services?.length ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You haven't added your services yet — founders won't know what you offer until you do.
            </p>
          ) : null}
          {user?.applicationLink && (
            <a
              href={user.applicationLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Link2 className="h-3.5 w-3.5" /> Application Link
            </a>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Find startups to work with</h3>
            <p className="text-sm text-muted-foreground">Browse founders looking for agencies, consultants, and service partners.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/startups">
              <Rocket className="h-4 w-4" /> Browse Startups
            </Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

// Partner stat count and program metadata come straight off the User record
// (see partnerType/programDetails/startupsSupportedCount/applicationLink on
// backend/src/models/User.js) — this page had no dedicated dashboard before,
// only a link straight to the shared profile-edit form.

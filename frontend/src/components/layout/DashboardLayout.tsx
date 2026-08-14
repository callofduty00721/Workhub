import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { DashboardSidebar, type DashboardRole } from "./DashboardSidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/context/AuthContext";
import { missingProfileFields } from "@/lib/profileCompletion";

export function DashboardLayout({
  role,
  title,
  subtitle,
  actions,
  children,
}: {
  role: DashboardRole;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  // Every role has a real completion scorer (lib/profileCompletion.ts) except
  // super_admin, which has no public-facing profile to complete. Lives here —
  // above the navbar, not inside any one dashboard's own page — so it's the
  // same one strip for every role, and it follows you across every dashboard
  // page (Analytics, My Gigs, Projects, etc.) until it's actually done.
  const missingFields = user ? missingProfileFields(user) : [];

  return (
    <div className="min-h-screen bg-background">
      {missingFields.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-border bg-muted/60 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-center">
          <p className="text-foreground/90">
            Add your {missingFields.slice(0, 3).map((f) => f.label).join(", ")}
            {missingFields.length > 3 ? `, and ${missingFields.length - 3} more` : ""} to complete your profile.
          </p>
          <Link to="/dashboard/profile" className="shrink-0 font-semibold text-primary underline">
            Complete Profile
          </Link>
        </div>
      )}

      <Navbar hideMobileToggle />

      <div className="flex">
        <div className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:block">
          <DashboardSidebar role={role} />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative">
              <DashboardSidebar role={role} onNavigate={() => setMobileOpen(false)} />
            </div>
            <button
              className="absolute right-4 top-4 rounded-md bg-card p-2 text-foreground shadow-soft"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <button
            className="sticky top-16 z-20 flex items-center gap-2 border-b border-border bg-background/95 p-4 text-sm font-medium text-foreground backdrop-blur-xl lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" /> Menu
          </button>

          <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {actions}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar, type DashboardRole } from "./DashboardSidebar";
import { Navbar, NAV_LINKS } from "./Navbar";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar hideMobileToggle />

      <div className="flex">
        <div className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:block">
          <DashboardSidebar role={role} />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
            <div className="relative">
              <DashboardSidebar role={role} extraLinks={NAV_LINKS} onNavigate={() => setMobileOpen(false)} />
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

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
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

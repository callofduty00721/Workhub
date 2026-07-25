import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Rocket,
  Handshake,
  ClipboardList,
  MessageSquare,
  CheckSquare,
  Wallet,
  Star,
  Briefcase,
  Settings,
  UserCog,
  TrendingUp,
  GraduationCap,
  Building2,
  FolderKanban,
  ShieldAlert,
  UserRound,
  Trophy,
  ArrowDownToLine,
  Bell,
  Truck,
  Bookmark,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFounderTeamApplications } from "@/hooks/useFounderTeamApplications";
import { useFounderInvestments } from "@/hooks/useFounderInvestments";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface SidebarItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const FOUNDER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/founder", icon: LayoutDashboard },
  { label: "My Startups", to: "/dashboard/founder/startups", icon: Rocket },
  { label: "Team Applications", to: "/dashboard/founder/applications", icon: ClipboardList },
  { label: "Investors", to: "/dashboard/founder/investors", icon: Wallet },
  { label: "Connect & Grow", to: "/investors", icon: Handshake },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
];

const FREELANCER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/freelancer", icon: LayoutDashboard },
  { label: "Find Jobs & Projects", to: "/freelancers?tab=projects", icon: Briefcase },
  { label: "My Applications", to: "/dashboard/freelancer/applications", icon: ClipboardList },
  { label: "My Contest Entries", to: "/dashboard/freelancer/contests", icon: Trophy },
  { label: "My Projects", to: "/dashboard/freelancer/projects", icon: CheckSquare },
  { label: "My Gigs", to: "/dashboard/freelancer/gigs", icon: Rocket },
  { label: "Company Team", to: "/dashboard/freelancer/company", icon: Building2 },
  { label: "My Orders", to: "/dashboard/freelancer/orders", icon: Truck },
  { label: "Saved", to: "/dashboard/freelancer/saved", icon: Bookmark },
  { label: "Skill Tests", to: "/dashboard/freelancer/skill-tests", icon: GraduationCap },
  { label: "Earnings", to: "/dashboard/freelancer/earnings", icon: Wallet },
  { label: "Job Alerts", to: "/dashboard/freelancer/alerts", icon: Bell },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Reviews", to: "/dashboard/freelancer/reviews", icon: Star },
];

const EMPLOYER_ITEMS: SidebarItem[] = [
  { label: "Dashboard & My Jobs", to: "/dashboard/employer", icon: LayoutDashboard },
  { label: "Post a Job", to: "/dashboard/employer/post-job", icon: Rocket },
  { label: "Company Team", to: "/dashboard/employer/company", icon: Building2 },
  { label: "My Contests", to: "/dashboard/employer/contests", icon: Trophy },
  { label: "My Payments", to: "/dashboard/employer/payments", icon: Wallet },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", to: "/dashboard/admin/users", icon: UserCog },
  { label: "Startups", to: "/dashboard/admin/startups", icon: Rocket },
  { label: "Flagged Startups", to: "/dashboard/admin/flagged-startups", icon: ShieldAlert },
  { label: "Jobs & Projects", to: "/dashboard/admin/jobs", icon: FolderKanban },
  { label: "Gigs", to: "/dashboard/admin/gigs", icon: Briefcase },
  { label: "Contests", to: "/dashboard/admin/contests", icon: Trophy },
  { label: "Payment Disputes", to: "/dashboard/admin/payments", icon: Wallet },
  { label: "Withdrawals", to: "/dashboard/admin/withdrawals", icon: ArrowDownToLine },
  { label: "KYC Requests", to: "/dashboard/admin/kyc", icon: ShieldAlert },
  { label: "Platform Settings", to: "/dashboard/admin/settings", icon: Settings },
  { label: "Skill Tests", to: "/dashboard/admin/skill-tests", icon: GraduationCap },
];

const INVESTOR_ITEMS: SidebarItem[] = [
  { label: "Deal Flow", to: "/dashboard/investor", icon: TrendingUp },
  { label: "Browse Startups", to: "/startups", icon: Rocket },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
];

const MENTOR_ITEMS: SidebarItem[] = [
  { label: "Session Requests", to: "/dashboard/mentor", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
];

const PARTNER_ITEMS: SidebarItem[] = [
  { label: "My Profile", to: "/dashboard/profile", icon: Building2 },
  { label: "Browse Startups", to: "/startups", icon: Rocket },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
];

const CLIENT_ITEMS: SidebarItem[] = [
  { label: "Dashboard & My Projects", to: "/dashboard/client", icon: FolderKanban },
  { label: "Post a Project", to: "/dashboard/client/post-job", icon: Rocket },
  { label: "Company Team", to: "/dashboard/client/company", icon: Building2 },
  { label: "My Contests", to: "/dashboard/client/contests", icon: Trophy },
  { label: "My Payments", to: "/dashboard/client/payments", icon: Wallet },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
];

export type DashboardRole = Extract<
  UserRole,
  "founder" | "freelancer" | "employer" | "super_admin" | "investor" | "mentor" | "partner" | "client"
>;

const ITEMS_BY_ROLE: Record<DashboardRole, SidebarItem[]> = {
  founder: FOUNDER_ITEMS,
  freelancer: FREELANCER_ITEMS,
  employer: EMPLOYER_ITEMS,
  super_admin: ADMIN_ITEMS,
  investor: INVESTOR_ITEMS,
  mentor: MENTOR_ITEMS,
  partner: PARTNER_ITEMS,
  client: CLIENT_ITEMS,
};

export function DashboardSidebar({
  role,
  extraLinks,
  onNavigate,
}: {
  role: DashboardRole;
  // Only passed for the mobile drawer instance — folds the marketing site
  // links (Startups/Jobs/...) into this same panel, since the Dashboard
  // hides Navbar's own mobile menu to avoid showing two hamburger icons.
  extraLinks?: { label: string; to: string }[];
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const { pendingCount: pendingApplications } = useFounderTeamApplications({ enabled: role === "founder" });
  const { pendingCount: pendingInvestments } = useFounderInvestments({ enabled: role === "founder" });
  let items = ITEMS_BY_ROLE[role].map((item) => {
    if (role !== "founder") return item;
    if (item.to === "/dashboard/founder/applications" && pendingApplications > 0) return { ...item, badge: pendingApplications };
    if (item.to === "/dashboard/founder/investors" && pendingInvestments > 0) return { ...item, badge: pendingInvestments };
    return item;
  });
  if (role === "founder" && user?.id) {
    items = [...items, { label: "My Public Profile", to: `/founders/${user.id}`, icon: UserRound }];
  }
  if (role === "freelancer" && user?.id) {
    items = [...items, { label: "My Public Profile", to: `/freelancers/${user.id}`, icon: UserRound }];
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 scrollbar-thin">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === items[0].to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
              )
            }
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </span>
            {item.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}

        {extraLinks && extraLinks.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Explore MahaHub</p>
            {extraLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onNavigate}
                className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="border-t border-border p-4">
        <NavLink
          to="/dashboard/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-4.5 w-4.5" />
          Edit Profile
        </NavLink>
      </div>
    </aside>
  );
}

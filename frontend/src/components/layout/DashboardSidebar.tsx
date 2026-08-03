import { useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Rocket,
  Handshake,
  ClipboardList,
  MessageSquare,
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
  Trophy,
  ArrowDownToLine,
  Bell,
  Bookmark,
  Gift,
  Search,
  Megaphone,
  Image,
  ShieldCheck,
  Calendar,
  Receipt,
  Crown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFounderTeamApplications } from "@/hooks/useFounderTeamApplications";
import { useFounderInvestments } from "@/hooks/useFounderInvestments";
import { useAuth } from "@/context/AuthContext";
import { notificationApi } from "@/api/notifications";
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

// Deliberately flat, in this exact order — matches the reference dashboard
// layout the user pinned down. Company Team/My Orders/Saved/Job Alerts/
// Referrals still exist as real pages (linked from Settings/notifications/
// EditProfile) but are intentionally left out of this list; AI Assistant is
// left out entirely since there's no real destination for it yet.
const FREELANCER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/freelancer", icon: LayoutDashboard },
  { label: "Analytics", to: "/dashboard/freelancer/analytics", icon: TrendingUp },
  { label: "My Gigs", to: "/dashboard/freelancer/gigs", icon: Rocket },
  { label: "Projects", to: "/dashboard/freelancer/projects", icon: FolderKanban },
  { label: "Proposals", to: "/dashboard/freelancer/applications", icon: ClipboardList },
  { label: "Contest Entries", to: "/dashboard/freelancer/contests", icon: Trophy },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Calendar", to: "/dashboard/freelancer#calendar", icon: Calendar },
  { label: "Wallet", to: "/dashboard/freelancer/earnings", icon: Wallet },
  { label: "Earnings", to: "/dashboard/freelancer/analytics#earnings-breakdown", icon: Receipt },
  { label: "Reviews", to: "/dashboard/freelancer/reviews", icon: Star },
  { label: "Portfolio", to: "/dashboard/profile#portfolio", icon: Image },
  { label: "Skills", to: "/dashboard/profile#skills", icon: GraduationCap },
  { label: "Verification", to: "/dashboard/profile#kyc", icon: ShieldCheck },
  { label: "Membership", to: "/pricing", icon: Crown },
  { label: "Notifications", to: "/dashboard/notifications", icon: Bell },
  { label: "Settings", to: "/settings", icon: Settings },
];

const EMPLOYER_ITEMS: SidebarItem[] = [
  { label: "Dashboard & My Jobs", to: "/dashboard/employer", icon: LayoutDashboard },
  { label: "Post a Job", to: "/dashboard/employer/post-job", icon: Rocket },
  { label: "My Campaigns", to: "/dashboard/employer/campaigns", icon: Megaphone },
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
  { label: "Profile Verifications", to: "/dashboard/admin/profile-verifications", icon: ShieldAlert },
  { label: "Role Verifications", to: "/dashboard/admin/role-verifications", icon: ShieldAlert },
  { label: "Plans", to: "/dashboard/admin/plans", icon: Crown },
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
  { label: "Dashboard", to: "/dashboard/partner", icon: LayoutDashboard },
  { label: "My Profile", to: "/dashboard/profile", icon: Building2 },
  { label: "Browse Startups", to: "/startups", icon: Rocket },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
];

const JOB_SEEKER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/job-seeker", icon: LayoutDashboard },
  { label: "Find Jobs", to: "/jobs", icon: Briefcase },
  { label: "Recommended Jobs", to: "/dashboard/job-seeker#recommended-jobs", icon: TrendingUp },
  { label: "My Applications", to: "/dashboard/job-seeker#applications", icon: ClipboardList },
  { label: "Saved Jobs", to: "/dashboard/freelancer/saved", icon: Bookmark },
  { label: "Job Alerts", to: "/dashboard/freelancer/alerts", icon: Bell },
  { label: "Resume & Profile", to: "/dashboard/profile", icon: Search },
  { label: "Skill Assessment", to: "/dashboard/freelancer/skill-tests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Interview Calls", to: "/dashboard/job-seeker/interviews", icon: Calendar },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Upgrade to Premium", to: "/pricing", icon: Crown },
];

const INFLUENCER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/influencer", icon: LayoutDashboard },
  { label: "Campaigns", to: "/campaigns", icon: Megaphone },
  { label: "Portfolio", to: "/dashboard/profile#portfolio", icon: Image },
  { label: "Profile", to: "/dashboard/profile", icon: Search },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Upgrade to Premium", to: "/pricing", icon: Crown },
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
  | "founder"
  | "freelancer"
  | "job_seeker"
  | "influencer"
  | "employer"
  | "super_admin"
  | "investor"
  | "mentor"
  | "partner"
  | "client"
>;

const ITEMS_BY_ROLE: Record<DashboardRole, SidebarItem[]> = {
  founder: FOUNDER_ITEMS,
  freelancer: FREELANCER_ITEMS,
  job_seeker: JOB_SEEKER_ITEMS,
  influencer: INFLUENCER_ITEMS,
  employer: EMPLOYER_ITEMS,
  super_admin: ADMIN_ITEMS,
  investor: INVESTOR_ITEMS,
  mentor: MENTOR_ITEMS,
  partner: PARTNER_ITEMS,
  client: CLIENT_ITEMS,
};

export function DashboardSidebar({
  role,
  onNavigate,
}: {
  role: DashboardRole;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount: pendingApplications } = useFounderTeamApplications({ enabled: role === "founder" });
  const { pendingCount: pendingInvestments } = useFounderInvestments({ enabled: role === "founder" });
  // Same query key NotificationBell uses — already fetched and cached on every
  // page it's mounted on, so this reads that cache instead of firing its own.
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list, enabled: !!user });

  let items = ITEMS_BY_ROLE[role].map((item) => {
    if (role === "founder") {
      if (item.to === "/dashboard/founder/applications" && pendingApplications > 0) return { ...item, badge: pendingApplications };
      if (item.to === "/dashboard/founder/investors" && pendingInvestments > 0) return { ...item, badge: pendingInvestments };
    }
    if (role === "freelancer" && item.to === "/dashboard/notifications" && notifications?.unreadCount) {
      return { ...item, badge: notifications.unreadCount };
    }
    return item;
  });
  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate("/");
  };

  const renderNavItem = (item: SidebarItem) => {
    // Plain Link with hand-rolled active detection instead of NavLink's
    // built-in isActive — NavLink only compares pathname, so Projects/
    // Proposals (same pathname, different ?tab=) both lit up together, and
    // Calendar (/dashboard/freelancer#calendar, no `end`) prefix-matched
    // every /dashboard/freelancer/* sub-route. Exact pathname+search+hash
    // comparison fixes both — hash matters too, since Portfolio/Skills/
    // Verification are all /dashboard/profile#<anchor> and would otherwise
    // all light up together just like Projects/Proposals did.
    const [toPath, toSearch] = item.to.split("?");
    const [toPathname, toHash] = toPath.split("#");
    const isActive =
      location.pathname === toPathname &&
      location.search === (toSearch ? `?${toSearch}` : "") &&
      location.hash === (toHash ? `#${toHash}` : "");
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onNavigate}
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
        )}
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
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 scrollbar-thin">
        {items.map(renderNavItem)}
      </nav>
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}

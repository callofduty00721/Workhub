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
  Calendar,
  Crown,
  LogOut,
  MessageCircleWarning,
  Users,
  Send,
  Compass,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFounderTeamApplications } from "@/hooks/useFounderTeamApplications";
import { useFounderInvestments } from "@/hooks/useFounderInvestments";
import { useAuth } from "@/context/AuthContext";
import { notificationApi } from "@/api/notifications";
import type { UserRole, AdminPermission } from "@/types";

interface SidebarItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  // Admin-only metadata (see ADMIN_ITEMS below): items with neither flag
  // (e.g. Overview) are visible to any admin-panel user. `permission` gates
  // an item behind a specific staffPermissions entry; `superAdminOnly` hides
  // it from staff entirely regardless of permissions — money-moving and
  // global-config areas never become delegable through the UI.
  permission?: AdminPermission;
  superAdminOnly?: boolean;
}

const FOUNDER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/founder", icon: LayoutDashboard },
  { label: "My Startups", to: "/dashboard/founder/startups", icon: Rocket },
  { label: "Team Applications", to: "/dashboard/founder/applications", icon: ClipboardList },
  { label: "Investors", to: "/dashboard/founder/investors", icon: Wallet },
  { label: "Connect & Grow", to: "/investors", icon: Handshake },
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
];

// Deliberately flat, in this exact order — matches the reference dashboard
// layout the user pinned down. Company Team/My Orders still exist as real
// pages (linked from Settings/notifications/EditProfile) but are
// intentionally left out of this list; AI Assistant is left out entirely
// since there's no real destination for it yet.
const FREELANCER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/freelancer", icon: LayoutDashboard },
  { label: "Analytics", to: "/dashboard/freelancer/analytics", icon: TrendingUp },
  { label: "My Gigs", to: "/dashboard/freelancer/gigs", icon: Rocket },
  { label: "Projects", to: "/dashboard/freelancer/projects", icon: FolderKanban },
  { label: "Proposals", to: "/dashboard/freelancer/applications", icon: ClipboardList },
  { label: "Contest Entries", to: "/dashboard/freelancer/contests", icon: Trophy },
  { label: "Saved", to: "/dashboard/freelancer/saved", icon: Bookmark },
  { label: "Job Alerts", to: "/dashboard/freelancer/alerts", icon: Bell },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Calendar", to: "/dashboard/freelancer#calendar", icon: Calendar },
  { label: "Wallet", to: "/dashboard/freelancer/earnings", icon: Wallet },
  { label: "Reviews", to: "/dashboard/freelancer/reviews", icon: Star },
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Profile", to: "/dashboard/profile", icon: Image },
  { label: "Membership", to: "/pricing", icon: Crown },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
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
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", to: "/dashboard/admin/users", icon: UserCog, superAdminOnly: true },
  { label: "Staff", to: "/dashboard/admin/staff", icon: Users, superAdminOnly: true },
  { label: "Staff Activity", to: "/dashboard/admin/activity", icon: ClipboardList, superAdminOnly: true },
  { label: "Security Events", to: "/dashboard/admin/security-events", icon: ShieldAlert, superAdminOnly: true },
  { label: "Startups", to: "/dashboard/admin/startups", icon: Rocket, permission: "startups" },
  { label: "Flagged Startups", to: "/dashboard/admin/flagged-startups", icon: ShieldAlert, permission: "flagged-startups" },
  { label: "Jobs & Projects", to: "/dashboard/admin/jobs", icon: FolderKanban, permission: "jobs" },
  { label: "Gigs", to: "/dashboard/admin/gigs", icon: Briefcase, permission: "gigs" },
  { label: "Contests", to: "/dashboard/admin/contests", icon: Trophy, permission: "contests" },
  { label: "Campaigns", to: "/dashboard/admin/campaigns", icon: Megaphone, permission: "campaigns" },
  { label: "Reviews", to: "/dashboard/admin/reviews", icon: Star, permission: "reviews" },
  { label: "Referrals", to: "/dashboard/admin/referrals", icon: Gift, permission: "referrals" },
  { label: "Announcements", to: "/dashboard/admin/announcements", icon: Send, superAdminOnly: true },
  { label: "Payments", to: "/dashboard/admin/payments", icon: Wallet, superAdminOnly: true },
  { label: "Grievances", to: "/dashboard/admin/grievances", icon: MessageCircleWarning, permission: "grievances" },
  { label: "Withdrawals", to: "/dashboard/admin/withdrawals", icon: ArrowDownToLine, superAdminOnly: true },
  { label: "KYC Requests", to: "/dashboard/admin/kyc", icon: ShieldAlert, permission: "kyc" },
  { label: "Profile Verifications", to: "/dashboard/admin/profile-verifications", icon: ShieldAlert, permission: "profile-verifications" },
  { label: "Role Verifications", to: "/dashboard/admin/role-verifications", icon: ShieldAlert, permission: "role-verifications" },
  { label: "Plans", to: "/dashboard/admin/plans", icon: Crown, superAdminOnly: true },
  { label: "Subscriptions", to: "/dashboard/admin/subscriptions", icon: CreditCard, superAdminOnly: true },
  { label: "Platform Settings", to: "/dashboard/admin/settings", icon: Settings, superAdminOnly: true },
  { label: "Skill Tests", to: "/dashboard/admin/skill-tests", icon: GraduationCap, permission: "skill-tests" },
  { label: "Account Settings", to: "/settings", icon: UserCog },
];

const INVESTOR_ITEMS: SidebarItem[] = [
  { label: "Deal Flow", to: "/dashboard/investor", icon: TrendingUp },
  { label: "Browse Startups", to: "/startups", icon: Rocket },
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
];

const MENTOR_ITEMS: SidebarItem[] = [
  { label: "Session Requests", to: "/dashboard/mentor", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
];

const PARTNER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/partner", icon: LayoutDashboard },
  { label: "My Profile", to: "/dashboard/profile", icon: Building2 },
  { label: "Browse Startups", to: "/startups", icon: Rocket },
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
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
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Upgrade to Premium", to: "/pricing", icon: Crown },
  { label: "Settings", to: "/settings", icon: Settings },
];

const INFLUENCER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/influencer", icon: LayoutDashboard },
  { label: "Campaigns", to: "/campaigns", icon: Megaphone },
  { label: "Campaign Invites", to: "/dashboard/influencer/campaign-invites", icon: Send },
  { label: "Roster Invites", to: "/dashboard/influencer/roster-invites", icon: Handshake },
  { label: "Portfolio", to: "/dashboard/profile#portfolio", icon: Image },
  { label: "Profile", to: "/dashboard/profile", icon: Search },
  { label: "Wallet", to: "/dashboard/influencer/earnings", icon: Wallet },
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Upgrade to Premium", to: "/pricing", icon: Crown },
  { label: "Settings", to: "/settings", icon: Settings },
];

const CLIENT_ITEMS: SidebarItem[] = [
  { label: "Dashboard & My Projects", to: "/dashboard/client", icon: FolderKanban },
  { label: "Post a Project", to: "/dashboard/client/post-job", icon: Rocket },
  { label: "Company Team", to: "/dashboard/client/company", icon: Building2 },
  { label: "My Contests", to: "/dashboard/client/contests", icon: Trophy },
  { label: "My Payments", to: "/dashboard/client/payments", icon: Wallet },
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
];

// Shared by brand/agency/talent_partner — all three only ever hire
// influencers through Campaigns (see roleCategories.js's "hiring" group), so
// they reuse the employer's campaign/payments/company pages directly rather
// than getting a Jobs-focused dashboard of their own.
const CAMPAIGN_HIRER_ITEMS: SidebarItem[] = [
  { label: "My Campaigns", to: "/dashboard/employer/campaigns", icon: Megaphone },
  { label: "Post a Campaign", to: "/dashboard/employer/post-campaign", icon: Rocket },
  { label: "Shortlist", to: "/dashboard/employer/shortlist", icon: Bookmark },
  { label: "Company Team", to: "/dashboard/employer/company", icon: Building2 },
  { label: "Edit Profile", to: "/dashboard/profile", icon: Image },
  { label: "My Payments", to: "/dashboard/employer/payments", icon: Wallet },
  { label: "Mentor Requests", to: "/dashboard/mentor/requests", icon: GraduationCap },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
];

// Brand-only: agencies it has accepted to manage its campaigns, and what
// those agencies are running for it (see agencyClient.routes.js's "mine"
// endpoint, which is brand-only, unlike "managed" which is agency-only).
// "Dashboard" links to its own stats overview (EmployerDashboard with
// source="campaign") — distinct per role since each shows different
// role-specific numbers (My Agencies/My Clients/Roster).
const BRAND_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/brand", icon: LayoutDashboard },
  CAMPAIGN_HIRER_ITEMS[0],
  CAMPAIGN_HIRER_ITEMS[1],
  { label: "My Agencies", to: "/dashboard/employer/agencies", icon: Handshake },
  ...CAMPAIGN_HIRER_ITEMS.slice(2),
];

// agency/talent_partner get everything brand gets, plus the consent-gated
// creator roster (invite/accept) that only those two roles can build — see
// talentRoster.routes.js's authorize() list. Brand deliberately doesn't get
// this link since its role isn't allowed to hit those endpoints.
const ROSTER_HIRER_ITEMS: SidebarItem[] = [
  CAMPAIGN_HIRER_ITEMS[0],
  CAMPAIGN_HIRER_ITEMS[1],
  { label: "Roster", to: "/dashboard/employer/roster", icon: Users },
  ...CAMPAIGN_HIRER_ITEMS.slice(2),
];

const TALENT_PARTNER_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/talent-partner", icon: LayoutDashboard },
  ...ROSTER_HIRER_ITEMS,
];

// Agency-only: brands who've delegated campaign management to it (see
// agencyClient.routes.js's "managed"/"pending" endpoints, agency-only —
// talent_partner has no equivalent relationship, so it stays off this list).
const AGENCY_ITEMS: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard/agency", icon: LayoutDashboard },
  ROSTER_HIRER_ITEMS[0],
  ROSTER_HIRER_ITEMS[1],
  ROSTER_HIRER_ITEMS[2],
  { label: "My Clients", to: "/dashboard/employer/clients", icon: Handshake },
  ...ROSTER_HIRER_ITEMS.slice(3),
];

// Shown to a registered user who hasn't picked a role yet (see Explore.tsx)
// on every role-agnostic shared page (Messages, Notifications, Settings,
// Referrals, ...) — a real, minimal sidebar of its own rather than
// pretending they're a founder/freelancer/employer just because that
// happened to be some page's hardcoded fallback (see resolveDashboardRole's
// history below).
const UNASSIGNED_ITEMS: SidebarItem[] = [
  { label: "Choose your role", to: "/dashboard/explore", icon: Compass },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Notifications", to: "/dashboard/notifications", icon: Bell },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift },
  { label: "Settings", to: "/settings", icon: Settings },
];

export type DashboardRole =
  | Extract<
      UserRole,
      | "founder"
      | "freelancer"
      | "job_seeker"
      | "influencer"
      | "employer"
      | "super_admin"
      | "staff"
      | "investor"
      | "mentor"
      | "partner"
      | "client"
      | "brand"
      | "agency"
      | "talent_partner"
    >
  // Not a real UserRole — see UNASSIGNED_ITEMS above.
  | "unassigned";

const ITEMS_BY_ROLE: Record<DashboardRole, SidebarItem[]> = {
  founder: FOUNDER_ITEMS,
  freelancer: FREELANCER_ITEMS,
  job_seeker: JOB_SEEKER_ITEMS,
  influencer: INFLUENCER_ITEMS,
  employer: EMPLOYER_ITEMS,
  super_admin: ADMIN_ITEMS,
  staff: ADMIN_ITEMS,
  investor: INVESTOR_ITEMS,
  mentor: MENTOR_ITEMS,
  partner: PARTNER_ITEMS,
  client: CLIENT_ITEMS,
  brand: BRAND_ITEMS,
  agency: AGENCY_ITEMS,
  talent_partner: TALENT_PARTNER_ITEMS,
  unassigned: UNASSIGNED_ITEMS,
};

// Every role-agnostic shared page (Referrals, Settings, Messages,
// Notifications, EditProfile, ...) needs to pick which sidebar to render
// itself under. They used to each keep their own hand-copied list of "valid"
// roles, which silently drifted out of sync as new roles (job_seeker,
// influencer, staff, brand, agency, talent_partner) were added — several of
// them fell back to the wrong sidebar entirely. ITEMS_BY_ROLE is typed as
// Record<DashboardRole, ...>, so its keys are always the complete, correct
// set by construction — checking against that instead can never drift again.
// They also used to each pass their own fallback role (several different
// ones) for a user with no role at all yet — "unassigned" replaces that
// guessing with a real, honest sidebar for that state.
export function resolveDashboardRole(role: UserRole | null | undefined, fallback: DashboardRole = "unassigned"): DashboardRole {
  return role && role in ITEMS_BY_ROLE ? (role as DashboardRole) : fallback;
}

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

  let items = ITEMS_BY_ROLE[role]
    // Checked against the real logged-in user's role, not the `role` prop —
    // every admin page passes role="super_admin" to this component
    // unconditionally (it predates staff accounts existing at all), so the
    // prop can't be trusted to tell a staff viewer apart from a real
    // super_admin. A staff account only sees items it has a granted
    // permission for; a super_admin sees everything (see requirePermission
    // on the backend for the actual enforcement — this is UX, not the
    // security boundary).
    .filter((item) => {
      if (user?.role !== "staff") return true;
      if (item.superAdminOnly) return false;
      if (!item.permission) return true;
      return user?.staffPermissions?.includes(item.permission);
    })
    .map((item) => {
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

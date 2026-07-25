import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  MapPin,
  Share2,
  Heart,
  Linkedin,
  Loader2,
  Plus,
  MessageSquare,
  Users2,
  Package,
  Briefcase,
  CalendarDays,
  Eye,
  ThumbsUp,
  MessageCircle,
  FileText,
  Download,
  XCircle,
  CheckCircle2,
  Target,
  TrendingUp,
  Layers,
  Users,
  Wallet,
  Clock,
  PieChart,
  Lightbulb,
  Rocket,
  Award,
  Globe,
  Truck,
  HelpCircle,
  Handshake,
  Ban,
  Search,
  Reply,
  Flag,
  Send,
  Twitter,
  Facebook,
  Instagram,
  Megaphone,
  Settings,
  Sparkles,
  Mail,
  FileSpreadsheet,
  Archive,
  Filter,
  FilePlus2,
  FolderCheck,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { startupApi } from "@/api/startups";
import { FileUpload } from "@/components/shared/FileUpload";
import { startupUpdateApi } from "@/api/startupUpdates";
import { discussionApi } from "@/api/discussions";
import { chatApi } from "@/api/chat";
import { investmentApi } from "@/api/investments";
import { authApi } from "@/api/auth";
import { loadRazorpayScript } from "@/lib/razorpay";
import { formatCurrency, formatCompactNumber, cn, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { JoinTeamModal } from "@/components/startup/JoinTeamModal";
import { RoleDetailsModal } from "@/components/startup/RoleDetailsModal";
import type {
  Discussion,
  DiscussionComment,
  InterestedUser,
  OpenRole,
  Startup,
  StartupDocument,
  StartupProduct,
  TeamMember,
  VerificationRequest,
  VerificationRequestType,
} from "@/types";

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage",
  pre_seed: "Pre-Seed",
  seed: "Seed Stage",
  series_a: "Series A",
  series_b: "Series B",
  growth: "Growth",
};

const TAG_COLORS = [
  { bg: "#e8effe", fg: "#2563eb" },
  { bg: "#f1ebfc", fg: "#7c3aed" },
  { bg: "#e7f7ec", fg: "#16a34a" },
  { bg: "#fdf1de", fg: "#d97706" },
];

const FUND_ITEM_COLORS = [
  { bg: "#e8effe", fg: "#2563eb" },
  { bg: "#e7f7ec", fg: "#16a34a" },
  { bg: "#fdf1de", fg: "#d97706" },
  { bg: "#f1ebfc", fg: "#7c3aed" },
  { bg: "#fce8e8", fg: "#dc2626" },
];

function FundStat({ icon: Icon, color, value, label }: { icon: typeof Briefcase; color: string; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] p-3">
      <Icon className="h-4 w-4" style={{ color }} />
      <p className="mt-1.5 text-[13px] font-bold">{value}</p>
      <p className="text-[10.5px] text-[#64748b]">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-[#64748b]">{label}</span>
      <span className="text-right font-semibold text-[#0f172a]">{value}</span>
    </>
  );
}

function daysLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

const DOCUMENT_CATEGORIES = ["Legal & Registration", "Financials", "Business Plan", "Pitch Deck", "Product", "Other"] as const;

function fileIconFor(url: string) {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, bg: "#fce8e8", fg: "#dc2626" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "#e7f7ec", fg: "#16a34a" };
  if (["zip", "rar", "7z"].includes(ext)) return { icon: Archive, bg: "#e7f7ec", fg: "#16a34a" };
  if (["doc", "docx"].includes(ext)) return { icon: FileText, bg: "#e8effe", fg: "#2563eb" };
  return { icon: FileText, bg: "#f1f5f9", fg: "#64748b" };
}

const UPDATE_CATEGORIES = ["Announcement", "Milestone", "Partnership", "Development", "Other"] as const;

const UPDATE_CATEGORY_META: Record<string, { bg: string; fg: string; icon: typeof Megaphone }> = {
  Announcement: { bg: "#e7f7ec", fg: "#16a34a", icon: Megaphone },
  Milestone: { bg: "#fdf1de", fg: "#d97706", icon: Flag },
  Partnership: { bg: "#f1ebfc", fg: "#7c3aed", icon: Handshake },
  Development: { bg: "#e8effe", fg: "#2563eb", icon: Settings },
  Other: { bg: "#f1f5f9", fg: "#64748b", icon: Sparkles },
};

const CATEGORY_META: Record<Discussion["category"], { bg: string; fg: string; icon: typeof HelpCircle }> = {
  Questions: { bg: "#e7f7ec", fg: "#16a34a", icon: HelpCircle },
  Feedback: { bg: "#fdf1de", fg: "#d97706", icon: MessageCircle },
  Partnerships: { bg: "#f1ebfc", fg: "#7c3aed", icon: Handshake },
  Investors: { bg: "#e8effe", fg: "#2563eb", icon: Briefcase },
  General: { bg: "#e0f6f6", fg: "#0d9488", icon: HelpCircle },
};

const TABS = [
  ["overview", "Overview"],
  ["team", "Team"],
  ["funding", "Funding & Needs"],
  ["investments", "Investments"],
  ["product", "Product / Plan"],
  ["discussions", "Discussions"],
  ["updates", "Updates"],
  ["documents", "Documents"],
] as const;

type TabValue = (typeof TABS)[number][0];

const DISCUSSION_CATEGORIES = ["All Discussions", "Questions", "Feedback", "Partnerships", "General"] as const;
const POST_CATEGORIES = ["Questions", "Feedback", "Partnerships", "General"] as const;

export default function StartupDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabValue>("overview");
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [joinModal, setJoinModal] = useState<{ open: boolean; role: OpenRole | null }>({ open: false, role: null });
  const [roleDetailsModal, setRoleDetailsModal] = useState<{ open: boolean; role: OpenRole | null }>({ open: false, role: null });
  const [productModal, setProductModal] = useState<StartupProduct | null>(null);
  const [discussionComposerOpen, setDiscussionComposerOpen] = useState(false);

  const { data: startup, isLoading } = useQuery({
    queryKey: ["startups", id],
    queryFn: () => startupApi.getById(id),
    enabled: !!id,
  });

  const followMutation = useMutation({
    mutationFn: () => startupApi.toggleFollow(id),
    // Patch the cached startup directly instead of invalidating — refetching getById
    // increments the server-side view count on every call, so an invalidate here would
    // silently inflate "Views" every time someone clicks Save/Follow.
    onSuccess: (data) => {
      queryClient.setQueryData<Startup>(["startups", id], (prev) => {
        if (!prev || !user) return prev;
        const followers = data.following
          ? Array.from(new Set([...prev.followers, user.id]))
          : prev.followers.filter((f) => f !== user.id);
        return { ...prev, followers };
      });
    },
  });

  const interestMutation = useMutation({
    mutationFn: () => startupApi.toggleInterest(id),
    // Same reasoning as followMutation — patch the cache, don't invalidate/refetch.
    onSuccess: (data) => {
      queryClient.setQueryData<Startup>(["startups", id], (prev) => {
        if (!prev || !user) return prev;
        const interested = data.interested
          ? [...prev.interested, user.id]
          : prev.interested.filter((i) => (typeof i === "string" ? i : i._id) !== user.id);
        return { ...prev, interested };
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: () => startupApi.report(id, reportReason),
    onSuccess: () => setReportReason(""),
  });

  const messageFounderMutation = useMutation({
    mutationFn: (founderId: string) => chatApi.getOrCreateConversation(founderId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const { data: allDiscussions } = useQuery({
    queryKey: ["startups", id, "discussions", "all"],
    queryFn: () => discussionApi.list(id),
    enabled: tab === "discussions",
  });

  const { data: updatesList } = useQuery({
    queryKey: ["startups", id, "updates"],
    queryFn: () => startupUpdateApi.list(id),
    enabled: tab === "updates",
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Startup not found</p>
        <Link to="/startups" className="mt-4 inline-block rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-semibold">
          Back to Startups
        </Link>
      </div>
    );
  }

  const founder = typeof startup.founder === "object" ? startup.founder : null;
  const isOwner = !!user && !!founder && user.id === founder._id;
  const isFollowing = user ? startup.followers.includes(user.id) : false;
  const interestedIds = startup.interested.map((i) => (typeof i === "string" ? i : i._id));
  const isInterested = user ? interestedIds.includes(user.id) : false;
  const interestedUsers = startup.interested.filter((i): i is InterestedUser => typeof i === "object");
  const investorPartners = interestedUsers.filter((i) => i.role === "investor" || i.role === "partner");
  // Confirmed Investment records, not the older "interested" toggle — this is what
  // actually changes when a founder confirms/declines an investor's report.
  const confirmedInvestorCount = startup.confirmedInvestorCount ?? 0;
  const fundingPct = Math.min(100, Math.round((startup.fundingRaised / (startup.fundingNeeded || 1)) * 100));

  const recentActivity = [...(allDiscussions ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const ctaContent =
    tab === "product"
      ? { icon: Package, title: "Believe in our product and vision?", subtitle: "Invest in our plan and help us build a strong future." }
      : tab === "updates" || tab === "documents"
      ? { icon: Rocket, title: "Support our journey and be a part of our growth!", subtitle: "Stay connected and help us make this vision a reality." }
      : { icon: Lightbulb, title: "This idea excites you?", subtitle: "Invest now and help the founder build something amazing." };

  const handleMessageFounder = () => {
    if (!user) return navigate("/login");
    if (founder) messageFounderMutation.mutate(founder._id);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#f8fafc]">
      <div className="container py-6">
        <Link to="/startups" className="mb-4 flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-[#64748b] hover:text-[#0f172a]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Startups
        </Link>
        <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
          {/* MAIN COLUMN */}
          <div className="min-w-0 space-y-5">
            {/* Header card */}
            <div className="flex flex-col gap-5 rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:flex-row">
              <div className="flex shrink-0 flex-col gap-3 sm:w-72">
                <div className="relative h-52 overflow-hidden rounded-xl bg-gradient-to-br from-[#16324a] via-[#2a6b56] to-[#7fae7a]">
                  {startup.coverImage && <img src={startup.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <span className="absolute left-3 top-3 rounded-full bg-[#2563eb] px-3 py-1 text-[11px] font-bold text-white">
                    {STAGE_LABELS[startup.stage]}
                  </span>
                  <button
                    onClick={() => user && followMutation.mutate()}
                    disabled={!user || followMutation.isPending}
                    className={cn(
                      "absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm",
                      isFollowing ? "bg-red-500/80 text-white" : "bg-black/50 text-white hover:bg-black/60"
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5", isFollowing && "fill-white")} /> {isFollowing ? "Saved" : "Save"}
                  </button>
                </div>

                {(startup.website || Object.values(startup.socialLinks ?? {}).some(Boolean)) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {startup.website && (
                      <a
                        href={startup.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                      >
                        <Globe className="h-3.5 w-3.5 text-[#2563eb]" /> Visit Website
                      </a>
                    )}
                    <div className="flex items-center gap-2">
                      {startup.socialLinks?.linkedin && (
                        <a href={startup.socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb] hover:opacity-80">
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {startup.socialLinks?.twitter && (
                        <a href={startup.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb] hover:opacity-80">
                          <Twitter className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {startup.socialLinks?.facebook && (
                        <a href={startup.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb] hover:opacity-80">
                          <Facebook className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {startup.socialLinks?.instagram && (
                        <a href={startup.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb] hover:opacity-80">
                          <Instagram className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="flex flex-wrap items-center gap-2 text-[24px] font-extrabold text-[#0f172a]">
                      {startup.name}
                      {startup.isVerified ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#e8effe] px-2.5 py-1 text-[11px] font-bold text-[#2563eb]">
                          <ShieldCheck className="h-3.5 w-3.5" /> MahaHub Verified
                        </span>
                      ) : startup.founderVerified ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#e7f7ec] px-2.5 py-1 text-[11px] font-bold text-[#16a34a]">
                          <ShieldCheck className="h-3.5 w-3.5" /> Founder Verified
                        </span>
                      ) : null}
                    </h1>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#64748b]">
                      <MapPin className="h-3.5 w-3.5" /> {startup.location}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    {isOwner && (
                      <Link
                        to={`/dashboard/founder/startup/${startup._id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12.5px] font-bold text-white hover:opacity-90"
                      >
                        <Pencil className="h-4 w-4" /> Edit Startup
                      </Link>
                    )}
                    {!isOwner && (
                      <>
                        <button
                          onClick={() => {
                            if (!user) return navigate("/login");
                            if (!isInterested) interestMutation.mutate();
                            setTab("investments");
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12.5px] font-bold text-white hover:opacity-90"
                        >
                          <Wallet className="h-4 w-4" /> Invest
                        </button>
                        <button
                          onClick={() => {
                            if (!isInterested) user && interestMutation.mutate();
                            handleMessageFounder();
                          }}
                          disabled={!user || messageFounderMutation.isPending}
                          className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                        >
                          <MessageSquare className="h-4 w-4" /> Message
                        </button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleShare}>
                          <Share2 className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Share"}
                        </DropdownMenuItem>
                        {user && !isOwner && (
                          <DropdownMenuItem onClick={() => setReportOpen((v) => !v)} className="text-danger focus:text-danger">
                            <Flag className="h-3.5 w-3.5" /> Report
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="mt-3 text-[13.5px] leading-relaxed text-[#374151]">{startup.tagline}</p>

                <div className="mt-4 border-t border-[#f1f5f9] pt-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={founder?.avatar} alt={founder?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[11px] font-bold text-white">
                      {founder ? initialsFromName(founder.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {founder ? (
                      <Link to={`/founders/${founder._id}`} className="text-[12.5px] font-bold text-[#0f172a] hover:underline">
                        {founder.name}
                      </Link>
                    ) : (
                      <p className="text-[12.5px] font-bold text-[#0f172a]">Unknown</p>
                    )}
                    <p className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                      Founder
                      {founder?.createdAt && isRecentAccount(founder.createdAt) && (
                        <span className="rounded-full bg-[#fce8e8] px-1.5 py-0.5 text-[9.5px] font-bold text-[#dc2626]">New Founder Account</span>
                      )}
                    </p>
                  </div>
                  <span className="ml-2 flex items-center gap-1 text-[11.5px] text-[#94a3b8]">
                    <CalendarDays className="h-3.5 w-3.5" /> Posted on {new Date(startup.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1 text-[11.5px] text-[#94a3b8]">
                    <Eye className="h-3.5 w-3.5" /> {formatCompactNumber(startup.viewCount)} Views
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[startup.industry, ...(startup.subIndustry ? [startup.subIndustry] : []), ...startup.fundingType].slice(0, 4).map((tag, i) => (
                    <span
                      key={tag + i}
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: TAG_COLORS[i % TAG_COLORS.length].bg, color: TAG_COLORS[i % TAG_COLORS.length].fg }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {reportOpen && (
                  <div className="mt-4 rounded-lg border border-[#fce8e8] bg-[#fef7f7] p-3">
                    <p className="text-[11.5px] font-semibold text-[#dc2626]">Why are you reporting this startup?</p>
                    <Textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="e.g. fake funding claims, misleading info, spam..."
                      className="mt-2 min-h-[56px] bg-white text-[12px]"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => reportMutation.mutate()}
                        disabled={reportMutation.isPending || reportMutation.isSuccess}
                        className="flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 py-1.5 text-[11.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {reportMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {reportMutation.isSuccess ? "Reported" : "Submit Report"}
                      </button>
                      <button onClick={() => setReportOpen(false)} className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-white">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white">
              <div className="flex flex-wrap gap-6 overflow-x-auto border-b border-[#e2e8f0] px-5">
                {TABS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={cn(
                      "whitespace-nowrap border-b-2 py-3.5 text-[13px] font-semibold",
                      tab === value ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-5 p-5">
                {tab === "overview" && (
                  <>
                    <div className="flex flex-wrap gap-5">
                      <div className="min-w-[240px] flex-1 basis-72">
                        <SectionCard title="About the Idea">
                          <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#374151]">{startup.description}</p>
                          {startup.targetAudience && (
                            <p className="mt-3 flex items-start gap-2 text-[12.5px] text-[#64748b]">
                              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb]" />
                              <span><span className="font-semibold text-[#0f172a]">Target Audience:</span> {startup.targetAudience}</span>
                            </p>
                          )}
                        </SectionCard>
                      </div>
                      {startup.highlights.length > 0 && (
                        <div className="min-w-[240px] flex-1 basis-72">
                          <SectionCard title="Highlights">
                            <ul className="space-y-2.5">
                              {startup.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#334155]">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {h}
                                </li>
                              ))}
                            </ul>
                          </SectionCard>
                        </div>
                      )}
                    </div>

                    {startup.missionStatement && (
                      <SectionCard title="Our Mission" icon={Lightbulb} iconColor="#2563eb">
                        <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#374151]">{startup.missionStatement}</p>
                      </SectionCard>
                    )}

                    {(startup.problemStatement || startup.solution) && (
                      <div className="flex flex-wrap gap-5">
                        {startup.problemStatement && (
                          <div className="min-w-[240px] flex-1 basis-72">
                            <SectionCard title="Problem" titleColor="#dc2626" icon={XCircle} iconColor="#dc2626">
                              <ul className="space-y-2">
                                {startup.problemStatement.split("\n").filter(Boolean).map((line, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#334155]">
                                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" /> {line}
                                  </li>
                                ))}
                              </ul>
                            </SectionCard>
                          </div>
                        )}
                        {startup.solution && (
                          <div className="min-w-[240px] flex-1 basis-72">
                            <SectionCard title="Solution" titleColor="#16a34a" icon={CheckCircle2} iconColor="#16a34a">
                              <ul className="space-y-2">
                                {startup.solution.split("\n").filter(Boolean).map((line, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#334155]">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" /> {line}
                                  </li>
                                ))}
                              </ul>
                            </SectionCard>
                          </div>
                        )}
                      </div>
                    )}

                    {startup.businessPlan.length > 0 && (
                      <SectionCard title="Business Plan Summary">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {startup.businessPlan.map((item, i) => {
                            const icons = [Target, TrendingUp, Layers, Users];
                            const Icon = icons[i % icons.length];
                            return (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#2563eb]">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <div>
                                  <p className="text-[12.5px] font-bold text-[#2563eb]">{item.label}</p>
                                  <p className="text-[11.5px] text-[#64748b]">{item.value}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </SectionCard>
                    )}

                    {startup.tractionStats.length > 0 && (
                      <SectionCard title="Traction">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {startup.tractionStats.map((item, i) => {
                            const icons = [TrendingUp, Users2, CheckCircle2, PieChart];
                            const Icon = icons[i % icons.length];
                            return (
                              <div key={i} className="rounded-lg border border-[#e2e8f0] p-3">
                                <Icon className="h-4 w-4 text-[#16a34a]" />
                                <p className="mt-1.5 text-[14px] font-extrabold text-[#0f172a]">{item.value}</p>
                                <p className="text-[10.5px] text-[#64748b]">{item.label}</p>
                              </div>
                            );
                          })}
                        </div>
                      </SectionCard>
                    )}

                    {startup.milestones.length > 0 && (
                      <SectionCard title="Milestones">
                        <div className="space-y-0">
                          {[...startup.milestones]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((m, i, arr) => (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <span className="mt-1.5 h-2 w-2 rounded-full bg-[#2563eb]" />
                                  {i < arr.length - 1 && <span className="mt-1 w-px flex-1 bg-[#e2e8f0]" />}
                                </div>
                                <div className={cn("pb-5", i === arr.length - 1 && "pb-0")}>
                                  <p className="text-[13px] font-bold">{m.title}</p>
                                  <p className="text-[11px] text-[#94a3b8]">{new Date(m.date).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}</p>
                                  {m.description && <p className="mt-1 text-[12px] text-[#64748b]">{m.description}</p>}
                                </div>
                              </div>
                            ))}
                        </div>
                      </SectionCard>
                    )}
                  </>
                )}

                {tab === "team" && (
                  <TeamTab
                    openRoles={startup.openRoles}
                    team={startup.team}
                    onOpenModal={(role) => setJoinModal({ open: true, role })}
                    onViewDetails={(role) => setRoleDetailsModal({ open: true, role })}
                  />
                )}

                {tab === "funding" && (
                  <div className="space-y-5">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <SectionCard title="Funding Overview">
                      <div className="flex items-center gap-5">
                        <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
                          <circle cx="44" cy="44" r="37" fill="none" stroke="#e2e8f0" strokeWidth="9" />
                          <circle
                            cx="44"
                            cy="44"
                            r="37"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 37}
                            strokeDashoffset={2 * Math.PI * 37 * (1 - fundingPct / 100)}
                            transform="rotate(-90 44 44)"
                          />
                          <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0f172a">{fundingPct}%</text>
                        </svg>
                        <div>
                          <p className="text-[20px] font-extrabold text-[#2563eb]">{formatCurrency(startup.fundingNeeded)}</p>
                          <p className="text-[11.5px] text-[#64748b]">Funding Goal</p>
                          <p className="mt-2 text-[17px] font-extrabold text-[#0f172a]">{formatCurrency(startup.fundingRaised)}</p>
                          <p className="text-[11.5px] text-[#64748b]">Raised Amount</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <FundStat icon={Briefcase} color="#2563eb" value={formatCurrency(startup.fundingNeeded)} label="Goal Amount" />
                        <FundStat icon={CheckCircle2} color="#16a34a" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                        <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                        <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
                      </div>
                    </SectionCard>

                    <SectionCard title="Funding Details">
                      <div className="grid grid-cols-2 gap-y-3 text-[12.5px]">
                        <DetailRow label="Funding Type" value={startup.fundingType[0] || "—"} />
                        <DetailRow label="Investment Type" value={startup.investmentType || "—"} />
                        <DetailRow label="Minimum Investment" value={startup.minimumInvestment ? formatCurrency(startup.minimumInvestment) : "—"} />
                        <DetailRow label="Funding Duration" value={startup.fundingDurationMonths ? `${startup.fundingDurationMonths} Months` : "—"} />
                        <DetailRow
                          label="Expected Closing"
                          value={startup.expectedClosingDate ? new Date(startup.expectedClosingDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        />
                        <DetailRow label="Location" value={startup.location} />
                      </div>
                    </SectionCard>
                  </div>

                    {startup.fundUsagePlan.length > 0 && (
                      <SectionCard title="Fund Usage Plan">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[12.5px]">
                              <thead>
                                <tr className="border-b border-[#e2e8f0] text-[11px] uppercase tracking-wide text-[#94a3b8]">
                                  <th className="pb-2 pr-3 font-semibold">Category</th>
                                  <th className="pb-2 pr-3 font-semibold">Description</th>
                                  <th className="pb-2 pr-3 text-right font-semibold">Estimated Cost</th>
                                  <th className="pb-2 font-semibold">Percentage</th>
                                </tr>
                              </thead>
                              <tbody>
                                {startup.fundUsagePlan.map((item, i) => {
                                  const pct = startup.fundingNeeded ? Math.round((item.estimatedCost / startup.fundingNeeded) * 100) : 0;
                                  const color = FUND_ITEM_COLORS[i % FUND_ITEM_COLORS.length];
                                  return (
                                    <tr key={i} className="border-b border-[#f1f5f9] last:border-0">
                                      <td className="py-2.5 pr-3">
                                        <span className="flex items-center gap-2 font-semibold">
                                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: color.bg, color: color.fg }}>
                                            <Package className="h-3 w-3" />
                                          </span>
                                          {item.category}
                                        </span>
                                      </td>
                                      <td className="py-2.5 pr-3 text-[#64748b]">{item.description}</td>
                                      <td className="py-2.5 pr-3 text-right font-semibold">{formatCurrency(item.estimatedCost)}</td>
                                      <td className="w-40 py-2.5">
                                        <div className="flex items-center gap-2">
                                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color.fg }} />
                                          </div>
                                          <span className="w-9 shrink-0 text-right text-[11px] font-bold">{pct}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr>
                                  <td className="pt-3 font-bold" colSpan={2}>Total</td>
                                  <td className="pt-3 text-right font-bold">
                                    {formatCurrency(startup.fundUsagePlan.reduce((sum, i) => sum + i.estimatedCost, 0))}
                                  </td>
                                  <td className="pt-3 font-bold">100%</td>
                                </tr>
                              </tbody>
                            </table>
                        </div>
                      </SectionCard>
                    )}

                    {(startup.expectedOutcomes.length > 0 || !!startup.pitchDeckUrl || !!startup.documents?.length) && (
                      <div className="flex flex-wrap gap-5">
                        {startup.expectedOutcomes.length > 0 && (
                          <div className="min-w-[240px] flex-1 basis-72">
                            <SectionCard title="Expected Outcomes">
                              <div className="space-y-3">
                                {startup.expectedOutcomes.map((o, i) => {
                                  const icons = [Clock, TrendingUp, PieChart, Users2, Briefcase];
                                  const Icon = icons[i % icons.length];
                                  return (
                                    <div key={i} className="flex items-start justify-between gap-3">
                                      <span className="flex items-center gap-2 text-[12px] text-[#64748b]">
                                        <Icon className="h-3.5 w-3.5 shrink-0 text-[#2563eb]" /> {o.label}
                                      </span>
                                      <span className="shrink-0 text-[12.5px] font-bold text-[#0f172a]">{o.value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </SectionCard>
                          </div>
                        )}

                        {(!!startup.pitchDeckUrl || !!startup.documents?.length) && (
                          <div className="min-w-[240px] flex-1 basis-72">
                            <SectionCard title="Documents">
                              <div className="divide-y divide-[#f1f5f9]">
                                {startup.pitchDeckUrl && <DocRow name="Pitch Deck" url={startup.pitchDeckUrl} />}
                                {startup.documents?.map((d, i) => <DocRow key={i} name={d.name} url={d.url} />)}
                              </div>
                              <button onClick={() => setTab("documents")} className="mt-2 text-[11.5px] font-bold text-[#2563eb]">
                                View All Documents
                              </button>
                            </SectionCard>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tab === "investments" && (
                  <InvestmentsSection
                    startupId={id}
                    isOwner={isOwner}
                    canReport={!!user && !isOwner}
                    onMessageFounder={handleMessageFounder}
                    isStartupVerified={startup.isVerified}
                    isFounderVerified={startup.founderVerified}
                  />
                )}

                {tab === "investments" && isOwner && (
                  <SectionCard title="Interested Investors & Partners">
                    <p className="mb-3 text-[11.5px] text-[#94a3b8]">Only visible to you as the founder.</p>
                    {investorPartners.length === 0 ? (
                      <EmptyNote text="No investors or partners have connected yet." />
                    ) : (
                      <div className="divide-y divide-[#f1f5f9]">
                        {investorPartners.map((p) => (
                          <div key={p._id} className="flex items-center gap-3 py-3">
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage src={p.avatar} alt={p.name} />
                              <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-xs font-bold text-white">
                                {initialsFromName(p.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-[13px] font-bold">{p.name}</p>
                              <p className="text-[11.5px] capitalize text-[#64748b]">{p.role}</p>
                            </div>
                            <span className="rounded-full bg-[#e7f7ec] px-2.5 py-1 text-[10.5px] font-bold text-[#16a34a]">Interested</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                )}

                {tab === "product" && (
                  <>
                    {(startup.products.length > 0 || startup.productHighlights.length > 0) && (
                      <div className="flex flex-wrap gap-5">
                        {startup.products.length > 0 && (
                          <div className="min-w-[300px] flex-[2] basis-[420px]">
                            <SectionCard title="Our Product">
                              <ProductCarousel products={startup.products} onSelect={setProductModal} />
                            </SectionCard>
                          </div>
                        )}

                        {startup.productHighlights.length > 0 && (
                          <div className="min-w-[240px] flex-1 basis-72">
                            <SectionCard title="Product Highlights">
                              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                                {startup.productHighlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16a34a]" /> {h}
                                  </li>
                                ))}
                              </ul>
                            </SectionCard>
                          </div>
                        )}
                      </div>
                    )}

                    {startup.planPhases.length > 0 && (
                      <SectionCard title="Our Plan">
                        <div className="grid gap-4 sm:grid-cols-3">
                          {startup.planPhases.map((phase, i) => {
                            const icons = [Rocket, TrendingUp, Award];
                            const Icon = icons[i % icons.length];
                            return (
                              <div key={i} className="flex flex-col rounded-xl border border-[#e2e8f0] p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8effe] text-[#2563eb]">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  {phase.timeframe && (
                                    <span className="shrink-0 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">{phase.timeframe}</span>
                                  )}
                                </div>
                                <p className="mt-2.5 text-[13px] font-bold">{phase.title}</p>
                                {phase.checklist.length > 0 && (
                                  <ul className="mt-2 flex-1 space-y-1.5">
                                    {phase.checklist.map((c, ci) => (
                                      <li key={ci} className="flex items-start gap-1.5 text-[11.5px] text-[#64748b]">
                                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#16a34a]" /> {c}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {phase.estimatedCost > 0 && (
                                  <p className="mt-3 border-t border-[#f1f5f9] pt-2.5 text-[11.5px] font-bold text-[#2563eb]">
                                    Est. Cost: {formatCurrency(phase.estimatedCost)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </SectionCard>
                    )}

                    {(startup.marketStats.length > 0 || startup.competitiveAdvantage.length > 0) && (
                      <div className="flex flex-wrap gap-5">
                        {startup.marketStats.length > 0 && (
                          <div className="min-w-[240px] flex-1 basis-72">
                            <SectionCard title="Market Opportunity">
                              <div className="grid grid-cols-2 gap-3">
                                {startup.marketStats.map((s, i) => {
                                  const icons = [Globe, Users2, TrendingUp, PieChart];
                                  const Icon = icons[i % icons.length];
                                  return (
                                    <div key={i} className="rounded-lg border border-[#e2e8f0] p-3">
                                      <Icon className="h-4 w-4 text-[#2563eb]" />
                                      <p className="mt-1.5 text-[14px] font-extrabold text-[#0f172a]">{s.value}</p>
                                      <p className="text-[10.5px] text-[#64748b]">{s.label}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </SectionCard>
                          </div>
                        )}

                        {startup.competitiveAdvantage.length > 0 && (
                          <div className="min-w-[240px] flex-1 basis-72">
                            <SectionCard title="Our Competitive Advantage">
                              <ul className="space-y-2.5">
                                {startup.competitiveAdvantage.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#334155]">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {c}
                                  </li>
                                ))}
                              </ul>
                            </SectionCard>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {tab === "discussions" && (
                  <DiscussionsTab
                    startupId={id}
                    canPost={!!user}
                    open={discussionComposerOpen}
                    onOpenChange={setDiscussionComposerOpen}
                  />
                )}
                {tab === "updates" && <UpdatesTab startupId={id} isFounder={!!user && !!founder && user.id === founder._id} canPost={!!user} />}

                {tab === "documents" && (
                  <>
                    {isOwner && (
                      <VerificationPanel
                        startupId={id}
                        founderVerified={startup.founderVerified}
                        isVerified={startup.isVerified}
                        verificationRequests={startup.verificationRequests ?? []}
                      />
                    )}
                    <DocumentsTab documents={startup.documents ?? []} pitchDeckUrl={startup.pitchDeckUrl} />
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb]">
                  <ctaContent.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-[#0f172a]">{ctaContent.title}</p>
                  <p className="text-[12px] text-[#64748b]">{ctaContent.subtitle}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (!user) return navigate("/login");
                    if (!isInterested) interestMutation.mutate();
                    setTab("investments");
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
                >
                  <Wallet className="h-4 w-4" /> Invest
                </button>
                <button
                  onClick={handleMessageFounder}
                  disabled={!user || messageFounderMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  <MessageSquare className="h-4 w-4" /> Message Founder
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  <Share2 className="h-4 w-4" /> {copied ? "Copied!" : "Share Startup"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-5">
            {tab === "team" ? (
              <>
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb]">
                    <Users2 className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 text-[15px] font-bold text-[#0f172a]">Join the Team</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">
                    Like this idea? Use your skills to help build this startup — join the team.
                  </p>
                  <button
                    onClick={() => setJoinModal({ open: true, role: null })}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
                  >
                    <Users2 className="h-4 w-4" /> Join Team
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">How It Works?</h4>
                  <div className="mt-4 space-y-4">
                    {[
                      ["Choose a Role", "Pick the role that matches your skills."],
                      ["Submit Application", "Fill in your info and experience, and apply."],
                      ["Founder Review", "The founder reviews your application and reaches out."],
                      ["Join the Team", "Once selected, join the team and start working."],
                    ].map(([title, desc], i) => (
                      <div key={title} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8effe] text-[11px] font-bold text-[#2563eb]">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[12.5px] font-bold text-[#0f172a]">{title}</p>
                          <p className="text-[11.5px] text-[#64748b]">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[12px] font-medium text-[#0f172a]">Your skills can build a great startup! 💡</p>
                </div>
              </>
            ) : tab === "product" ? (
              <>
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Investment Summary</h4>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <FundStat icon={Briefcase} color="#2563eb" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#16a34a" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#2563eb" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#2563eb"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                {startup.whyProduct.length > 0 && (
                  <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                    <h4 className="text-[14px] font-bold text-[#0f172a]">Why Our Product?</h4>
                    <ul className="mt-3 space-y-2.5">
                      {startup.whyProduct.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb]">
                    <Truck className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 text-[15px] font-bold text-[#0f172a]">Want to Distribute Our Products?</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">
                    Partner with us to distribute our products in your region.
                  </p>
                  <button
                    onClick={handleMessageFounder}
                    disabled={!user || messageFounderMutation.isPending}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
                  >
                    <Truck className="h-4 w-4" /> Become Distributor
                  </button>
                </div>

                {(!!startup.pitchDeckUrl || !!startup.documents?.length) && (
                  <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                    <h4 className="text-[14px] font-bold text-[#0f172a]">Documents</h4>
                    <div className="mt-2 divide-y divide-[#f1f5f9]">
                      {startup.pitchDeckUrl && <DocRow name="Pitch Deck" url={startup.pitchDeckUrl} />}
                      {startup.documents?.map((d, i) => <DocRow key={i} name={d.name} url={d.url} />)}
                    </div>
                  </div>
                )}
              </>
            ) : tab === "documents" ? (
              <>
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Investment Summary</h4>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <FundStat icon={Briefcase} color="#2563eb" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#16a34a" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#2563eb" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Total Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#2563eb"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Document Highlights</h4>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      "All documents are verified and authentic",
                      "Regularly updated for transparency",
                      "Helps investors understand the startup better",
                      "Secure and easy access to important files",
                    ].map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Need More Information?</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">Can&apos;t find what you are looking for?</p>
                  <button
                    onClick={handleMessageFounder}
                    disabled={!user || messageFounderMutation.isPending}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
                  >
                    <FilePlus2 className="h-4 w-4" /> Request Document
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-[#e8effe] to-[#f1ebfc] p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2563eb]">
                    <FolderCheck className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 text-[14px] font-bold text-[#0f172a]">Transparency builds trust</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#374151]">
                    We believe in complete transparency with our investors and community.
                  </p>
                </div>
              </>
            ) : tab === "updates" ? (
              <>
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Investment Summary</h4>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <FundStat icon={Briefcase} color="#2563eb" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#16a34a" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#2563eb" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Total Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#2563eb"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Why Regular Updates?</h4>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      "Builds transparency and trust",
                      "Shows real progress to investors",
                      "Helps attract partners and supporters",
                      "Keeps the community engaged",
                    ].map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-[#0f172a]">Recent Updates</h4>
                  </div>
                  {!updatesList?.length ? (
                    <EmptyNote text="No updates posted yet." />
                  ) : (
                    <div className="mt-3 space-y-3">
                      {updatesList.slice(0, 4).map((u) => {
                        const meta = UPDATE_CATEGORY_META[u.category] ?? UPDATE_CATEGORY_META.Other;
                        const Icon = meta.icon;
                        return (
                          <div key={u._id} className="flex items-start gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-[12px] font-semibold text-[#0f172a]">{u.title}</p>
                              <p className="text-[10.5px] text-[#94a3b8]">{new Date(u.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : tab === "discussions" ? (
              <>
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Investment Summary</h4>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <FundStat icon={Briefcase} color="#2563eb" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#16a34a" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#2563eb" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Total Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#2563eb"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb]">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 text-[15px] font-bold text-[#0f172a]">Start a Discussion</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">
                    Have a question or suggestion? Start a discussion with the community.
                  </p>
                  <button
                    onClick={() => (user ? setDiscussionComposerOpen(true) : navigate("/login"))}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" /> Start New Discussion
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Why Discussions Matter?</h4>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      "Get expert advice from community",
                      "Find potential partners & supporters",
                      "Improve your business with feedback",
                      "Build trust and transparency",
                      "Grow your network",
                    ].map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Recent Activity</h4>
                  {recentActivity.length === 0 ? (
                    <EmptyNote text="No activity yet." />
                  ) : (
                    <div className="mt-3 space-y-3">
                      {recentActivity.map((d) => (
                        <div key={d._id} className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={d.author.avatar} alt={d.author.name} />
                            <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[10px] font-bold text-white">
                              {initialsFromName(d.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="min-w-0 flex-1 truncate text-[11.5px] text-[#334155]">
                            <span className="font-semibold text-[#0f172a]">{d.author.name}</span> started a discussion
                          </p>
                          <span className="shrink-0 text-[10.5px] text-[#94a3b8]">{timeAgo(d.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : tab === "funding" || tab === "investments" ? (
              <>
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Quick Summary</h4>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <FundStat icon={Briefcase} color="#2563eb" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#16a34a" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#2563eb" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#2563eb"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                {startup.whyInvest.length > 0 && (
                  <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                    <h4 className="text-[14px] font-bold text-[#0f172a]">Why Invest In This Startup?</h4>
                    <ul className="mt-3 space-y-2.5">
                      {startup.whyInvest.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <h4 className="text-[14px] font-bold text-[#0f172a]">Become an Investor</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">Invest in this idea and be a part of the journey.</p>
                  <button
                    onClick={() => {
                      if (!user) return navigate("/login");
                      if (!isInterested) interestMutation.mutate();
                      setTab("investments");
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
                  >
                    <Wallet className="h-4 w-4" /> Invest
                  </button>
                  <button
                    onClick={handleMessageFounder}
                    disabled={!user || messageFounderMutation.isPending}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    <MessageSquare className="h-4 w-4" /> Message Founder
                  </button>
                </div>

                {isOwner && (
                  <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                    <h4 className="text-[14px] font-bold text-[#0f172a]">Recent Investors</h4>
                    <p className="mt-0.5 text-[10.5px] text-[#94a3b8]">Only visible to you as the founder.</p>
                    <div className="mt-3 space-y-3">
                      {investorPartners.length === 0 ? (
                        <EmptyNote text="None yet." />
                      ) : (
                        investorPartners.slice(0, 4).map((p) => (
                          <div key={p._id} className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={p.avatar} alt={p.name} />
                              <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[10px] font-bold text-white">
                                {initialsFromName(p.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12.5px] font-semibold text-[#0f172a]">{p.name}</p>
                              <p className="truncate text-[10.5px] capitalize text-[#64748b]">{p.role}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#e7f7ec] px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">Interested</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <h4 className="text-[14px] font-bold text-[#0f172a]">Funding &amp; Needs</h4>
              <p className="mt-3 text-[22px] font-extrabold text-[#0f172a]">{formatCurrency(startup.fundingRaised)}</p>
              <p className="text-[11.5px] text-[#64748b]">of {formatCurrency(startup.fundingNeeded)} Goal</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${fundingPct}%` }} />
              </div>
              <p className="mt-1.5 text-[11.5px] font-semibold text-[#2563eb]">{fundingPct}% Funded</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e2e8f0] p-3">
                  <Briefcase className="h-4 w-4 text-[#2563eb]" />
                  <p className="mt-1.5 text-[13px] font-bold">{formatCurrency(startup.fundingNeeded)}</p>
                  <p className="text-[10.5px] text-[#64748b]">Needed</p>
                </div>
                <div className="rounded-xl border border-[#e2e8f0] p-3">
                  <Users2 className="h-4 w-4 text-[#2563eb]" />
                  <p className="mt-1.5 text-[13px] font-bold">{confirmedInvestorCount}</p>
                  <p className="text-[10.5px] text-[#64748b]">Investors</p>
                </div>
              </div>

              <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                View Funding Details
              </button>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#0f172a]">Team (Looking For)</h4>
                <button onClick={() => setTab("team")} className="text-[11.5px] font-bold text-[#2563eb]">View All</button>
              </div>
              <div className="mt-3 space-y-3">
                {startup.openRoles.length === 0 ? (
                  <EmptyNote text="No open roles right now." />
                ) : (
                  startup.openRoles.slice(0, 5).map((role, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8]">
                        <Users2 className="h-4 w-4" />
                      </div>
                      <p className="flex-1 text-[12.5px] font-semibold text-[#0f172a]">{role.title}</p>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", role.type === "full_time" ? "bg-[#e8effe] text-[#2563eb]" : "bg-[#fdf1de] text-[#d97706]")}>
                        {role.type === "full_time" ? "Full Time" : "Part Time"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {isOwner && (
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <h4 className="text-[14px] font-bold text-[#0f172a]">Interested Investors / Partners</h4>
              <p className="mt-0.5 text-[10.5px] text-[#94a3b8]">Only visible to you as the founder.</p>
              <div className="mt-3 space-y-3">
                {investorPartners.length === 0 ? (
                  <EmptyNote text="None yet." />
                ) : (
                  investorPartners.map((p) => (
                    <div key={p._id} className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.avatar} alt={p.name} />
                        <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[10px] font-bold text-white">
                          {initialsFromName(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-[#0f172a]">{p.name}</p>
                        <p className="truncate text-[10.5px] capitalize text-[#64748b]">{p.role}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#e7f7ec] px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">Interested</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <h4 className="text-[14px] font-bold text-[#0f172a]">Let&apos;s Connect</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">Interested in this idea? Let&apos;s build something amazing together.</p>
              <button
                onClick={handleMessageFounder}
                disabled={!user || messageFounderMutation.isPending}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
              >
                {messageFounderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />} Send Message
              </button>
            </div>
              </>
            )}
          </aside>
        </div>
      </div>

      <JoinTeamModal
        startupId={id}
        role={joinModal.role}
        open={joinModal.open}
        onOpenChange={(open) => setJoinModal((s) => ({ ...s, open }))}
      />

      <RoleDetailsModal
        role={roleDetailsModal.role}
        open={roleDetailsModal.open}
        onOpenChange={(open) => setRoleDetailsModal((s) => ({ ...s, open }))}
        onJoin={() => {
          setJoinModal({ open: true, role: roleDetailsModal.role });
          setRoleDetailsModal({ open: false, role: null });
        }}
      />

      <ProductDetailModal product={productModal} onOpenChange={(open) => !open && setProductModal(null)} />
    </div>
  );
}

const PRODUCT_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  live: { label: "Live", bg: "#e7f7ec", fg: "#16a34a" },
  beta: { label: "Beta", bg: "#fdf1de", fg: "#d97706" },
  coming_soon: { label: "Coming Soon", bg: "#f1f5f9", fg: "#64748b" },
};

function productTags(p: StartupProduct): string[] {
  if (p.tags?.length) return p.tags;
  return p.tag ? [p.tag] : [];
}

function ProductCarousel({ products, onSelect }: { products: StartupProduct[]; onSelect: (p: StartupProduct) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {products.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="absolute -left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#0f172a] shadow-md hover:bg-[#f8fafc] sm:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#0f172a] shadow-md hover:bg-[#f8fafc] sm:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      <div ref={scrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1">
        {products.map((p, i) => {
          const cover = p.images?.[0] || p.image;
          const statusMeta = p.status ? PRODUCT_STATUS_META[p.status] : null;
          const tags = productTags(p);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(p)}
              className="w-44 shrink-0 snap-start overflow-hidden rounded-xl border border-[#e2e8f0] text-left transition-shadow hover:shadow-md sm:w-52"
            >
              <div className="relative">
                {cover ? (
                  <img src={cover} alt={p.name} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-[#e8effe] text-[#2563eb]">
                    <Package className="h-7 w-7" />
                  </div>
                )}
                {statusMeta && (
                  <span
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                    style={{ background: statusMeta.bg, color: statusMeta.fg }}
                  >
                    {statusMeta.label}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold">{p.name}</p>
                {p.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-[#64748b]">{p.description}</p>}
                {p.price && <p className="mt-1 text-[11.5px] font-bold text-[#2563eb]">{p.price}</p>}
                {tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tags.map((t, ti) => (
                      <span key={ti} className="inline-block rounded-full bg-[#e7f7ec] px-2 py-0.5 text-[9.5px] font-bold text-[#16a34a]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductDetailModal({ product, onOpenChange }: { product: StartupProduct | null; onOpenChange: (open: boolean) => void }) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [product]);

  const images = product ? (product.images?.length ? product.images : product.image ? [product.image] : []) : [];

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
            </DialogHeader>

            {images.length > 0 ? (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl bg-[#f1f5f9]">
                  <img src={images[activeImage]} alt={product.name} className="h-64 w-full object-cover" />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={cn(
                          "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                          activeImage === i ? "border-[#2563eb]" : "border-transparent"
                        )}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl bg-[#e8effe] text-[#2563eb]">
                <Package className="h-8 w-8" />
              </div>
            )}

            <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {product.status && PRODUCT_STATUS_META[product.status] && (
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: PRODUCT_STATUS_META[product.status].bg, color: PRODUCT_STATUS_META[product.status].fg }}
                >
                  {PRODUCT_STATUS_META[product.status].label}
                </span>
              )}
              {productTags(product).map((t, i) => (
                <span key={i} className="rounded-full bg-[#e7f7ec] px-2.5 py-1 text-[11px] font-bold text-[#16a34a]">
                  {t}
                </span>
              ))}
              {product.price && <span className="rounded-full bg-[#e8effe] px-2.5 py-1 text-[11px] font-bold text-[#2563eb]">{product.price}</span>}
            </div>

            {product.description && <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#374151]">{product.description}</p>}

            {(product.features?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-[12px] font-bold text-[#0f172a]">Key Features</p>
                <ul className="space-y-1.5">
                  {product.features!.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#334155]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16a34a]" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12.5px] font-bold text-white hover:opacity-90"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Visit Product
              </a>
            )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({
  title,
  titleColor,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  titleColor?: string;
  icon?: typeof XCircle;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold" style={titleColor ? { color: titleColor } : undefined}>
        {Icon && <Icon className="h-4 w-4" style={{ color: iconColor }} />} {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-[12.5px] text-[#94a3b8]">{text}</p>;
}

function DocRow({ name, url }: { name: string; url: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#2563eb]">
        <FileText className="h-4 w-4" />
      </span>
      <p className="flex-1 truncate text-[13px] font-semibold text-[#0f172a]">{name}</p>
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
        <Download className="h-3.5 w-3.5" /> View
      </a>
    </div>
  );
}

const INVESTMENT_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pending Confirmation", bg: "#fdf1de", fg: "#d97706" },
  confirmed: { label: "Confirmed", bg: "#e7f7ec", fg: "#16a34a" },
  declined: { label: "Declined", bg: "#fce8e8", fg: "#dc2626" },
};

const NEW_INVESTOR_WINDOW_DAYS = 7;
const VERIFICATION_FEE_INR = 199;

function isRecentAccount(createdAt: string) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs < NEW_INVESTOR_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function InvestmentsSection({
  startupId,
  isOwner,
  canReport,
  onMessageFounder,
  isStartupVerified,
  isFounderVerified,
}: {
  startupId: string;
  isOwner: boolean;
  canReport: boolean;
  onMessageFounder: () => void;
  isStartupVerified: boolean;
  isFounderVerified: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isPaySubmitting, setIsPaySubmitting] = useState(false);

  const { data: investments, isLoading } = useQuery({
    queryKey: ["startups", startupId, "investments"],
    queryFn: () => investmentApi.list(startupId),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () => investmentApi.create(startupId, { amount: Number(amount), note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
      setAmount("");
      setNote("");
      setShowForm(false);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(isAxiosError(err) ? err.response?.data?.message || "Could not submit your report." : "Could not submit your report.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ investmentId, status }: { investmentId: string; status: "confirmed" | "declined" }) =>
      investmentApi.updateStatus(investmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
      queryClient.invalidateQueries({ queryKey: ["startups", startupId] });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: () => authApi.resendVerification(),
  });

  const handleVerify = async (investmentId: string) => {
    if (!user) return;
    setVerifyError(null);
    setVerifyingId(investmentId);
    try {
      await loadRazorpayScript();
      const order = await investmentApi.createVerificationOrder(investmentId);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MahaHub",
        description: "Investment report verification fee",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await investmentApi.confirmVerificationPayment(investmentId, response);
          queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
          setVerifyingId(null);
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => setVerifyingId(null) },
      });
      razorpay.open();
    } catch (err) {
      setVerifyError(isAxiosError(err) ? err.response?.data?.message || "Verification payment failed." : "Payment gateway unavailable.");
      setVerifyingId(null);
    }
  };

  const handlePayAndSubmit = async () => {
    if (!user || !(Number(amount) > 0)) return;
    setFormError(null);
    setIsPaySubmitting(true);
    try {
      await loadRazorpayScript();
      const order = await investmentApi.createPreVerificationOrder(startupId, Number(amount));

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MahaHub",
        description: "Investment report + verification fee",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await investmentApi.createVerified(startupId, { amount: Number(amount), note: note || undefined, ...response });
            queryClient.invalidateQueries({ queryKey: ["startups", startupId, "investments"] });
            setAmount("");
            setNote("");
            setShowForm(false);
          } catch (err) {
            setFormError(
              isAxiosError(err)
                ? err.response?.data?.message ||
                    "Payment succeeded but we couldn't save your report — please contact support with your payment reference."
                : "Payment succeeded but we couldn't save your report — please contact support with your payment reference."
            );
          } finally {
            setIsPaySubmitting(false);
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => setIsPaySubmitting(false) },
      });
      razorpay.open();
    } catch (err) {
      setFormError(isAxiosError(err) ? err.response?.data?.message || "Payment failed." : "Payment gateway unavailable.");
      setIsPaySubmitting(false);
    }
  };

  const myInvestment = investments?.find((inv) => inv.investor._id === user?.id);

  if (!user) return null;

  return (
    <SectionCard title="Investment Records" icon={Wallet} iconColor="#2563eb">
      <p className="mb-3 text-[11px] text-[#94a3b8]">
        Self-reported by investors — MahaHub does not process or verify the investment itself. Founders should confirm only after receiving
        funds through their own banking/legal process.
      </p>

      {isOwner ? (
        isLoading ? (
          <EmptyNote text="Loading investment records..." />
        ) : !investments?.length ? (
          <EmptyNote text="No investments reported yet." />
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {investments.map((inv) => {
              const meta = INVESTMENT_STATUS_META[inv.status];
              return (
                <div key={inv._id} className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-xs font-bold text-white">
                    {inv.investor.avatar ? <img src={inv.investor.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : initialsFromName(inv.investor.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[13px] font-bold">{inv.investor.name}</p>
                      {inv.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-[#e8effe] px-2 py-0.5 text-[10px] font-bold text-[#2563eb]">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {isRecentAccount(inv.investor.createdAt) && (
                        <span className="rounded-full bg-[#fce8e8] px-2 py-0.5 text-[10px] font-bold text-[#dc2626]">New Investor</span>
                      )}
                      {inv.refunded && (
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">Verification Fee Refunded</span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#64748b]">
                      {formatCurrency(inv.amount)} · {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                    {inv.note && <p className="mt-0.5 text-[11px] text-[#94a3b8]">{inv.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                      {meta.label}
                    </span>
                    {inv.status === "pending" && (
                      <>
                        <button
                          onClick={() => statusMutation.mutate({ investmentId: inv._id, status: "confirmed" })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg border border-[#16a34a] px-2.5 py-1 text-[11px] font-bold text-[#16a34a] hover:bg-[#e7f7ec]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ investmentId: inv._id, status: "declined" })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg border border-[#e2e8f0] px-2.5 py-1 text-[11px] font-bold text-[#64748b] hover:bg-[#f8fafc]"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : myInvestment && !(myInvestment.status === "declined" && showForm) ? (
        <div className="space-y-2 rounded-lg border border-[#e2e8f0] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold">
                You reported {formatCurrency(myInvestment.amount)}
                {myInvestment.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-[#e8effe] px-2 py-0.5 text-[10px] font-bold text-[#2563eb]">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </p>
              <p className="text-[11px] text-[#94a3b8]">{new Date(myInvestment.createdAt).toLocaleDateString()}</p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
              style={{ background: INVESTMENT_STATUS_META[myInvestment.status].bg, color: INVESTMENT_STATUS_META[myInvestment.status].fg }}
            >
              {INVESTMENT_STATUS_META[myInvestment.status].label}
            </span>
          </div>
          {myInvestment.refunded ? (
            <p className="border-t border-[#f1f5f9] pt-2 text-[11px] text-[#94a3b8]">
              The founder didn&apos;t respond within 15 days, so ₹{myInvestment.refundAmount} of your verification fee was auto-refunded on{" "}
              {myInvestment.refundedAt && new Date(myInvestment.refundedAt).toLocaleDateString()}.
            </p>
          ) : (
            !myInvestment.verified &&
            myInvestment.status !== "declined" && (
              <div className="border-t border-[#f1f5f9] pt-2">
                <button
                  onClick={() => handleVerify(myInvestment._id)}
                  disabled={verifyingId === myInvestment._id}
                  className="flex items-center gap-1.5 rounded-lg border border-[#2563eb] px-3 py-1.5 text-[11.5px] font-bold text-[#2563eb] hover:bg-[#e8effe] disabled:opacity-50"
                >
                  {verifyingId === myInvestment._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Get Verified (₹{VERIFICATION_FEE_INR})
                </button>
                <p className="mt-1 text-[10.5px] text-[#94a3b8]">
                  Optional. Adds a Verified badge to your report. If the founder doesn&apos;t respond within 15 days, 94% of this fee (₹187) is
                  automatically refunded.
                </p>
                {verifyError && <p className="mt-1 text-[10.5px] text-danger">{verifyError}</p>}
              </div>
            )
          )}
          {myInvestment.status === "declined" && canReport && (
            <div className="border-t border-[#f1f5f9] pt-2">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#2563eb] px-3 py-1.5 text-[11.5px] font-bold text-[#2563eb] hover:bg-[#e8effe]"
              >
                <Wallet className="h-3.5 w-3.5" /> Report a New Investment
              </button>
            </div>
          )}
        </div>
      ) : canReport ? (
        <>
          {!isStartupVerified && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#fce8e8] bg-[#fef7f7] p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]" />
              <p className="text-[11.5px] text-[#dc2626]">
                {isFounderVerified
                  ? "MahaHub has confirmed the founder's identity, but not the business registration or funding claims. Do your own due diligence before sending any money."
                  : "MahaHub has not independently verified this startup, its founder, or its funding claims. Do your own due diligence — confirm the founder's identity and business before sending any money."}
              </p>
            </div>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={onMessageFounder} className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
              <MessageSquare className="h-3.5 w-3.5" /> Message Founder First
            </button>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12px] font-bold text-white hover:opacity-90">
                <Wallet className="h-3.5 w-3.5" /> I&apos;ve Invested
              </button>
            )}
          </div>
          <p className="mb-3 text-[10.5px] text-[#94a3b8]">Discuss the details with the founder first, and only report an investment once you&apos;ve actually sent the funds.</p>

          {showForm && (
            <div className="space-y-2 rounded-xl border border-[#e2e8f0] p-4">
              <Input type="number" min={1} placeholder="Amount invested (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Textarea placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
              <p className="text-[10.5px] text-[#94a3b8]">
                By submitting, you confirm you have actually sent this amount to the founder outside MahaHub. This is not a verified transaction.
              </p>
              {formError && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-danger">{formError}</p>
                  {formError.toLowerCase().includes("verify your email") && (
                    <button
                      type="button"
                      onClick={() => resendVerificationMutation.mutate()}
                      disabled={resendVerificationMutation.isPending || resendVerificationMutation.isSuccess}
                      className="text-[11px] font-bold text-[#2563eb] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resendVerificationMutation.isSuccess
                        ? "Verification email sent — check your inbox"
                        : resendVerificationMutation.isPending
                          ? "Sending..."
                          : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePayAndSubmit}
                  disabled={!(Number(amount) > 0) || isPaySubmitting || createMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12px] font-bold text-white disabled:opacity-50"
                >
                  {isPaySubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Pay ₹{VERIFICATION_FEE_INR} &amp; Submit as Verified
                </button>
                <button
                  onClick={() => Number(amount) > 0 && createMutation.mutate()}
                  disabled={!(Number(amount) > 0) || createMutation.isPending || isPaySubmitting}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Submit without Paying
                </button>
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12px] font-bold text-[#0f172a]">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </SectionCard>
  );
}

function UpdatesTab({ startupId, isFounder, canPost }: { startupId: string; isFounder: boolean; canPost: boolean }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof UPDATE_CATEGORIES)[number]>("Announcement");
  const [filter, setFilter] = useState<string>("All Updates");
  const [showAll, setShowAll] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const { data: updates, isLoading } = useQuery({ queryKey: ["startups", startupId, "updates"], queryFn: () => startupUpdateApi.list(startupId) });

  const mutation = useMutation({
    mutationFn: () => startupUpdateApi.create(startupId, { title, description, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "updates"] });
      setTitle("");
      setDescription("");
      setShowForm(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: (updateId: string) => startupUpdateApi.toggleLike(updateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups", startupId, "updates"] }),
  });

  const counts = UPDATE_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (updates ?? []).filter((u) => u.category === c).length;
    return acc;
  }, {});

  const filtered = (updates ?? []).filter((u) => filter === "All Updates" || u.category === filter);
  const visible = showAll ? filtered : filtered.slice(0, 4);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-extrabold text-[#0f172a]">Updates</h3>
          <p className="mt-1 text-[12.5px] text-[#64748b]">Stay updated with the latest progress, milestones and activities.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select value={filter} onValueChange={(v) => { setFilter(v); setShowAll(false); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All Updates">All Updates</SelectItem>
              {UPDATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}s</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFounder && (
            <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-[12.5px] font-bold text-white hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Add New Update
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mt-4 space-y-2 rounded-xl border border-[#e2e8f0] p-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Update title" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" className="min-h-[70px]" />
          <Select value={category} onValueChange={(v) => setCategory(v as (typeof UPDATE_CATEGORIES)[number])}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UPDATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => title.trim() && mutation.mutate()} disabled={!title.trim() || mutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12px] font-bold text-white">
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Post Update
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <EmptyNote text="Loading updates..." />
          ) : !filtered.length ? (
            <EmptyNote text="No updates posted yet." />
          ) : (
            <>
              <div className="space-y-4">
                {visible.map((u) => {
                  const meta = UPDATE_CATEGORY_META[u.category] ?? UPDATE_CATEGORY_META.Other;
                  const Icon = meta.icon;
                  return (
                    <div key={u._id} className="flex gap-3 rounded-xl border border-[#e2e8f0] p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                            {u.category}
                          </span>
                          <span className="text-[11px] text-[#94a3b8]">{new Date(u.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}</span>
                        </div>
                        <p className="mt-1.5 text-[14px] font-bold text-[#0f172a]">{u.title}</p>
                        {u.description && <p className="mt-1 text-[12.5px] text-[#64748b]">{u.description}</p>}
                        <div className="mt-2.5 flex items-center gap-4 text-[11.5px] text-[#64748b]">
                          <button
                            onClick={() => canPost && likeMutation.mutate(u._id)}
                            disabled={!canPost}
                            className="flex items-center gap-1 hover:text-[#2563eb] disabled:cursor-default disabled:hover:text-[#64748b]"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" /> {u.likes.length}
                          </button>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {u.commentCount}</span>
                        </div>
                      </div>
                      {u.image && (
                        <img src={u.image} alt="" className="hidden h-20 w-24 shrink-0 rounded-lg object-cover sm:block" />
                      )}
                    </div>
                  );
                })}
              </div>
              {filtered.length > 4 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-4 w-full rounded-lg border border-[#e2e8f0] py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  {showAll ? "Show Fewer Updates" : "Load More Updates"}
                </button>
              )}
            </>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-[#e2e8f0] p-4">
            <h4 className="text-[13.5px] font-bold text-[#0f172a]">Update Categories</h4>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => { setFilter("All Updates"); setShowAll(false); }}
                className={cn("flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] font-semibold", filter === "All Updates" ? "bg-[#e8effe] text-[#2563eb]" : "text-[#334155] hover:bg-[#f8fafc]")}
              >
                All Updates <span className="text-[11px] font-bold">{(updates ?? []).length}</span>
              </button>
              {UPDATE_CATEGORIES.map((c) => {
                const meta = UPDATE_CATEGORY_META[c];
                const Icon = meta.icon;
                return (
                  <button
                    key={c}
                    onClick={() => { setFilter(c); setShowAll(false); }}
                    className={cn("flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] font-semibold", filter === c ? "bg-[#e8effe] text-[#2563eb]" : "text-[#334155] hover:bg-[#f8fafc]")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                        <Icon className="h-3 w-3" />
                      </span>
                      {c}s
                    </span>
                    <span className="text-[11px] font-bold">{counts[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] p-4">
            <h4 className="text-[13.5px] font-bold text-[#0f172a]">Subscribe for Updates</h4>
            <p className="mt-1.5 text-[11.5px] text-[#64748b]">Get notified about the latest updates from this startup.</p>
            {subscribed ? (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#16a34a]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Thanks, we&apos;ll keep you posted!
              </p>
            ) : (
              <>
                <Input
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  className="mt-3"
                />
                <button
                  onClick={() => subscribeEmail.trim() && setSubscribed(true)}
                  disabled={!subscribeEmail.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] py-2 text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" /> Subscribe
                </button>
                <p className="mt-2 text-[10.5px] text-[#94a3b8]">No spam. Unsubscribe anytime.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationPanel({
  startupId,
  founderVerified,
  isVerified,
  verificationRequests,
}: {
  startupId: string;
  founderVerified: boolean;
  isVerified: boolean;
  verificationRequests: VerificationRequest[];
}) {
  const queryClient = useQueryClient();
  const [openType, setOpenType] = useState<VerificationRequestType | null>(null);
  const [pendingDocs, setPendingDocs] = useState<{ name: string; url: string }[]>([]);
  const [note, setNote] = useState("");

  const submitMutation = useMutation({
    mutationFn: (type: VerificationRequestType) =>
      startupApi.submitVerificationRequest(startupId, { type, documents: pendingDocs, note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId] });
      setOpenType(null);
      setPendingDocs([]);
      setNote("");
    },
  });

  const latestRequest = (type: VerificationRequestType) =>
    [...verificationRequests]
      .filter((r) => r.type === type)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  const renderSection = (type: VerificationRequestType, label: string, verified: boolean) => {
    const request = latestRequest(type);

    return (
      <div className="flex-1 rounded-xl border border-[#e2e8f0] p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn("h-4.5 w-4.5", verified ? "text-success" : "text-[#94a3b8]")} />
          <p className="text-[13px] font-bold text-[#0f172a]">{label}</p>
        </div>

        {verified ? (
          <p className="mt-2 text-[11.5px] font-medium text-success">Verified by MahaHub.</p>
        ) : request?.status === "pending" ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#94a3b8]">
            <Clock className="h-3.5 w-3.5" /> Submitted {new Date(request.submittedAt).toLocaleDateString()} — awaiting review.
          </p>
        ) : openType === type ? (
          <div className="mt-3 space-y-2.5">
            <FileUpload
              folder="document"
              label="Upload ID proof / registration document"
              onUploaded={(url, name) => setPendingDocs((prev) => [...prev, { name, url }])}
            />
            {pendingDocs.length > 0 && (
              <div className="space-y-1">
                {pendingDocs.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-[#f8fafc] px-2.5 py-1.5 text-[11.5px]">
                    <span className="truncate">{d.name}</span>
                    <button onClick={() => setPendingDocs((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5 text-[#94a3b8]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the reviewer" className="text-[12px]" />
            <div className="flex gap-2">
              <button
                onClick={() => submitMutation.mutate(type)}
                disabled={pendingDocs.length === 0 || submitMutation.isPending}
                className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
              </button>
              <button
                onClick={() => {
                  setOpenType(null);
                  setPendingDocs([]);
                }}
                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[11.5px] font-bold text-[#0f172a]"
              >
                Cancel
              </button>
            </div>
            {submitMutation.isError && (
              <p className="text-[11px] text-danger">
                {isAxiosError(submitMutation.error) ? submitMutation.error.response?.data?.message || "Submission failed." : "Submission failed."}
              </p>
            )}
          </div>
        ) : (
          <>
            {request?.status === "rejected" && (
              <p className="mt-2 text-[11.5px] text-danger">
                Rejected{request.reviewNote ? `: ${request.reviewNote}` : "."} You can submit a new request.
              </p>
            )}
            <button
              onClick={() => setOpenType(type)}
              className="mt-2 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[11.5px] font-bold text-[#2563eb] hover:bg-[#f8fafc]"
            >
              Request {label}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="mb-5 rounded-2xl border border-[#e2e8f0] bg-white p-5">
      <p className="mb-1 text-[14px] font-bold text-[#0f172a]">Verification</p>
      <p className="mb-3 text-[11.5px] text-[#64748b]">
        Submit ID proof or a business registration document — MahaHub's team reviews it manually before granting a verified badge.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {renderSection("founder", "Founder Verification", founderVerified)}
        {renderSection("business", "Business Verification", isVerified)}
      </div>
    </div>
  );
}

function DocumentsTab({ documents, pitchDeckUrl }: { documents: StartupDocument[]; pitchDeckUrl?: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All Documents");
  const [showAll, setShowAll] = useState(false);

  const allDocs: StartupDocument[] = [
    ...(pitchDeckUrl && !documents.some((d) => d.category === "Pitch Deck")
      ? [{ name: "Pitch Deck", url: pitchDeckUrl, category: "Pitch Deck" as const }]
      : []),
    ...documents,
  ];

  const filtered = allDocs.filter((d) => {
    const matchesCategory = category === "All Documents" || d.category === category;
    const matchesSearch = !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase()) || d.description?.toLowerCase().includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const visible = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-extrabold text-[#0f172a]">Documents</h3>
          <p className="mt-1 text-[12.5px] text-[#64748b]">Important documents and files related to this startup.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="w-56 pl-9" />
          </div>
          <button
            onClick={() => {
              setSearch("");
              setCategory("All Documents");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
          >
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setCategory("All Documents"); setShowAll(false); }}
          className={cn("rounded-full px-3 py-1.5 text-[11.5px] font-semibold", category === "All Documents" ? "bg-[#e8effe] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f8fafc]")}
        >
          All Documents
        </button>
        {DOCUMENT_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => { setCategory(c); setShowAll(false); }}
            className={cn("rounded-full px-3 py-1.5 text-[11.5px] font-semibold", category === c ? "bg-[#e8effe] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f8fafc]")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#e2e8f0]">
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyNote text="No documents match your search." /></div>
        ) : (
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#94a3b8]">
                <th className="px-4 py-3 font-semibold">Document Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Uploaded On</th>
                <th className="px-4 py-3 font-semibold">File Size</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d, i) => {
                const fi = fileIconFor(d.url);
                const FileIcon = fi.icon;
                return (
                  <tr key={i} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: fi.bg, color: fi.fg }}>
                          <FileIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0f172a]">{d.name}</p>
                          {d.description && <p className="text-[11px] text-[#94a3b8]">{d.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{d.category}</td>
                    <td className="px-4 py-3 text-[#64748b]">{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="px-4 py-3 text-[#64748b]">{d.fileSize || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
                          <Eye className="h-3.5 w-3.5" /> View
                        </a>
                        <a href={d.url} download target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 8 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 w-full rounded-lg border border-[#e2e8f0] py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
        >
          {showAll ? "Show Fewer Documents" : "Load More Documents"}
        </button>
      )}
    </div>
  );
}

function DiscussionsTab({
  startupId,
  canPost,
  open,
  onOpenChange,
}: {
  startupId: string;
  canPost: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<(typeof DISCUSSION_CATEGORIES)[number]>("All Discussions");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postCategory, setPostCategory] = useState<Discussion["category"]>("General");
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [reportOpenId, setReportOpenId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const { data: discussions, isLoading } = useQuery({
    queryKey: ["startups", startupId, "discussions", category],
    queryFn: () => discussionApi.list(startupId, category === "All Discussions" ? undefined : category),
  });

  const { data: allDiscussions } = useQuery({
    queryKey: ["startups", startupId, "discussions", "all"],
    queryFn: () => discussionApi.list(startupId),
  });

  const createMutation = useMutation({
    mutationFn: () => discussionApi.create(startupId, { title, body, category: postCategory }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "discussions"] });
      setTitle("");
      setBody("");
      onOpenChange(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: (discussionId: string) => discussionApi.toggleLike(discussionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups", startupId, "discussions"] }),
  });

  const reportMutation = useMutation({
    mutationFn: (discussionId: string) => discussionApi.report(discussionId, reportReason),
    onSuccess: (_data, discussionId) => {
      setReportedIds((prev) => new Set(prev).add(discussionId));
      setReportOpenId(null);
      setReportReason("");
    },
  });

  const filtered = (discussions ?? []).filter(
    (d) => !search.trim() || d.title.toLowerCase().includes(search.trim().toLowerCase()) || d.body.toLowerCase().includes(search.trim().toLowerCase())
  );
  const visible = showAll ? filtered : filtered.slice(0, 5);

  const popularDiscussions = [...(allDiscussions ?? [])]
    .sort((a, b) => b.likes.length + b.commentCount - (a.likes.length + a.commentCount))
    .slice(0, 5);

  return (
    <div>
      <h3 className="text-[19px] font-extrabold text-[#0f172a]">Discussions</h3>
      <p className="mt-1 text-[12.5px] text-[#64748b]">Ask questions, share ideas and get suggestions from the community.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discussions..." className="pl-9" />
        </div>
        {canPost && (
          <button
            onClick={() => onOpenChange(!open)}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-[12.5px] font-bold text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Start Discussion
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-2 rounded-xl border border-[#e2e8f0] p-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Discussion title" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ask a question, share feedback, or propose a partnership..." className="min-h-[80px]" />
          <Select value={postCategory} onValueChange={(v) => setPostCategory(v as Discussion["category"])}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POST_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => title.trim() && body.trim() && createMutation.mutate()} disabled={!title.trim() || !body.trim() || createMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-[12px] font-bold text-white">
            {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Post
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {DISCUSSION_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setShowAll(false);
              }}
              className={cn("rounded-full px-3 py-1.5 text-[11.5px] font-semibold", category === c ? "bg-[#e8effe] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f8fafc]")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <EmptyNote text="Loading discussions..." />
          ) : !filtered.length ? (
            <EmptyNote text="No discussions yet. Be the first to start one." />
          ) : (
            <>
              <div className="divide-y divide-[#f1f5f9]">
                {visible.map((d) => {
                  const meta = CATEGORY_META[d.category];
                  const Icon = meta.icon;
                  return (
                    <div key={d._id} className="py-4 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-[13.5px] font-bold">{d.title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-[#94a3b8]">
                              Asked by {d.author.name} · {timeAgo(d.createdAt)}
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                                {d.category}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-[11.5px] text-[#64748b]">
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {d.commentCount} Replies</span>
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {d.viewCount} Views</span>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 pl-12 text-[12.5px] text-[#64748b]">{d.body}</p>
                      <div className="mt-2 flex items-center gap-4 pl-12">
                        <button onClick={() => likeMutation.mutate(d._id)} className="flex items-center gap-1 text-[11.5px] text-[#64748b] hover:text-[#2563eb]">
                          <ThumbsUp className="h-3.5 w-3.5" /> {d.likes.length}
                        </button>
                        <button
                          onClick={() => setOpenReplyId(openReplyId === d._id ? null : d._id)}
                          className="flex items-center gap-1 text-[11.5px] text-[#64748b] hover:text-[#2563eb]"
                        >
                          <Reply className="h-3.5 w-3.5" /> Reply
                        </button>
                        {canPost && (
                          <button
                            onClick={() => {
                              if (reportedIds.has(d._id)) return;
                              setReportOpenId(reportOpenId === d._id ? null : d._id);
                            }}
                            disabled={reportedIds.has(d._id)}
                            className={cn(
                              "flex items-center gap-1 text-[11.5px]",
                              reportedIds.has(d._id) ? "text-[#94a3b8]" : "text-[#64748b] hover:text-[#dc2626]"
                            )}
                          >
                            <Flag className="h-3.5 w-3.5" /> {reportedIds.has(d._id) ? "Reported" : "Report"}
                          </button>
                        )}
                      </div>

                      {reportOpenId === d._id && (
                        <div className="ml-12 mt-2.5 rounded-lg border border-[#fce8e8] bg-[#fef7f7] p-3">
                          <p className="text-[11.5px] font-semibold text-[#dc2626]">Why are you reporting this discussion?</p>
                          <Textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Optional details for the moderation team..."
                            className="mt-2 min-h-[56px] bg-white text-[12px]"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => reportMutation.mutate(d._id)}
                              disabled={reportMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 py-1.5 text-[11.5px] font-bold text-white hover:opacity-90"
                            >
                              {reportMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Submit Report
                            </button>
                            <button onClick={() => setReportOpenId(null)} className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[11.5px] font-bold text-[#0f172a] hover:bg-white">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {openReplyId === d._id && <DiscussionReplies discussionId={d._id} startupId={startupId} canPost={canPost} />}
                    </div>
                  );
                })}
              </div>
              {filtered.length > 5 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-4 w-full rounded-lg border border-[#e2e8f0] py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  {showAll ? "Show Fewer Discussions" : "Load More Discussions"}
                </button>
              )}
            </>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-[#e2e8f0] p-4">
            <h4 className="text-[13.5px] font-bold text-[#0f172a]">Popular Discussions</h4>
            {popularDiscussions.length === 0 ? (
              <EmptyNote text="No discussions yet." />
            ) : (
              <div className="mt-3 space-y-3">
                {popularDiscussions.map((d) => (
                  <div key={d._id} className="flex items-start gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={d.author.avatar} alt={d.author.name} />
                      <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[10px] font-bold text-white">
                        {initialsFromName(d.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[#0f172a]">{d.title}</p>
                      <p className="text-[10.5px] text-[#94a3b8]">{d.author.name} · {timeAgo(d.createdAt)}</p>
                    </div>
                    <span className="shrink-0 text-[10.5px] font-bold text-[#64748b]">{d.commentCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e2e8f0] p-4">
            <h4 className="text-[13.5px] font-bold text-[#0f172a]">Community Guidelines</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                [Heart, "Respect everyone in the community"],
                [Ban, "Avoid spam and self-promotion"],
                [Lightbulb, "Be helpful and add value"],
                [CheckCircle2, "Share accurate information"],
                [FileText, "Follow platform guidelines"],
              ].map(([Icon, text], i) => {
                const IconComp = Icon as typeof Heart;
                return (
                  <li key={i} className="flex items-start gap-2 text-[11.5px] text-[#334155]">
                    <IconComp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb]" /> {text as string}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscussionReplies({ discussionId, startupId, canPost }: { discussionId: string; startupId: string; canPost: boolean }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["discussions", discussionId, "comments"],
    queryFn: () => discussionApi.listComments(discussionId),
  });

  const mutation = useMutation({
    mutationFn: () => discussionApi.createComment(discussionId, body),
    onSuccess: (comment: DiscussionComment) => {
      queryClient.setQueryData<DiscussionComment[]>(["discussions", discussionId, "comments"], (prev) => [...(prev ?? []), comment]);
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "discussions"] });
      setBody("");
    },
  });

  return (
    <div className="ml-12 mt-3 space-y-3 border-l-2 border-[#e2e8f0] pl-4">
      {isLoading ? (
        <EmptyNote text="Loading replies..." />
      ) : !comments?.length ? (
        <EmptyNote text="No replies yet. Be the first to reply." />
      ) : (
        comments.map((c) => (
          <div key={c._id} className="flex items-start gap-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={c.author.avatar} alt={c.author.name} />
              <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[9.5px] font-bold text-white">
                {initialsFromName(c.author.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[11.5px] font-bold text-[#0f172a]">
                {c.author.name} <span className="ml-1 font-normal text-[#94a3b8]">· {timeAgo(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 text-[12px] text-[#374151]">{c.body}</p>
            </div>
          </div>
        ))
      )}

      {canPost && (
        <div className="flex items-center gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a reply..."
            className="h-8 text-[12px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && body.trim() && !mutation.isPending) mutation.mutate();
            }}
          />
          <button
            onClick={() => body.trim() && mutation.mutate()}
            disabled={!body.trim() || mutation.isPending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-white hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

const WORK_MODE_LABELS: Record<string, string> = { on_site: "On-site", remote: "Remote", hybrid: "Hybrid" };
const ROLE_AVATAR_COLORS = [
  { from: "#2563eb", to: "#1e3a8a" },
  { from: "#22c55e", to: "#166534" },
  { from: "#f97316", to: "#7c2d12" },
  { from: "#a855f7", to: "#581c87" },
];

function TeamTab({
  openRoles,
  team,
  onOpenModal,
  onViewDetails,
}: {
  openRoles: OpenRole[];
  team: TeamMember[];
  onOpenModal: (role: OpenRole | null) => void;
  onViewDetails: (role: OpenRole) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleRoles = showAll ? openRoles : openRoles.slice(0, 6);

  return (
    <div className="space-y-5">
      <SectionCard title="Team (Looking For)">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-md text-[12.5px] text-[#64748b]">
            We&apos;re looking for the right and dedicated people for these roles.
          </p>
          <button
            onClick={() => onOpenModal(null)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
          >
            <Plus className="h-3.5 w-3.5" /> Suggest a Member
          </button>
        </div>

        {openRoles.length === 0 ? (
          <EmptyNote text="No open roles right now." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleRoles.map((role, i) => {
                const color = ROLE_AVATAR_COLORS[i % ROLE_AVATAR_COLORS.length];
                return (
                  <div key={i} className="rounded-xl border border-[#e2e8f0] p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: `linear-gradient(155deg, ${color.from}, ${color.to})` }}
                      >
                        {initialsFromName(role.title)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold">{role.title}</p>
                        <p className="text-[11px] text-[#64748b]">
                          {role.type === "full_time" ? "Full Time" : "Part Time"} · {WORK_MODE_LABELS[role.workMode]}
                        </p>
                      </div>
                    </div>
                    {role.description && <p className="mt-2.5 text-[12px] leading-relaxed text-[#64748b]">{role.description}</p>}
                    {(role.requiredSkills?.length ?? 0) > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {role.requiredSkills!.map((skill) => (
                          <span key={skill} className="rounded-full bg-[#f1ebfc] px-2 py-0.5 text-[10.5px] font-semibold text-[#7c3aed]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(role)}
                        className="rounded-lg border border-[#e2e8f0] px-3.5 py-1.5 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onOpenModal(role)}
                        className="rounded-lg border border-[#2563eb] px-3.5 py-1.5 text-[12px] font-bold text-[#2563eb] hover:bg-[#e8effe]"
                      >
                        Join Team
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {openRoles.length > 6 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-4 w-full rounded-lg border border-[#e2e8f0] py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
              >
                {showAll ? "Show Fewer Roles" : "View All Roles"}
              </button>
            )}
          </>
        )}
      </SectionCard>

      {team.length > 0 && (
        <SectionCard title="Our Team">
          <div className="grid gap-4 sm:grid-cols-2">
            {team.map((member, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-sm font-semibold text-white">
                  {member.avatar ? <img src={member.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : member.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">{member.name}</p>
                  <p className="text-[11.5px] font-semibold text-[#2563eb]">{member.role}</p>
                  {member.joinedDate && (
                    <p className="mt-0.5 text-[10.5px] text-[#94a3b8]">
                      Joined {new Date(member.joinedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  )}
                  {member.bio && <p className="mt-1 text-[11.5px] text-[#64748b]">{member.bio}</p>}
                  {(member.skills?.length ?? 0) > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {member.skills!.map((skill) => (
                        <span key={skill} className="rounded-full bg-[#f1ebfc] px-2 py-0.5 text-[10px] font-semibold text-[#7c3aed]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[#2563eb]">
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

import { useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Flag,
  Twitter,
  Facebook,
  Instagram,
  FilePlus2,
  FolderCheck,
  ShieldCheck,
  Pencil,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { startupApi } from "@/api/startups";
import { startupUpdateApi } from "@/api/startupUpdates";
import { discussionApi } from "@/api/discussions";
import { chatApi } from "@/api/chat";
import { formatCurrency, formatCompactNumber, cn, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { JoinTeamModal } from "@/roles/founder/components/JoinTeamModal";
import { RoleDetailsModal } from "@/roles/founder/components/RoleDetailsModal";
import { SectionCard, EmptyNote, DocRow, UPDATE_CATEGORY_META, timeAgo, isRecentAccount } from "@/roles/founder/components/detail/shared";
import { ProductCarousel, ProductDetailModal } from "@/roles/founder/components/detail/ProductCarousel";
import { InvestmentsSection } from "@/roles/founder/components/detail/InvestmentsSection";
import { UpdatesTab } from "@/roles/founder/components/detail/UpdatesTab";
import { VerificationPanel } from "@/roles/founder/components/detail/VerificationPanel";
import { DocumentsTab } from "@/roles/founder/components/detail/DocumentsTab";
import { DiscussionsTab } from "@/roles/founder/components/detail/DiscussionsTab";
import { TeamTab } from "@/roles/founder/components/detail/TeamTab";
import type { InterestedUser, OpenRole, Startup, StartupProduct } from "@/types";

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage",
  pre_seed: "Pre-Seed",
  seed: "Seed Stage",
  series_a: "Series A",
  series_b: "Series B",
  growth: "Growth",
};

const TAG_COLORS = [
  { bg: "#ffece5", fg: "#FF5722" },
  { bg: "#f1ebfc", fg: "#7c3aed" },
  { bg: "#ffece5", fg: "#FF5722" },
  { bg: "#fdf1de", fg: "#d97706" },
];

const FUND_ITEM_COLORS = [
  { bg: "#ffece5", fg: "#FF5722" },
  { bg: "#ffece5", fg: "#FF5722" },
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

function MiniStat({ icon: Icon, value, label }: { icon: typeof Briefcase; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[11.5px] font-bold text-[#0f172a]">{value}</p>
        <p className="truncate text-[9px] uppercase tracking-wide text-[#94a3b8]">{label}</p>
      </div>
    </div>
  );
}

function daysLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

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

export default function StartupDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabValue>(
    TABS.some(([value]) => value === initialTab) ? (initialTab as TabValue) : "overview"
  );
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
            <div className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:flex-row">
              <div className="flex shrink-0 flex-col gap-2 sm:w-60">
                <div className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-[#16324a] via-[#2a6b56] to-[#7fae7a]">
                  {startup.coverImage && <img src={startup.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-[#FF5722] px-2.5 py-1 text-[10px] font-bold text-white">
                    {STAGE_LABELS[startup.stage]}
                  </span>
                  <button
                    onClick={() => user && followMutation.mutate()}
                    disabled={!user || followMutation.isPending}
                    className={cn(
                      "absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm",
                      isFollowing ? "bg-red-500/80 text-white" : "bg-black/50 text-white hover:bg-black/60"
                    )}
                  >
                    <Heart className={cn("h-3 w-3", isFollowing && "fill-white")} /> {isFollowing ? "Saved" : "Save"}
                  </button>
                </div>

                {(startup.website || Object.values(startup.socialLinks ?? {}).some(Boolean)) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {startup.website && (
                      <a
                        href={startup.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-[11px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                      >
                        <Globe className="h-3.5 w-3.5 text-[#FF5722]" /> Website
                      </a>
                    )}
                    <div className="flex items-center gap-1.5">
                      {startup.socialLinks?.linkedin && (
                        <a href={startup.socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722] hover:opacity-80">
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {startup.socialLinks?.twitter && (
                        <a href={startup.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722] hover:opacity-80">
                          <Twitter className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {startup.socialLinks?.facebook && (
                        <a href={startup.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722] hover:opacity-80">
                          <Facebook className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {startup.socialLinks?.instagram && (
                        <a href={startup.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722] hover:opacity-80">
                          <Instagram className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Compact stat strip — key numbers visible without switching tabs */}
                <div className="grid grid-cols-2 gap-1.5">
                  <MiniStat icon={PieChart} value={`${fundingPct}%`} label="Funded" />
                  <MiniStat icon={Users2} value={String(startup.followers.length)} label="Followers" />
                  <MiniStat icon={Eye} value={formatCompactNumber(startup.viewCount)} label="Views" />
                  <MiniStat
                    icon={CalendarDays}
                    value={new Date(startup.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                    label="Posted"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div>
                    <h1 className="flex flex-wrap items-center gap-2 text-[20px] font-extrabold leading-tight text-[#0f172a]">
                      {startup.name}
                      {startup.isVerified ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#ffece5] px-2 py-0.5 text-[10px] font-bold text-[#FF5722]">
                          <ShieldCheck className="h-3 w-3" /> MahaHub Verified
                        </span>
                      ) : startup.founderVerified ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#ffece5] px-2 py-0.5 text-[10px] font-bold text-[#FF5722]">
                          <ShieldCheck className="h-3 w-3" /> Founder Verified
                        </span>
                      ) : null}
                    </h1>
                    <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[#64748b]">
                      <MapPin className="h-3.5 w-3.5" /> {startup.location}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-start gap-1.5">
                    {isOwner && (
                      <Link
                        to={`/dashboard/founder/startup/${startup._id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-[#FF5722] px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
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
                          className="flex items-center gap-1.5 rounded-lg bg-[#FF5722] px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90"
                        >
                          <Wallet className="h-3.5 w-3.5" /> Invest
                        </button>
                        <button
                          onClick={() => {
                            if (!isInterested) user && interestMutation.mutate();
                            handleMessageFounder();
                          }}
                          disabled={!user || messageFounderMutation.isPending}
                          className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Message
                        </button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]">
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

                <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-[#374151]">{startup.tagline}</p>

                <div className="mt-2.5 flex items-center gap-2.5 border-t border-[#f1f5f9] pt-2.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={founder?.avatar} alt={founder?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-[10px] font-bold text-white">
                      {founder ? initialsFromName(founder.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {founder ? (
                      <Link to={`/founders/${founder._id}`} className="truncate text-[12px] font-bold text-[#0f172a] hover:underline">
                        {founder.name}
                      </Link>
                    ) : (
                      <p className="truncate text-[12px] font-bold text-[#0f172a]">Unknown</p>
                    )}
                    <p className="flex items-center gap-1.5 text-[10.5px] text-[#64748b]">
                      Founder
                      {founder?.createdAt && isRecentAccount(founder.createdAt) && (
                        <span className="rounded-full bg-[#fce8e8] px-1.5 py-0.5 text-[9px] font-bold text-[#dc2626]">New Founder Account</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[startup.industry, ...(startup.subIndustry ? [startup.subIndustry] : []), ...startup.fundingType].slice(0, 4).map((tag, i) => (
                    <span
                      key={tag + i}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                      style={{ background: TAG_COLORS[i % TAG_COLORS.length].bg, color: TAG_COLORS[i % TAG_COLORS.length].fg }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {reportOpen && (
                  <div className="mt-3 rounded-lg border border-[#fce8e8] bg-[#fef7f7] p-3">
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
                      tab === value ? "border-[#FF5722] text-[#FF5722]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
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
                              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
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
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5722]" /> {h}
                                </li>
                              ))}
                            </ul>
                          </SectionCard>
                        </div>
                      )}
                    </div>

                    {startup.missionStatement && (
                      <SectionCard title="Our Mission" icon={Lightbulb} iconColor="#FF5722">
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
                            <SectionCard title="Solution" titleColor="#FF5722" icon={CheckCircle2} iconColor="#FF5722">
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
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#FF5722]">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <div>
                                  <p className="text-[12.5px] font-bold text-[#FF5722]">{item.label}</p>
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
                                <Icon className="h-4 w-4 text-[#FF5722]" />
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
                                  <span className="mt-1.5 h-2 w-2 rounded-full bg-[#FF5722]" />
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
                            stroke="#FF5722"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 37}
                            strokeDashoffset={2 * Math.PI * 37 * (1 - fundingPct / 100)}
                            transform="rotate(-90 44 44)"
                          />
                          <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0f172a">{fundingPct}%</text>
                        </svg>
                        <div>
                          <p className="text-[20px] font-extrabold text-[#FF5722]">{formatCurrency(startup.fundingNeeded)}</p>
                          <p className="text-[11.5px] text-[#64748b]">Funding Goal</p>
                          <p className="mt-2 text-[17px] font-extrabold text-[#0f172a]">{formatCurrency(startup.fundingRaised)}</p>
                          <p className="text-[11.5px] text-[#64748b]">Raised Amount</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <FundStat icon={Briefcase} color="#FF5722" value={formatCurrency(startup.fundingNeeded)} label="Goal Amount" />
                        <FundStat icon={CheckCircle2} color="#FF5722" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
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
                                        <Icon className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" /> {o.label}
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
                              <button onClick={() => setTab("documents")} className="mt-2 text-[11.5px] font-bold text-[#FF5722]">
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
                            <span className="rounded-full bg-[#ffece5] px-2.5 py-1 text-[10.5px] font-bold text-[#FF5722]">Interested</span>
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
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF5722]" /> {h}
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
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ffece5] text-[#FF5722]">
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
                                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#FF5722]" /> {c}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {phase.estimatedCost > 0 && (
                                  <p className="mt-3 border-t border-[#f1f5f9] pt-2.5 text-[11.5px] font-bold text-[#FF5722]">
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
                                      <Icon className="h-4 w-4 text-[#FF5722]" />
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
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5722]" /> {c}
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
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722]">
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
                  className="flex items-center gap-1.5 rounded-lg bg-[#FF5722] px-4 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
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
            {interestMutation.isError && (
              <p className="text-[12.5px] text-danger">
                {isAxiosError(interestMutation.error) ? interestMutation.error.response?.data?.message : "Something went wrong."}
              </p>
            )}
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-5">
            {tab === "team" ? (
              <>
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722]">
                    <Users2 className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 text-[15px] font-bold text-[#0f172a]">Join the Team</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">
                    Like this idea? Use your skills to help build this startup — join the team.
                  </p>
                  <button
                    onClick={() => setJoinModal({ open: true, role: null })}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
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
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffece5] text-[11px] font-bold text-[#FF5722]">
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
                    <FundStat icon={Briefcase} color="#FF5722" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#FF5722" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#FF5722" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#FF5722"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                {startup.whyProduct.length > 0 && (
                  <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                    <h4 className="text-[14px] font-bold text-[#0f172a]">Why Our Product?</h4>
                    <ul className="mt-3 space-y-2.5">
                      {startup.whyProduct.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5722]" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722]">
                    <Truck className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 text-[15px] font-bold text-[#0f172a]">Want to Distribute Our Products?</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">
                    Partner with us to distribute our products in your region.
                  </p>
                  <button
                    onClick={handleMessageFounder}
                    disabled={!user || messageFounderMutation.isPending}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
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
                    <FundStat icon={Briefcase} color="#FF5722" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#FF5722" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#FF5722" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Total Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#FF5722"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
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
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5722]" /> {w}
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
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
                  >
                    <FilePlus2 className="h-4 w-4" /> Request Document
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-[#ffece5] to-[#f1ebfc] p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#FF5722]">
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
                    <FundStat icon={Briefcase} color="#FF5722" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#FF5722" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#FF5722" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Total Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#FF5722"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
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
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5722]" /> {w}
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
                    <FundStat icon={Briefcase} color="#FF5722" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#FF5722" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#FF5722" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Total Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#FF5722"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffece5] text-[#FF5722]">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 text-[15px] font-bold text-[#0f172a]">Start a Discussion</h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">
                    Have a question or suggestion? Start a discussion with the community.
                  </p>
                  <button
                    onClick={() => (user ? setDiscussionComposerOpen(true) : navigate("/login"))}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
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
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5722]" /> {w}
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
                    <FundStat icon={Briefcase} color="#FF5722" value={formatCurrency(startup.fundingNeeded)} label="Funding Goal" />
                    <FundStat icon={CheckCircle2} color="#FF5722" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
                    <FundStat icon={PieChart} color="#FF5722" value={`${fundingPct}%`} label="Percent Funded" />
                    <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining Amount" />
                    <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
                    <FundStat
                      icon={CalendarDays}
                      color="#FF5722"
                      value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)} Days` : "—"}
                      label="Days Left"
                    />
                  </div>
                  <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                    View Funding Details
                  </button>
                </div>

                {startup.whyInvest.length > 0 && (
                  <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                    <h4 className="text-[14px] font-bold text-[#0f172a]">Why Invest In This Startup?</h4>
                    <ul className="mt-3 space-y-2.5">
                      {startup.whyInvest.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5722]" /> {w}
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
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
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
                            <span className="shrink-0 rounded-full bg-[#ffece5] px-2 py-0.5 text-[10px] font-bold text-[#FF5722]">Interested</span>
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
                <div className="h-full rounded-full bg-[#FF5722]" style={{ width: `${fundingPct}%` }} />
              </div>
              <p className="mt-1.5 text-[11.5px] font-semibold text-[#FF5722]">{fundingPct}% Funded</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e2e8f0] p-3">
                  <Briefcase className="h-4 w-4 text-[#FF5722]" />
                  <p className="mt-1.5 text-[13px] font-bold">{formatCurrency(startup.fundingNeeded)}</p>
                  <p className="text-[10.5px] text-[#64748b]">Needed</p>
                </div>
                <div className="rounded-xl border border-[#e2e8f0] p-3">
                  <Users2 className="h-4 w-4 text-[#FF5722]" />
                  <p className="mt-1.5 text-[13px] font-bold">{confirmedInvestorCount}</p>
                  <p className="text-[10.5px] text-[#64748b]">Investors</p>
                </div>
              </div>

              <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                View Funding Details
              </button>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#0f172a]">Team (Looking For)</h4>
                <button onClick={() => setTab("team")} className="text-[11.5px] font-bold text-[#FF5722]">View All</button>
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
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", role.type === "full_time" ? "bg-[#ffece5] text-[#FF5722]" : "bg-[#fdf1de] text-[#d97706]")}>
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
                      <span className="shrink-0 rounded-full bg-[#ffece5] px-2 py-0.5 text-[10px] font-bold text-[#FF5722]">Interested</span>
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] py-2.5 text-[12.5px] font-bold text-white hover:opacity-90"
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

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
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { startupApi } from "@/api/startups";
import { usePageMeta } from "@/lib/usePageMeta";
import { startupUpdateApi } from "@/api/startupUpdates";
import { discussionApi } from "@/api/discussions";
import { chatApi } from "@/api/chat";
import { formatCurrency, formatCompactNumber, cn, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { JoinTeamModal } from "@/roles/founder/components/JoinTeamModal";
import { RoleDetailsModal } from "@/roles/founder/components/RoleDetailsModal";
import { DocRow, UPDATE_CATEGORY_META, timeAgo } from "@/roles/founder/components/detail/shared";
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
  { bg: "#F5F5F5", fg: "#171717" },
  { bg: "#f3edfb", fg: "#7c3aed" },
  { bg: "#F5F5F5", fg: "#171717" },
  { bg: "#fef6e8", fg: "#d97706" },
];

const FUND_ITEM_COLORS = [
  { bg: "#F5F5F5", fg: "#171717" },
  { bg: "#F5F5F5", fg: "#171717" },
  { bg: "#fef6e8", fg: "#d97706" },
  { bg: "#f3edfb", fg: "#7c3aed" },
  { bg: "#fce8e8", fg: "#dc2626" },
];

function FundStat({ icon: Icon, color, value, label }: { icon: typeof Briefcase; color: string; value: string; label: string }) {
  return (
    <div className="group rounded-xl bg-muted p-4 transition-all duration-300 hover:bg-accent">
      <Icon className="h-4 w-4" style={{ color }} />
      <p className="mt-2 text-[15px] font-semibold text-foreground">{value}</p>
      <p className="text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </>
  );
}

function daysLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const TABS = [
  ["overview", "Overview"],
  ["team", "Team"],
  ["funding", "Funding"],
  ["investments", "Investments"],
  ["product", "Product"],
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

  usePageMeta(startup ? startup.name : "Startup", startup ? startup.tagline || startup.description : undefined);

  const followMutation = useMutation({
    mutationFn: () => startupApi.toggleFollow(id),
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
      <div className="min-h-screen bg-muted">
        <div className="mx-auto max-w-[1600px] px-6 py-12">
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <Skeleton className="h-[600px] w-full rounded-3xl" />
              <Skeleton className="h-[600px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container py-32 text-center">
          <p className="text-lg font-semibold text-foreground">Startup not found</p>
          <Link 
            to="/startups" 
            className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
          >
            Back to Startups <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
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
  const confirmedInvestorCount = startup.confirmedInvestorCount ?? 0;
  const fundingPct = Math.min(100, Math.round((startup.fundingRaised / (startup.fundingNeeded || 1)) * 100));

  const recentActivity = [...(allDiscussions ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

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
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:py-12">
        {/* Back button - Apple style */}
        <Link 
          to="/startups" 
          className="group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Startups
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* MAIN COLUMN */}
          <div className="min-w-0 space-y-8">
            {/* Header Hero Card - Apple Style */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-sm">
              {/* Soft ambient glow — a single subtle accent, not the full multi-blob treatment */}

              <div className="relative px-6 py-5 sm:px-8 sm:py-6">
                {/* Verification badges + Save — badges left, Save right, at the top of the card */}
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-foreground">
                      {STAGE_LABELS[startup.stage]}
                    </span>

                    {startup.isVerified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1.5 text-xs font-medium text-green-700 border border-green-200/50">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}

                    {startup.founderVerified && !startup.isVerified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Founder Verified
                      </span>
                    )}
                  </div>

                  {/* Save button - Apple style */}
                  <button
                    onClick={() => user && followMutation.mutate()}
                    disabled={!user || followMutation.isPending}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300",
                      isFollowing
                        ? "bg-brand/10 text-brand border border-brand/30"
                        : "bg-muted text-foreground hover:bg-accent"
                    )}
                  >
                    <Heart className={cn("h-4 w-4 transition-all", isFollowing && "fill-brand text-brand")} />
                    {isFollowing ? "Saved" : "Save"}
                    <span className="ml-0.5 text-xs text-muted-foreground">{startup.followers.length}</span>
                  </button>
                </div>

                <div className="flex flex-col items-center text-center">
                  {/* Logo */}
                  <div className="relative mt-4">
                    <div className="relative h-20 w-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                      {startup.logo ? (
                        <img src={startup.logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-foreground">
                          {initialsFromName(startup.name)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name - Premium typography */}
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {startup.name}
                  </h1>

                  {/* Tagline - Subdued elegance */}
                  <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                    {startup.tagline}
                  </p>

                  {/* Location - Clean pill */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {startup.location}
                  </div>

                  {/* Tags - merged in with the identity block instead of its own separated section */}
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {[startup.industry, ...(startup.subIndustry ? [startup.subIndustry] : []), ...startup.fundingType].slice(0, 4).map((tag, i) => (
                      <span
                        key={tag + i}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{ background: TAG_COLORS[i % TAG_COLORS.length].bg, color: TAG_COLORS[i % TAG_COLORS.length].fg }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats Bar - Apple style with separators */}
                <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-4 sm:gap-8">
                  {[
                    { icon: Users2, value: String(startup.followers.length), label: "Followers" },
                    { icon: Eye, value: formatCompactNumber(startup.viewCount), label: "Views" },
                    { icon: CalendarDays, value: new Date(startup.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }), label: "Posted" },
                  ].map((stat, i, arr) => (
                    <div key={stat.label} className="flex items-center gap-4 sm:gap-8">
                      <div className="text-center">
                        <p className="text-base font-semibold text-foreground tracking-tight">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="h-6 w-px bg-muted" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Founder & Actions - Apple style row */}
                <div className="mt-4 flex flex-col items-center gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-white ring-offset-2">
                      <AvatarImage src={founder?.avatar} alt={founder?.name} />
                      <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                        {founder ? initialsFromName(founder.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {founder ? (
                        <Link to={`/founders/${founder._id}`} className="text-sm font-medium text-foreground hover:text-brand transition-colors">
                          {founder.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-foreground">Unknown</p>
                      )}
                      <p className="text-xs text-muted-foreground">Founder</p>
                    </div>

                    {(startup.website || Object.values(startup.socialLinks ?? {}).some(Boolean)) && (
                      <div className="ml-1 flex items-center gap-1 border-l border-border pl-3">
                        {startup.website && (
                          <a
                            href={startup.website}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Website"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {startup.socialLinks?.linkedin && (
                          <a href={startup.socialLinks.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <Linkedin className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {startup.socialLinks?.twitter && (
                          <a href={startup.socialLinks.twitter} target="_blank" rel="noreferrer" aria-label="Twitter" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <Twitter className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {startup.socialLinks?.facebook && (
                          <a href={startup.socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <Facebook className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {startup.socialLinks?.instagram && (
                          <a href={startup.socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <Instagram className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 col-span-2">
                    {isOwner ? (
                      <Link
                        to={`/dashboard/founder/startup/${startup._id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Startup
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (!user) return navigate("/login");
                            if (!isInterested) interestMutation.mutate();
                            setTab("investments");
                          }}
                          className="group relative inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors duration-300"
                        >
                          <Wallet className="h-4 w-4 transition-transform group-hover:scale-110" />
                          Invest
                          <span className="absolute inset-0 rounded-full bg-card/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        
                        <button
                          onClick={() => {
                            if (!isInterested) user && interestMutation.mutate();
                            handleMessageFounder();
                          }}
                          disabled={!user || messageFounderMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all duration-300"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </button>
                      </>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-border shadow-elevated p-1">
                        <DropdownMenuItem onClick={handleShare} className="rounded-xl text-sm gap-2 py-2.5 px-4">
                          <Share2 className="h-4 w-4" /> {copied ? "Copied!" : "Share"}
                        </DropdownMenuItem>
                        {user && !isOwner && (
                          <DropdownMenuItem onClick={() => setReportOpen((v) => !v)} className="rounded-xl text-sm gap-2 py-2.5 px-4 text-red-600 focus:text-red-600">
                            <Flag className="h-4 w-4" /> Report
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Report section - Clean design */}
                {reportOpen && (
                  <div className="mt-4 rounded-2xl bg-red-50/50 border border-red-200/50 p-4 text-left">
                    <p className="text-sm font-medium text-red-700">Why are you reporting this startup?</p>
                    <Textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="e.g. fake funding claims, misleading info, spam..."
                      className="mt-2 min-h-[60px] bg-card/80 text-sm border-border rounded-xl focus:border-red-300 focus:ring-red-200"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => reportMutation.mutate()}
                        disabled={reportMutation.isPending || reportMutation.isSuccess}
                        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {reportMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {reportMutation.isSuccess ? "Reported" : "Submit Report"}
                      </button>
                      <button 
                        onClick={() => setReportOpen(false)} 
                        className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs - Apple style with elegant underline */}
            <div className="rounded-3xl border border-border bg-card">
              <div className="flex gap-1 overflow-x-auto border-b border-border px-4 scrollbar-hide sm:justify-between">
                {TABS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={cn(
                      "relative whitespace-nowrap px-4 py-4 text-sm font-medium transition-all duration-300",
                      tab === value
                        ? "text-brand"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                    {tab === value && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8">
                {tab === "overview" && (
                  <OverviewContent 
                    startup={startup}
                    fundingPct={fundingPct}
                    confirmedInvestorCount={confirmedInvestorCount}
                    onMessageFounder={handleMessageFounder}
                    user={user}
                    isInterested={isInterested}
                    interestMutation={interestMutation}
                    setTab={setTab}
                  />
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
                  <FundingContent 
                    startup={startup}
                    fundingPct={fundingPct}
                    confirmedInvestorCount={confirmedInvestorCount}
                    isOwner={isOwner}
                    investorPartners={investorPartners}
                    setTab={setTab}
                  />
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
                  <div className="mt-8">
                    <InvestorsSection investorPartners={investorPartners} />
                  </div>
                )}

                {tab === "product" && (
                  <ProductContent 
                    startup={startup}
                    setProductModal={setProductModal}
                    setTab={setTab}
                  />
                )}

                {tab === "discussions" && (
                  <DiscussionsTab
                    startupId={id}
                    canPost={!!user}
                    open={discussionComposerOpen}
                    onOpenChange={setDiscussionComposerOpen}
                  />
                )}

                {tab === "updates" && (
                  <UpdatesTab 
                    startupId={id} 
                    isFounder={!!user && !!founder && user.id === founder._id} 
                    canPost={!!user} 
                  />
                )}

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

            {/* Bottom CTA - Apple style */}
            <div className="relative overflow-hidden rounded-3xl bg-muted/50 border border-border p-8">
              <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-foreground">
                    {tab === "product" 
                      ? "Believe in our product?" 
                      : "This idea excites you?"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tab === "product" 
                      ? "Invest in our plan and help us build a strong future."
                      : "Invest now and help the founder build something amazing."}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      if (!user) return navigate("/login");
                      if (!isInterested) interestMutation.mutate();
                      setTab("investments");
                    }}
                    className="group relative inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors duration-300"
                  >
                    <Wallet className="h-4 w-4 transition-transform group-hover:scale-110" />
                    Invest Now
                    <span className="absolute inset-0 rounded-full bg-card/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <button
                    onClick={handleMessageFounder}
                    disabled={!user || messageFounderMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all duration-300"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Founder
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all duration-300"
                  >
                    <Share2 className="h-4 w-4" />
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>
              </div>
            </div>

            {interestMutation.isError && (
              <p className="text-sm text-red-600 text-center">
                {isAxiosError(interestMutation.error) ? interestMutation.error.response?.data?.message : "Something went wrong."}
              </p>
            )}
          </div>

          {/* RIGHT RAIL - Floating Premium Panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {tab === "team" ? (
              <TeamSidebar startup={startup} setJoinModal={setJoinModal} />
            ) : tab === "product" ? (
              <ProductSidebar startup={startup} fundingPct={fundingPct} confirmedInvestorCount={confirmedInvestorCount} setTab={setTab} onMessageFounder={handleMessageFounder} user={user} messageFounderMutation={messageFounderMutation} />
            ) : tab === "documents" ? (
              <DocumentsSidebar startup={startup} fundingPct={fundingPct} confirmedInvestorCount={confirmedInvestorCount} setTab={setTab} onMessageFounder={handleMessageFounder} user={user} messageFounderMutation={messageFounderMutation} />
            ) : tab === "updates" ? (
              <UpdatesSidebar startup={startup} fundingPct={fundingPct} confirmedInvestorCount={confirmedInvestorCount} setTab={setTab} updatesList={updatesList} />
            ) : tab === "discussions" ? (
              <DiscussionsSidebar startup={startup} fundingPct={fundingPct} confirmedInvestorCount={confirmedInvestorCount} setTab={setTab} recentActivity={recentActivity} user={user} setDiscussionComposerOpen={setDiscussionComposerOpen} />
            ) : tab === "funding" || tab === "investments" ? (
              <FundingSidebar startup={startup} fundingPct={fundingPct} confirmedInvestorCount={confirmedInvestorCount} setTab={setTab} investorPartners={investorPartners} isOwner={isOwner} onMessageFounder={handleMessageFounder} user={user} messageFounderMutation={messageFounderMutation} isInterested={isInterested} interestMutation={interestMutation} />
            ) : (
              <DefaultSidebar startup={startup} fundingPct={fundingPct} confirmedInvestorCount={confirmedInvestorCount} setTab={setTab} investorPartners={investorPartners} isOwner={isOwner} onMessageFounder={handleMessageFounder} user={user} messageFounderMutation={messageFounderMutation} />
            )}
          </aside>
        </div>
      </div>

      {/* Modals */}
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

// ============================================
// SUB-COMPONENTS (Split for better readability)
// ============================================

function OverviewContent({ startup, fundingPct, confirmedInvestorCount, setTab }: any) {
  return (
    <div className="space-y-8">
      {/* About & Highlights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="group rounded-2xl bg-muted p-6 transition-all duration-300 hover:bg-accent">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">About the Idea</h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{startup.description}</p>
          {startup.targetAudience && (
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <span><span className="font-medium text-foreground">Target Audience:</span> {startup.targetAudience}</span>
            </p>
          )}
        </div>

        {startup.highlights.length > 0 && (
          <div className="group rounded-2xl bg-muted p-6 transition-all duration-300 hover:bg-accent">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Highlights</h3>
            <ul className="mt-3 space-y-2.5">
              {startup.highlights.map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mission Statement */}
      {startup.missionStatement && (
        <div className="group rounded-2xl bg-muted/40 p-6 border border-border/30">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Our Mission</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{startup.missionStatement}</p>
        </div>
      )}

      {/* Problem & Solution Grid */}
      {(startup.problemStatement || startup.solution) && (
        <div className="grid gap-6 md:grid-cols-2">
          {startup.problemStatement && (
            <div className="group rounded-2xl bg-red-50/40 p-6 border border-red-100/30 transition-all duration-300 hover:bg-red-50/60">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Problem</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {startup.problemStatement.split("\n").filter(Boolean).map((line: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" /> {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {startup.solution && (
            <div className="group rounded-2xl bg-green-50/40 p-6 border border-green-100/30 transition-all duration-300 hover:bg-green-50/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Solution</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {startup.solution.split("\n").filter(Boolean).map((line: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Business Plan */}
      {startup.businessPlan.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Business Plan</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(160px,200px))]">
            {startup.businessPlan.map((item: any, i: number) => {
              const icons = [Target, TrendingUp, Layers, Users];
              const Icon = icons[i % icons.length];
              return (
                <div key={i} className="rounded-2xl bg-muted p-4 text-center transition-all duration-300 hover:bg-accent">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Traction */}
      {startup.tractionStats.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Traction</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(160px,200px))]">
            {startup.tractionStats.map((item: any, i: number) => {
              const icons = [TrendingUp, Users2, CheckCircle2, PieChart];
              const Icon = icons[i % icons.length];
              return (
                <div key={i} className="rounded-2xl bg-muted p-4 text-center transition-all duration-300 hover:bg-accent">
                  <Icon className="mx-auto h-5 w-5 text-foreground" />
                  <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones */}
      {startup.milestones.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Milestones</h3>
          <div className="space-y-0">
            {[...startup.milestones]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((m: any, i: number, arr: any[]) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="mt-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-border" />
                    {i < arr.length - 1 && <span className="mt-1 w-px flex-1 bg-muted" />}
                  </div>
                  <div className={cn("pb-6", i === arr.length - 1 && "pb-0")}>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}</p>
                    {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Funding Mini Card */}
      <div className="rounded-2xl bg-muted/40 border border-border/30 p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E5EA" strokeWidth="4" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="url(#fundingGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - fundingPct / 100)}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-lg font-bold text-foreground">{fundingPct}%</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(startup.fundingRaised)}</p>
            <p className="text-sm text-muted-foreground">raised of {formatCurrency(startup.fundingNeeded)} goal</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{confirmedInvestorCount} investors</span>
              {startup.expectedClosingDate && (
                <>
                  <span>•</span>
                  <span>{daysLeft(startup.expectedClosingDate)} days left</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setTab("funding")}
          className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          View Funding Details
        </button>
      </div>
    </div>
  );
}

function FundingContent({ startup, fundingPct, confirmedInvestorCount, setTab }: any) {
  return (
    <div className="space-y-8">
      {/* Funding Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-muted p-6">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Funding Overview</h3>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E5EA" strokeWidth="4" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="url(#fundingGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - fundingPct / 100)}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-xl font-bold text-foreground">{fundingPct}%</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(startup.fundingNeeded)}</p>
              <p className="text-sm text-muted-foreground">Funding Goal</p>
              <p className="mt-2 text-xl font-bold text-foreground">{formatCurrency(startup.fundingRaised)}</p>
              <p className="text-sm text-muted-foreground">Raised Amount</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-muted p-6">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Funding Details</h3>
          <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
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
        </div>
      </div>

      {/* Fund Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FundStat icon={Briefcase} color="#171717" value={formatCurrency(startup.fundingNeeded)} label="Goal Amount" />
        <FundStat icon={CheckCircle2} color="#171717" value={formatCurrency(startup.fundingRaised)} label="Raised Amount" />
        <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining" />
        <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
      </div>

      {/* Fund Usage Plan */}
      {startup.fundUsagePlan.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Fund Usage Plan</h3>
          <div className="overflow-x-auto rounded-2xl bg-muted p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4 text-left font-semibold">Category</th>
                  <th className="pb-3 pr-4 text-left font-semibold">Description</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Cost</th>
                  <th className="pb-3 text-right font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {startup.fundUsagePlan.map((item: any, i: number) => {
                  const pct = startup.fundingNeeded ? Math.round((item.estimatedCost / startup.fundingNeeded) * 100) : 0;
                  const color = FUND_ITEM_COLORS[i % FUND_ITEM_COLORS.length];
                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: color.bg, color: color.fg }}>
                            <Package className="h-3.5 w-3.5" />
                          </span>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{item.description}</td>
                      <td className="py-3 pr-4 text-right font-medium">{formatCurrency(item.estimatedCost)}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-3">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color.fg }} />
                          </div>
                          <span className="w-9 text-right text-xs font-medium">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="pt-3 font-semibold" colSpan={2}>Total</td>
                  <td className="pt-3 text-right font-semibold">
                    {formatCurrency(startup.fundUsagePlan.reduce((sum: number, i: any) => sum + i.estimatedCost, 0))}
                  </td>
                  <td className="pt-3 text-right font-semibold">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expected Outcomes & Documents */}
      {(startup.expectedOutcomes.length > 0 || !!startup.pitchDeckUrl || !!startup.documents?.length) && (
        <div className="grid gap-6 md:grid-cols-2">
          {startup.expectedOutcomes.length > 0 && (
            <div className="rounded-2xl bg-muted p-6">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Expected Outcomes</h3>
              <div className="mt-3 space-y-3">
                {startup.expectedOutcomes.map((o: any, i: number) => {
                  const icons = [Clock, TrendingUp, PieChart, Users2, Briefcase];
                  const Icon = icons[i % icons.length];
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-foreground" /> {o.label}
                      </span>
                      <span className="font-medium text-foreground">{o.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!!startup.pitchDeckUrl || !!startup.documents?.length) && (
            <div className="rounded-2xl bg-muted p-6">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Documents</h3>
              <div className="mt-3 divide-y divide-border">
                {startup.pitchDeckUrl && <DocRow name="Pitch Deck" url={startup.pitchDeckUrl} />}
                {startup.documents?.map((d: any, i: number) => <DocRow key={i} name={d.name} url={d.url} />)}
              </div>
              <button onClick={() => setTab("documents")} className="mt-3 text-sm font-medium text-foreground hover:text-brand transition-colors">
                View All Documents →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductContent({ startup, setProductModal }: any) {
  return (
    <div className="space-y-8">
      {(startup.products.length > 0 || startup.productHighlights.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {startup.products.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Our Product</h3>
              <ProductCarousel products={startup.products} onSelect={setProductModal} />
            </div>
          )}

          {startup.productHighlights.length > 0 && (
            <div className="rounded-2xl bg-muted p-6">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Product Highlights</h3>
              <ul className="mt-3 space-y-2.5">
                {startup.productHighlights.map((h: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Plan Phases */}
      {startup.planPhases.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Our Plan</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {startup.planPhases.map((phase: any, i: number) => {
              const icons = [Rocket, TrendingUp, Award];
              const Icon = icons[i % icons.length];
              return (
                <div key={i} className="rounded-2xl bg-muted p-5 transition-all duration-300 hover:bg-accent">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    {phase.timeframe && (
                      <span className="rounded-full bg-card/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                        {phase.timeframe}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{phase.title}</p>
                  {phase.checklist.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {phase.checklist.map((c: string, ci: number) => (
                        <li key={ci} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-foreground" /> {c}
                        </li>
                      ))}
                    </ul>
                  )}
                  {phase.estimatedCost > 0 && (
                    <p className="mt-3 border-t border-border pt-2.5 text-xs font-medium text-foreground">
                      Est. Cost: {formatCurrency(phase.estimatedCost)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Market Stats & Competitive Advantage */}
      {(startup.marketStats.length > 0 || startup.competitiveAdvantage.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {startup.marketStats.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Market Opportunity</h3>
              <div className="grid grid-cols-2 gap-4">
                {startup.marketStats.map((s: any, i: number) => {
                  const icons = [Globe, Users2, TrendingUp, PieChart];
                  const Icon = icons[i % icons.length];
                  return (
                    <div key={i} className="rounded-2xl bg-muted p-4 text-center transition-all duration-300 hover:bg-accent">
                      <Icon className="mx-auto h-5 w-5 text-foreground" />
                      <p className="mt-2 text-lg font-semibold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {startup.competitiveAdvantage.length > 0 && (
            <div className="rounded-2xl bg-muted p-6">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Competitive Advantage</h3>
              <ul className="mt-3 space-y-2.5">
                {startup.competitiveAdvantage.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvestorsSection({ investorPartners }: any) {
  return (
    <div className="rounded-2xl bg-muted p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Interested Investors & Partners</h3>
        <span className="text-xs text-muted-foreground">Only visible to you</span>
      </div>
      {investorPartners.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No investors or partners have connected yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {investorPartners.map((p: any) => (
            <div key={p._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="h-12 w-12 ring-2 ring-white">
                <AvatarImage src={p.avatar} alt={p.name} />
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  {initialsFromName(p.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{p.role}</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">Interested</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SIDEBAR COMPONENTS
// ============================================

function TeamSidebar({ setJoinModal }: any) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
          <Users2 className="h-5 w-5" />
        </div>
        <h4 className="mt-3 text-base font-semibold text-foreground">Join the Team</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Like this idea? Use your skills to help build this startup.
        </p>
        <button
          onClick={() => setJoinModal({ open: true, role: null })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          <Users2 className="h-4 w-4" /> Join Team
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">How It Works</h4>
        <div className="mt-4 space-y-4">
          {[
            ["Choose a Role", "Pick the role that matches your skills."],
            ["Submit Application", "Fill in your info and experience."],
            ["Founder Review", "The founder reviews your application."],
            ["Join the Team", "Start working with the team."],
          ].map(([title, desc], i) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ProductSidebar({ startup, fundingPct, confirmedInvestorCount, setTab, onMessageFounder, user, messageFounderMutation }: any) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Investment Summary</h4>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FundStat icon={Briefcase} color="#171717" value={formatCurrency(startup.fundingNeeded)} label="Goal" />
          <FundStat icon={CheckCircle2} color="#171717" value={formatCurrency(startup.fundingRaised)} label="Raised" />
          <FundStat icon={PieChart} color="#171717" value={`${fundingPct}%`} label="Funded" />
          <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining" />
          <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
          <FundStat icon={CalendarDays} color="#171717" value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)}d` : "—"} label="Days Left" />
        </div>
        <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
          View Funding Details
        </button>
      </div>

      {startup.whyProduct.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h4 className="text-sm font-semibold text-foreground">Why Our Product?</h4>
          <ul className="mt-3 space-y-2.5">
            {startup.whyProduct.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
          <Truck className="h-5 w-5" />
        </div>
        <h4 className="mt-3 text-base font-semibold text-foreground">Want to Distribute?</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Partner with us to distribute our products.
        </p>
        <button
          onClick={onMessageFounder}
          disabled={!user || messageFounderMutation.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          <Truck className="h-4 w-4" /> Become Distributor
        </button>
      </div>

      {(!!startup.pitchDeckUrl || !!startup.documents?.length) && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h4 className="text-sm font-semibold text-foreground">Documents</h4>
          <div className="mt-3 divide-y divide-border">
            {startup.pitchDeckUrl && <DocRow name="Pitch Deck" url={startup.pitchDeckUrl} />}
            {startup.documents?.map((d: any, i: number) => <DocRow key={i} name={d.name} url={d.url} />)}
          </div>
        </div>
      )}
    </>
  );
}

function DocumentsSidebar({ startup, fundingPct, confirmedInvestorCount, setTab, onMessageFounder, user, messageFounderMutation }: any) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Investment Summary</h4>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FundStat icon={Briefcase} color="#171717" value={formatCurrency(startup.fundingNeeded)} label="Goal" />
          <FundStat icon={CheckCircle2} color="#171717" value={formatCurrency(startup.fundingRaised)} label="Raised" />
          <FundStat icon={PieChart} color="#171717" value={`${fundingPct}%`} label="Funded" />
          <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining" />
          <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
          <FundStat icon={CalendarDays} color="#171717" value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)}d` : "—"} label="Days Left" />
        </div>
        <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
          View Funding Details
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Document Highlights</h4>
        <ul className="mt-3 space-y-2.5">
          {[
            "Verified and authentic documents",
            "Regularly updated for transparency",
            "Helps investors understand the startup",
            "Secure and easy access",
          ].map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {w}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Need More Information?</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Can't find what you're looking for?</p>
        <button
          onClick={onMessageFounder}
          disabled={!user || messageFounderMutation.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          <FilePlus2 className="h-4 w-4" /> Request Document
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-muted p-6 border border-border/30">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/80 text-foreground">
            <FolderCheck className="h-5 w-5" />
          </div>
          <h4 className="mt-3 text-base font-semibold text-foreground">Transparency builds trust</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
            We believe in complete transparency with our investors and community.
          </p>
        </div>
      </div>
    </>
  );
}

function UpdatesSidebar({ startup, fundingPct, confirmedInvestorCount, setTab, updatesList }: any) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Investment Summary</h4>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FundStat icon={Briefcase} color="#171717" value={formatCurrency(startup.fundingNeeded)} label="Goal" />
          <FundStat icon={CheckCircle2} color="#171717" value={formatCurrency(startup.fundingRaised)} label="Raised" />
          <FundStat icon={PieChart} color="#171717" value={`${fundingPct}%`} label="Funded" />
          <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining" />
          <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
          <FundStat icon={CalendarDays} color="#171717" value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)}d` : "—"} label="Days Left" />
        </div>
        <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
          View Funding Details
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Why Regular Updates?</h4>
        <ul className="mt-3 space-y-2.5">
          {[
            "Builds transparency and trust",
            "Shows real progress to investors",
            "Helps attract partners and supporters",
            "Keeps the community engaged",
          ].map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {w}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Recent Updates</h4>
        {!updatesList?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">No updates posted yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {updatesList.slice(0, 4).map((u: any) => {
              const meta = UPDATE_CATEGORY_META[u.category] ?? UPDATE_CATEGORY_META.Other;
              const Icon = meta.icon;
              return (
                <div key={u._id} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-foreground">{u.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function DiscussionsSidebar({ startup, fundingPct, confirmedInvestorCount, setTab, recentActivity, user, setDiscussionComposerOpen }: any) {
  const navigate = useNavigate();
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Investment Summary</h4>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FundStat icon={Briefcase} color="#171717" value={formatCurrency(startup.fundingNeeded)} label="Goal" />
          <FundStat icon={CheckCircle2} color="#171717" value={formatCurrency(startup.fundingRaised)} label="Raised" />
          <FundStat icon={PieChart} color="#171717" value={`${fundingPct}%`} label="Funded" />
          <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining" />
          <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
          <FundStat icon={CalendarDays} color="#171717" value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)}d` : "—"} label="Days Left" />
        </div>
        <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
          View Funding Details
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h4 className="mt-3 text-base font-semibold text-foreground">Start a Discussion</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Have a question or suggestion? Start a discussion.
        </p>
        <button
          onClick={() => (user ? setDiscussionComposerOpen(true) : navigate("/login"))}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Discussion
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Why Discussions Matter?</h4>
        <ul className="mt-3 space-y-2.5">
          {[
            "Get expert advice from community",
            "Find potential partners & supporters",
            "Improve your business with feedback",
            "Build trust and transparency",
            "Grow your network",
          ].map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {w}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
        {recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {recentActivity.map((d: any) => (
              <div key={d._id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-white">
                  <AvatarImage src={d.author.avatar} alt={d.author.name} />
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {initialsFromName(d.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground/80">
                    <span className="font-medium text-foreground">{d.author.name}</span> started a discussion
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(d.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FundingSidebar({ startup, fundingPct, confirmedInvestorCount, setTab, investorPartners, isOwner, onMessageFounder, user, messageFounderMutation, isInterested, interestMutation }: any) {
  const navigate = useNavigate();
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Quick Summary</h4>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FundStat icon={Briefcase} color="#171717" value={formatCurrency(startup.fundingNeeded)} label="Goal" />
          <FundStat icon={CheckCircle2} color="#171717" value={formatCurrency(startup.fundingRaised)} label="Raised" />
          <FundStat icon={PieChart} color="#171717" value={`${fundingPct}%`} label="Funded" />
          <FundStat icon={Wallet} color="#d97706" value={formatCurrency(Math.max(0, startup.fundingNeeded - startup.fundingRaised))} label="Remaining" />
          <FundStat icon={Users2} color="#7c3aed" value={String(confirmedInvestorCount)} label="Investors" />
          <FundStat icon={CalendarDays} color="#171717" value={startup.expectedClosingDate ? `${daysLeft(startup.expectedClosingDate)}d` : "—"} label="Days Left" />
        </div>
        <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
          View Funding Details
        </button>
      </div>

      {startup.whyInvest.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h4 className="text-sm font-semibold text-foreground">Why Invest?</h4>
          <ul className="mt-3 space-y-2.5">
            {startup.whyInvest.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Become an Investor</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Invest in this idea and be part of the journey.</p>
        <button
          onClick={() => {
            if (!user) return navigate("/login");
            if (!isInterested) interestMutation.mutate();
            setTab("investments");
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          <Wallet className="h-4 w-4" /> Invest
        </button>
        <button
          onClick={onMessageFounder}
          disabled={!user || messageFounderMutation.isPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <MessageSquare className="h-4 w-4" /> Message Founder
        </button>
      </div>

      {isOwner && investorPartners.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Recent Investors</h4>
            <span className="text-xs text-muted-foreground">Only you</span>
          </div>
          <div className="mt-3 space-y-3">
            {investorPartners.slice(0, 4).map((p: any) => (
              <div key={p._id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-white">
                  <AvatarImage src={p.avatar} alt={p.name} />
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {initialsFromName(p.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">{p.role}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">Interested</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function DefaultSidebar({ startup, fundingPct, confirmedInvestorCount, setTab, investorPartners, isOwner, onMessageFounder, user, messageFounderMutation }: any) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Funding & Needs</h4>
        <p className="mt-4 text-2xl font-bold text-foreground">{formatCurrency(startup.fundingRaised)}</p>
        <p className="text-sm text-muted-foreground">of {formatCurrency(startup.fundingNeeded)} Goal</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${fundingPct}%` }} />
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">{fundingPct}% Funded</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-3">
            <Briefcase className="h-4 w-4 text-foreground" />
            <p className="mt-1.5 text-sm font-semibold">{formatCurrency(startup.fundingNeeded)}</p>
            <p className="text-xs text-muted-foreground">Needed</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Users2 className="h-4 w-4 text-foreground" />
            <p className="mt-1.5 text-sm font-semibold">{confirmedInvestorCount}</p>
            <p className="text-xs text-muted-foreground">Investors</p>
          </div>
        </div>

        <button onClick={() => setTab("funding")} className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
          View Funding Details
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Team</h4>
          <button onClick={() => setTab("team")} className="text-sm font-medium text-foreground hover:text-brand transition-colors">
            View All
          </button>
        </div>
        {startup.openRoles.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No open roles right now.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {startup.openRoles.slice(0, 5).map((role: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                </div>
                <p className="flex-1 text-sm font-medium text-foreground">{role.title}</p>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", role.type === "full_time" ? "bg-muted text-foreground" : "bg-amber-100 text-amber-700")}>
                  {role.type === "full_time" ? "Full Time" : "Part Time"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Interested Investors</h4>
            <span className="text-xs text-muted-foreground">Only you</span>
          </div>
          {investorPartners.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">None yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {investorPartners.map((p: any) => (
                <div key={p._id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 ring-2 ring-white">
                    <AvatarImage src={p.avatar} alt={p.name} />
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {initialsFromName(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="truncate text-xs capitalize text-muted-foreground">{p.role}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">Interested</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-semibold text-foreground">Let's Connect</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Interested in this idea? Let's build something amazing together.
        </p>
        <button
          onClick={onMessageFounder}
          disabled={!user || messageFounderMutation.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          {messageFounderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Send Message
        </button>
      </div>
    </>
  );
}

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Facebook,
  FileText,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  MapPin,
  ScrollText,
  Send,
  Sparkles,
  Star as StarIcon,
  Target,
  Twitter,
  UserCheck,
  Users2,
  Wallet,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { CampaignMarketCard } from "@/pages/campaigns/marketplace/CampaignMarketplace";
import { campaignApi } from "@/api/campaigns";
import { jobApi } from "@/api/jobs";
import { formatCurrency, getFollowerTier, initialsFromName } from "@/lib/utils";
import { publicProfilePathForRole } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import type { Campaign, UserRole } from "@/types";

const PLATFORM_META: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "#E1306C" },
  youtube: { label: "YouTube", icon: Youtube, color: "#FF0000" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  twitter: { label: "X (Twitter)", icon: Twitter, color: "#111111" },
  facebook: { label: "Facebook", icon: Facebook, color: "#1877F2" },
  other: { label: "Other", icon: Globe, color: "#6B7280" },
};

const COLLAB_LABELS: Record<string, string> = {
  paid: "Paid Collaboration",
  barter: "Barter / Product Exchange",
  affiliate: "Affiliate / Commission",
  hybrid: "Hybrid",
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  upi: "UPI",
  escrow: "Platform Escrow (GrowHive)",
  other: "Other",
};

const APPLICATION_STEPS = [
  { step: "01", title: "Apply", desc: "Submit your rate and a short pitch" },
  { step: "02", title: "Brand Reviews", desc: "The brand reviews your application" },
  { step: "03", title: "You're Selected", desc: "Get confirmed for the campaign" },
  { step: "04", title: "Create & Publish", desc: "Deliver the content and get paid" },
];

function platformMeta(name: string) {
  return PLATFORM_META[name.trim().toLowerCase()] ?? PLATFORM_META.other;
}

function dateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isStartingSoon(c: Campaign) {
  return c.status === "open" && !!c.startDate && new Date(c.startDate).getTime() > Date.now();
}

function isEndingSoon(c: Campaign) {
  if (c.status !== "open" || !c.applicationDeadline || isStartingSoon(c)) return false;
  const left = daysLeft(c.applicationDeadline);
  return left <= 3 && left > 0;
}

function StatusBadge({ campaign }: { campaign: Campaign }) {
  if (campaign.status === "closed") return <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-bold text-[#6B7280]">CLOSED</span>;
  if (isStartingSoon(campaign)) return <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10.5px] font-bold text-[#2563EB]">STARTING SOON</span>;
  if (isEndingSoon(campaign)) return <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10.5px] font-bold text-[#B45309]">ENDING SOON</span>;
  return <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">OPEN</span>;
}

function budgetLabel(c: Campaign) {
  if (c.budgetMin <= 0 && c.budgetMax <= 0) return "Budget on request";
  if (c.budgetMax > c.budgetMin) return `${formatCurrency(c.budgetMin, c.currency as "INR" | "USD")} - ${formatCurrency(c.budgetMax, c.currency as "INR" | "USD")}`;
  return formatCurrency(c.budgetMin, c.currency as "INR" | "USD");
}

export default function CampaignDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedRate, setProposedRate] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: campaign, isLoading } = useQuery({ queryKey: ["campaigns", id], queryFn: () => campaignApi.getById(id), enabled: !!id });

  const { data: myApplications } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: jobApi.myApplications,
    enabled: !!user && user.role === "influencer",
  });

  const alreadyApplied = myApplications?.some((a) => (typeof a.job === "string" ? a.job : a.job._id) === id);

  const applyMutation = useMutation({
    mutationFn: () => campaignApi.apply(id, { coverLetter, proposedRate, deliveryDays }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      setDialogOpen(false);
    },
  });

  // Real related campaigns — same influencer category, excluding this one.
  const { data: relatedData } = useQuery({
    queryKey: ["campaigns", "related", campaign?.influencerCategory],
    queryFn: () => campaignApi.list({ limit: 6 }),
    enabled: !!campaign,
  });
  const relatedCampaigns = (relatedData?.data ?? []).filter((c) => c._id !== id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-4 w-64 bg-[#EDEFEA]" />
          <Skeleton className="h-32 w-full rounded-[20px] bg-[#EDEFEA]" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-96 w-full rounded-[20px] bg-[#EDEFEA]" />
            <Skeleton className="h-64 w-full rounded-[20px] bg-[#EDEFEA]" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Campaign not found</p>
        <Link
          to="/campaigns"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Campaigns
        </Link>
      </div>
    );
  }

  const employer = typeof campaign.employer === "object" ? campaign.employer : undefined;
  const employerProfilePath = employer ? publicProfilePathForRole(employer.role as UserRole, employer._id) : null;
  const previousClients = employer?.agencyProfile?.clients ?? [];
  const canApply = user && user.role === "influencer";
  const isClosed = campaign.status === "closed";
  const isFixedBudget = campaign.budgetMin > 0 && campaign.budgetMin === campaign.budgetMax;
  const hasCollaborators = !!campaign.collaboratorsMin || !!campaign.collaboratorsMax;
  const hasTargetAge = !!campaign.targetAgeMin || !!campaign.targetAgeMax;
  const followerTier = campaign.minFollowers ? getFollowerTier(campaign.minFollowers) : null;
  const deliverableLines = campaign.deliverables?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const highlightLines = campaign.highlights?.filter(Boolean) ?? [];
  const termsLines = campaign.termsAndConditions?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const hasTimeline = !!campaign.startDate || !!campaign.applicationDeadline || !!campaign.endDate;

  return (
    <div className="bg-[#F7F8F5] pb-24 lg:pb-10">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/campaigns" className="hover:text-[#111111]">
            Campaigns
          </Link>
          {campaign.influencerCategory && (
            <>
              {" "}
              / <span className="text-[#6B7280]">{campaign.influencerCategory}</span>
            </>
          )}{" "}
          / <span className="text-[#6B7280]">{campaign.title}</span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Campaigns
        </button>

        {/* Campaign hero */}
        <div className="mt-4 rounded-[20px] border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge campaign={campaign} />
              {campaign.isFeatured && (
                <span className="flex items-center gap-1 rounded-full bg-[#F1FFD6] px-2.5 py-1 text-[10.5px] font-bold text-[#4D7A00]">
                  <Sparkles className="h-3 w-3" /> Featured
                </span>
              )}
              {(campaign.influencerCategory || campaign.niche) && (
                <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-medium text-[#4B5563]">
                  {[campaign.influencerCategory, campaign.niche].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            <SaveButton type="campaign" id={campaign._id} className="h-9 w-9 shrink-0 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
          </div>

          <h1 className="mt-3 text-xl font-extrabold leading-snug text-[#111111] sm:text-2xl">{campaign.title}</h1>

          {employer && (
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar className="h-9 w-9 rounded-xl border border-[#E5E7EB]">
                <AvatarImage src={employer.avatar} alt={employer.name} className="rounded-xl object-cover" />
                <AvatarFallback className="rounded-xl bg-[#111111] text-xs font-semibold text-white">{initialsFromName(employer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-[#9CA3AF]">Hosted by</p>
                <p className="flex items-center gap-1 truncate text-sm font-bold text-[#111111]">
                  {employer.name}
                  {employer.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
                </p>
              </div>
              {campaign.location && (
                <span className="ml-2 flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <MapPin className="h-3.5 w-3.5" /> {campaign.location}
                </span>
              )}
            </div>
          )}

          <p className="mt-3 line-clamp-2 max-w-2xl text-[13.5px] leading-relaxed text-[#6B7280]">{campaign.description}</p>
        </div>

        {/* Main layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left — main content */}
          <div className="min-w-0 space-y-6">
            {/* About / objective */}
            <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-base font-bold text-[#111111]">About the Campaign</h2>
              <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-[1.7] text-[#4B5563]">{campaign.description}</p>

              {(highlightLines.length > 0 || deliverableLines.length > 0) && (
                <div className="mt-6 grid gap-6 border-t border-[#F1F3EF] pt-5 sm:grid-cols-2">
                  {highlightLines.length > 0 && (
                    <div>
                      <h3 className="mb-2.5 text-[13.5px] font-bold text-[#111111]">Campaign Highlights</h3>
                      <ul className="space-y-1.5">
                        {highlightLines.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-[#4B5563]">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" /> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {deliverableLines.length > 0 && (
                    <div>
                      <h3 className="mb-2.5 flex items-center gap-1.5 text-[13.5px] font-bold text-[#111111]">
                        <FileText className="h-4 w-4 text-[#9CA3AF]" /> What You'll Create
                      </h3>
                      <ul className="space-y-1.5">
                        {deliverableLines.map((l, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-[#4B5563]">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" /> {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Required platforms */}
            {campaign.platforms.length > 0 && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-base font-bold text-[#111111]">Required Platforms</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {campaign.platforms.map((p) => {
                    const meta = platformMeta(p);
                    const Icon = meta.icon;
                    return (
                      <span key={p} className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] px-3 py-1.5 text-[12px] font-medium text-[#111111]">
                        <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} /> {meta.label}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Target audience + who we're looking for */}
            {(hasTargetAge || campaign.location || followerTier || !!campaign.minFollowers || !!campaign.minEngagementRate) && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {(hasTargetAge || campaign.location) && (
                    <div>
                      <h2 className="mb-2.5 flex items-center gap-1.5 text-base font-bold text-[#111111]">
                        <Target className="h-4 w-4 text-[#9CA3AF]" /> Target Audience
                      </h2>
                      <div className="space-y-2 text-[13px]">
                        {hasTargetAge && (
                          <p className="flex justify-between">
                            <span className="text-[#9CA3AF]">Age</span>
                            <span className="font-semibold text-[#111111]">
                              {campaign.targetAgeMin ?? "—"}–{campaign.targetAgeMax ?? "—"} yrs
                            </span>
                          </p>
                        )}
                        {campaign.location && (
                          <p className="flex justify-between">
                            <span className="text-[#9CA3AF]">Location</span>
                            <span className="font-semibold text-[#111111]">{campaign.location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {(!!campaign.minFollowers || !!campaign.minEngagementRate || campaign.influencerCategory) && (
                    <div>
                      <h2 className="mb-2.5 flex items-center gap-1.5 text-base font-bold text-[#111111]">
                        <UserCheck className="h-4 w-4 text-[#9CA3AF]" /> Who We're Looking For
                      </h2>
                      <ul className="space-y-1.5">
                        {campaign.influencerCategory && (
                          <li className="flex items-center gap-2 text-[13px] text-[#4B5563]">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" /> {campaign.influencerCategory} Creators
                          </li>
                        )}
                        {!!campaign.minFollowers && (
                          <li className="flex items-center gap-2 text-[13px] text-[#4B5563]">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" /> {campaign.minFollowers.toLocaleString("en-IN")}+ followers
                            {followerTier && ` (${followerTier})`}
                          </li>
                        )}
                        {!!campaign.minEngagementRate && (
                          <li className="flex items-center gap-2 text-[13px] text-[#4B5563]">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" /> {campaign.minEngagementRate}%+ engagement rate
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Compensation */}
            <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-[#111111]">
                <Wallet className="h-4 w-4 text-[#9CA3AF]" /> Compensation
              </h2>
              <p className="mt-2 text-2xl font-extrabold text-[#111111]">{budgetLabel(campaign)}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
                {isFixedBudget && <span className="text-[#6B7280]">Fixed campaign budget</span>}
                {campaign.collaborationType && (
                  <span className="text-[#6B7280]">
                    <span className="font-semibold text-[#111111]">Type:</span> {COLLAB_LABELS[campaign.collaborationType]}
                  </span>
                )}
                {campaign.paymentMode && (
                  <span className="text-[#6B7280]">
                    <span className="font-semibold text-[#111111]">Payout via:</span> {PAYMENT_MODE_LABELS[campaign.paymentMode]}
                  </span>
                )}
              </div>
            </section>

            {/* Timeline — only real dates */}
            {hasTimeline && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-base font-bold text-[#111111]">Campaign Timeline</h2>
                <div className="mt-4 space-y-0">
                  {[
                    campaign.startDate && { label: "Campaign Opens", date: campaign.startDate },
                    campaign.applicationDeadline && { label: "Application Deadline", date: campaign.applicationDeadline },
                    campaign.endDate && { label: "Campaign Ends", date: campaign.endDate },
                  ]
                    .filter((s): s is { label: string; date: string } => !!s)
                    .map((s, i, arr) => (
                      <div key={s.label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="flex h-3 w-3 shrink-0 rounded-full bg-[#B6FF00]" />
                          {i < arr.length - 1 && <span className="w-px flex-1 bg-[#E5E7EB]" />}
                        </div>
                        <div className={i < arr.length - 1 ? "pb-5" : ""}>
                          <p className="text-[13px] font-bold text-[#111111]">{s.label}</p>
                          <p className="text-[12px] text-[#9CA3AF]">{dateLabel(s.date)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Application process — real, platform-wide flow */}
            <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-base font-bold text-[#111111]">How Applying Works</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {APPLICATION_STEPS.map((s) => (
                  <div key={s.step}>
                    <span className="text-lg font-extrabold text-[#B6FF00]" style={{ WebkitTextStroke: "1px #111111" }}>
                      {s.step}
                    </span>
                    <p className="mt-1 text-[13px] font-bold text-[#111111]">{s.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-[#9CA3AF]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Brand */}
            {employer && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-base font-bold text-[#111111]">About the Brand</h2>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-xl border border-[#E5E7EB]">
                      <AvatarImage src={employer.avatar} alt={employer.name} className="rounded-xl object-cover" />
                      <AvatarFallback className="rounded-xl bg-[#111111] text-sm font-semibold text-white">{initialsFromName(employer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate text-sm font-bold text-[#111111]">
                        {employer.name}
                        {employer.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
                      </p>
                      {!!employer.reviewCount && (
                        <p className="flex items-center gap-1 text-[12px] text-[#6B7280]">
                          <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {employer.rating?.toFixed(1)} ({employer.reviewCount} reviews)
                        </p>
                      )}
                    </div>
                  </div>
                  {employerProfilePath && (
                    <Link
                      to={employerProfilePath}
                      className="shrink-0 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#111111] transition-colors hover:border-[#B6FF00] hover:bg-[#F1FFD6]/30"
                    >
                      View Brand
                    </Link>
                  )}
                </div>

                {previousClients.length > 0 && (
                  <div className="mt-4 border-t border-[#F1F3EF] pt-4">
                    <p className="mb-2 text-[12.5px] font-semibold text-[#111111]">Previously Worked With</p>
                    <div className="flex flex-wrap gap-2">
                      {previousClients.map((c, i) => (
                        <span
                          key={i}
                          title={c.description}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 text-[11.5px] font-medium text-[#4B5563]"
                        >
                          {c.logoUrl ? <img src={c.logoUrl} alt="" className="h-4 w-4 shrink-0 rounded object-cover" /> : null}
                          {c.clientName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Terms */}
            {termsLines.length > 0 && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="flex items-center gap-1.5 text-base font-bold text-[#111111]">
                  <ScrollText className="h-4 w-4 text-[#9CA3AF]" /> Campaign Terms
                </h2>
                <ul className="mt-2.5 space-y-1.5">
                  {termsLines.map((l, i) => (
                    <li key={i} className="text-[12.5px] leading-relaxed text-[#6B7280]">
                      • {l}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Apply CTA band — always shown, adapts to auth/role/status */}
            <section className="rounded-[20px] border border-[#E5E7EB] bg-[#F1FFD6]/40 p-6 text-center">
              <h2 className="text-lg font-bold text-[#111111]">Ready to apply to this campaign?</h2>
              <p className="mt-1.5 text-sm text-[#4B5563]">Send your application and show the brand why you're the right creator.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ApplyAction
                  variant="band"
                  user={user}
                  canApply={!!canApply}
                  isClosed={isClosed}
                  alreadyApplied={!!alreadyApplied}
                  campaign={campaign}
                  navigate={navigate}
                  id={id}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  coverLetter={coverLetter}
                  setCoverLetter={setCoverLetter}
                  proposedRate={proposedRate}
                  setProposedRate={setProposedRate}
                  deliveryDays={deliveryDays}
                  setDeliveryDays={setDeliveryDays}
                  applyMutation={applyMutation}
                />
                {canApply && !isClosed && !alreadyApplied && (
                  <SaveButton type="campaign" id={campaign._id} className="h-11 w-11 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
                )}
              </div>
            </section>
          </div>

          {/* Right — sticky sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-sm font-bold text-[#111111]">Campaign Details</h2>

              <div className="mt-4 border-t border-[#F1F3EF] pt-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  <Wallet className="h-3.5 w-3.5" /> Budget
                </p>
                <p className="mt-1 text-xl font-extrabold text-[#111111]">{budgetLabel(campaign)}</p>
              </div>

              {campaign.collaborationType && (
                <div className="mt-4 flex items-center justify-between border-t border-[#F1F3EF] pt-4 text-sm">
                  <span className="text-[#6B7280]">Campaign Type</span>
                  <span className="font-semibold text-[#111111]">{COLLAB_LABELS[campaign.collaborationType]}</span>
                </div>
              )}

              {!!campaign.applicationDeadline && (
                <div className="mt-4 flex items-center justify-between border-t border-[#F1F3EF] pt-4 text-sm">
                  <span className="flex items-center gap-1.5 text-[#6B7280]">
                    <CalendarClock className="h-4 w-4" /> Application Deadline
                  </span>
                  <span className="font-semibold text-[#111111]">{dateLabel(campaign.applicationDeadline)}</span>
                </div>
              )}

              {hasCollaborators && (
                <div className="mt-4 flex items-center justify-between border-t border-[#F1F3EF] pt-4 text-sm">
                  <span className="flex items-center gap-1.5 text-[#6B7280]">
                    <Users2 className="h-4 w-4" /> Creators Needed
                  </span>
                  <span className="font-semibold text-[#111111]">
                    {campaign.collaboratorsMin || 1}–{campaign.collaboratorsMax || campaign.collaboratorsMin}
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[#F1F3EF] pt-4 text-sm">
                <span className="text-[#6B7280]">Applications</span>
                <span className="font-semibold text-[#111111]">{campaign.applicationsCount}</span>
              </div>

              <div className="mt-5 border-t border-[#F1F3EF] pt-5">
                <ApplyAction
                  variant="sidebar"
                  user={user}
                  canApply={!!canApply}
                  isClosed={isClosed}
                  alreadyApplied={!!alreadyApplied}
                  campaign={campaign}
                  navigate={navigate}
                  id={id}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  coverLetter={coverLetter}
                  setCoverLetter={setCoverLetter}
                  proposedRate={proposedRate}
                  setProposedRate={setProposedRate}
                  deliveryDays={deliveryDays}
                  setDeliveryDays={setDeliveryDays}
                  applyMutation={applyMutation}
                />
              </div>
            </div>
          </div>
        </div>

        {/* More campaigns — real campaignApi.list() results */}
        {relatedCampaigns.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#111111]">More Campaigns</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCampaigns.map((c) => (
                <CampaignMarketCard key={c._id} campaign={c} layout="grid" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {canApply && !isClosed && !alreadyApplied && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-[#E5E7EB] bg-white p-3 lg:hidden">
          <SaveButton type="campaign" id={campaign._id} className="h-12 w-12 shrink-0 border border-[#E5E7EB] bg-white text-[#6B7280]" />
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            Apply to Campaign <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Apply action — single source of truth for the CTA state, shared between
// the bottom band and the sidebar so logged-out visitors, non-influencers,
// closed campaigns, and already-applied influencers all see a consistent
// real state instead of one spot going empty.
// ============================================================
function ApplyAction({
  variant,
  user,
  canApply,
  isClosed,
  alreadyApplied,
  campaign,
  navigate,
  id,
  ...dialogProps
}: {
  variant: "band" | "sidebar";
  user: { id: string } | null;
  canApply: boolean;
  isClosed: boolean;
  alreadyApplied: boolean;
  campaign: { title: string; companyName: string; currency: string };
  navigate: (path: string, opts?: { state?: unknown }) => void;
  id: string;
} & Omit<Parameters<typeof ApplyDialogTrigger>[0], "campaign" | "fullWidth">) {
  const fullWidth = variant === "sidebar";
  const sizing = fullWidth ? "flex h-12 w-full items-center justify-center" : "flex h-12 items-center justify-center px-8";

  if (!canApply) {
    return (
      <button
        type="button"
        onClick={() => (user ? undefined : navigate("/login", { state: { from: `/campaigns/${id}` } }))}
        disabled={!!user}
        className={`${sizing} rounded-[14px] border border-[#E5E7EB] text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-60`}
      >
        {user ? "Only influencers can apply" : "Log in to Apply"}
      </button>
    );
  }
  if (isClosed) {
    return <div className={`${sizing} rounded-[14px] bg-[#F1F3EF] text-sm font-semibold text-[#6B7280]`}>Campaign Closed</div>;
  }
  if (alreadyApplied) {
    return (
      <div className={`${sizing} gap-2 rounded-[14px] border border-[#16A34A]/30 bg-[#ECFDF3] text-sm font-semibold text-[#16A34A]`}>
        <CheckCircle2 className="h-4 w-4" /> Application Submitted
      </div>
    );
  }
  return <ApplyDialogTrigger campaign={campaign} fullWidth={fullWidth} {...dialogProps} />;
}

function ApplyDialogTrigger({
  campaign,
  open,
  onOpenChange,
  coverLetter,
  setCoverLetter,
  proposedRate,
  setProposedRate,
  deliveryDays,
  setDeliveryDays,
  applyMutation,
  fullWidth,
}: {
  campaign: { title: string; companyName: string; currency: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverLetter: string;
  setCoverLetter: (v: string) => void;
  proposedRate: number;
  setProposedRate: (v: number) => void;
  deliveryDays: number;
  setDeliveryDays: (v: number) => void;
  applyMutation: { mutate: () => void; isPending: boolean; isError: boolean; error: unknown };
  fullWidth?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            fullWidth
              ? "flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
              : "flex h-12 items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          }
        >
          <Send className="h-4 w-4" /> Apply to Campaign
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to {campaign.title}</DialogTitle>
          <DialogDescription>Propose your rate and introduce yourself to {campaign.companyName}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Your Rate ({campaign.currency})</Label>
            <Input type="number" min={0} value={proposedRate || ""} onChange={(e) => setProposedRate(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Delivery (days)</Label>
            <Input type="number" min={0} value={deliveryDays || ""} onChange={(e) => setDeliveryDays(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Tell them why you're a great fit..." className="min-h-[120px]" />
        </div>
        {applyMutation.isError && (
          <p className="mt-2 text-xs text-[#EF4444]">
            {isAxiosError(applyMutation.error) ? applyMutation.error.response?.data?.message : "Something went wrong."}
          </p>
        )}
        <button
          type="button"
          onClick={() => applyMutation.mutate()}
          disabled={applyMutation.isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
        >
          {applyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Application
        </button>
      </DialogContent>
    </Dialog>
  );
}

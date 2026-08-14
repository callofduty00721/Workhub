import { Link } from "react-router-dom";
import {
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Facebook,
  Globe,
  MapPin,
  Wallet,
  Users,
  FileText,
  CalendarRange,
  Timer,
  BadgeCheck,
  Star,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/shared/SaveButton";
import { formatCurrency, initialsFromName, timeUntil } from "@/lib/utils";
import type { Campaign } from "@/types";

// Same flat brand-color map used across InfluencerCard/InfluencerProfile —
// kept local since this is the only other place it's needed.
const PLATFORM_META: Record<string, { icon: LucideIcon; color: string }> = {
  instagram: { icon: Instagram, color: "#E1306C" },
  youtube: { icon: Youtube, color: "#FF0000" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  twitter: { icon: Twitter, color: "#171717" },
  facebook: { icon: Facebook, color: "#1877F2" },
  other: { icon: Globe, color: "#525252" },
};

function platformMeta(name: string) {
  return PLATFORM_META[name.trim().toLowerCase()] ?? PLATFORM_META.other;
}

// Rich browse-grid card for /campaigns. Every stat here comes straight from
// the Campaign document — nothing estimated or self-reported (no "Estimated
// Reach" / "Engagement Rate" tiles, on purpose: see the Match Score removal
// of self-reported engagement data earlier in this project for why that
// kind of number doesn't belong on the platform).
export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const employer = typeof campaign.employer === "object" ? campaign.employer : undefined;
  const onBehalfOfName = typeof campaign.onBehalfOf === "object" ? campaign.onBehalfOf?.name : undefined;
  // First platform is the "lead" one — sets the banner color when there's
  // no cover image; every platform still gets its own icon badge below.
  const meta = platformMeta(campaign.platforms[0] ?? "other");

  const isFixedBudget = campaign.budgetMin > 0 && campaign.budgetMin === campaign.budgetMax;
  const hasCollaborators = !!campaign.collaboratorsMin || !!campaign.collaboratorsMax;
  const hasDuration = !!campaign.startDate && !!campaign.endDate;
  const countdown = campaign.applicationDeadline ? timeUntil(campaign.applicationDeadline) : null;
  const hasTargetAge = !!campaign.targetAgeMin || !!campaign.targetAgeMax;

  return (
    <Link to={`/campaigns/${campaign._id}`} className="block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.18)]">
        {/* Banner — the brand's own cover image when they've set one, else a
            flat platform color (never a fabricated stock photo). */}
        <div className="relative h-24 shrink-0" style={{ backgroundColor: meta.color }}>
          {campaign.imageUrl && <img src={campaign.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {campaign.isFeatured && (
            <span className="absolute left-4 top-3 flex items-center gap-1 rounded-full bg-[#6366F1] px-2.5 py-1 text-[10px] font-bold text-white">
              <Sparkles className="h-3 w-3" /> FEATURED
            </span>
          )}
          <SaveButton type="campaign" id={campaign._id} className="absolute right-3 top-3 bg-black/30 hover:bg-black/50" />
          {!campaign.isFeatured && (
            <div className="absolute left-4 top-3 flex items-center gap-1">
              {campaign.platforms.map((p) => {
                const pMeta = platformMeta(p);
                const PIcon = pMeta.icon;
                return (
                  <span key={p} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90" title={p}>
                    <PIcon className="h-3 w-3" style={{ color: pMeta.color }} />
                  </span>
                );
              })}
            </div>
          )}
          <Avatar className="absolute -bottom-5 left-4 h-12 w-12 border-4 border-white shadow-sm">
            <AvatarImage src={employer?.avatar} alt={employer?.name ?? campaign.companyName} />
            <AvatarFallback className="bg-neutral-900 text-sm text-white">{initialsFromName(employer?.name ?? campaign.companyName)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-1 flex-col p-5 pt-8">
          <p className="line-clamp-2 text-[16px] font-bold leading-tight text-neutral-900">{campaign.title}</p>
          <p className="mt-1 flex items-center gap-1 truncate text-[12px] font-medium text-neutral-500">
            {employer?.name ?? campaign.companyName}
            {employer?.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />}
            {!!employer?.reviewCount && (
              <span className="flex items-center gap-0.5 text-neutral-400">
                <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" /> {employer.rating?.toFixed(1)} ({employer.reviewCount})
              </span>
            )}
            {onBehalfOfName && <span className="text-neutral-400">· for {onBehalfOfName}</span>}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {campaign.influencerCategory && (
              <Badge variant="secondary" className="text-[10px]">
                {campaign.influencerCategory}
              </Badge>
            )}
            {campaign.niche && (
              <Badge variant="outline" className="text-[10px]">
                {campaign.niche}
              </Badge>
            )}
          </div>

          <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-neutral-500">{campaign.description}</p>

          <div className="mt-3 divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <Wallet className="h-4 w-4 shrink-0 text-[#8B5CF6]" />
              <span className="flex-1 text-[12px] text-neutral-500">Budget</span>
              <span className="text-[12.5px] font-bold text-neutral-900">
                {isFixedBudget ? formatCurrency(campaign.budgetMin, campaign.currency as "INR" | "USD") : `${formatCurrency(campaign.budgetMin, campaign.currency as "INR" | "USD")} - ${formatCurrency(campaign.budgetMax, campaign.currency as "INR" | "USD")}`}
              </span>
            </div>
            {hasCollaborators && (
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <Users className="h-4 w-4 shrink-0 text-[#0284C7]" />
                <span className="flex-1 text-[12px] text-neutral-500">Collaborations</span>
                <span className="text-[12.5px] font-bold text-neutral-900">
                  {campaign.collaboratorsMin || 1}–{campaign.collaboratorsMax || campaign.collaboratorsMin} Influencers
                </span>
              </div>
            )}
            {campaign.deliverables && (
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-[#10B981]" />
                <span className="flex-1 truncate text-[12px] text-neutral-500">Content Required</span>
                <span className="truncate text-[12.5px] font-bold text-neutral-900">{campaign.deliverables}</span>
              </div>
            )}
            {hasDuration && (
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <CalendarRange className="h-4 w-4 shrink-0 text-[#D97706]" />
                <span className="flex-1 text-[12px] text-neutral-500">Duration</span>
                <span className="text-[12.5px] font-bold text-neutral-900">
                  {new Date(campaign.startDate!).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} –{" "}
                  {new Date(campaign.endDate!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
            {!!countdown && (
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <Timer className="h-4 w-4 shrink-0 text-[#EC4899]" />
                <span className="flex-1 text-[12px] text-neutral-500">Applications End In</span>
                <span className="text-[12.5px] font-bold text-[#6366F1]">{countdown}</span>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-neutral-500">
            {hasTargetAge && (
              <span>
                <span className="font-semibold text-neutral-700">Target Audience:</span> {campaign.targetAgeMin ?? "—"}-{campaign.targetAgeMax ?? "—"} yrs
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {campaign.location}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <span className="flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 py-2.5 text-[12.5px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-50">
              View Details
            </span>
            <span className="flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 py-2.5 text-[12.5px] font-semibold text-white transition-colors">
              Apply Now <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

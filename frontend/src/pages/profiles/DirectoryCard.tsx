import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  MapPin,
  Star,
  BadgeCheck,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Users,
  Eye,
  Loader2,
  Send,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Twitter,
  Music2,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName, formatCompactNumber } from "@/lib/utils";
import type { ProfileSocialLink } from "@/types";

// Same lookup as InfluencerCard/CampaignCard's PLATFORM_META — any platform
// name not in this list still renders, just with a generic globe icon, since
// socialLinks is a free-form list (see ProfileSocialLink).
const PLATFORM_META: Record<string, { icon: LucideIcon; color: string }> = {
  instagram: { icon: Instagram, color: "#E1306C" },
  youtube: { icon: Youtube, color: "#FF0000" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  twitter: { icon: Twitter, color: "#171717" },
  x: { icon: Twitter, color: "#171717" },
  "x (twitter)": { icon: Twitter, color: "#171717" },
  tiktok: { icon: Music2, color: "#171717" },
  facebook: { icon: Facebook, color: "#1877F2" },
  whatsapp: { icon: Globe, color: "#25D366" },
};

function platformMeta(name: string) {
  return PLATFORM_META[name.trim().toLowerCase()] ?? { icon: Globe, color: "#525252" };
}

// Shared grid tile for the Brands/Agencies/Talent Partners directory pages —
// same card shape for all three, just a different `to` and `stat` line per
// role (industry+followers / agency type+team size / partner type).
// categories/totalCampaignsCount/hiredInfluencersCount/totalReach/website/
// socialLinks are optional — all three roles can now pass them.
export function DirectoryCard({
  id,
  to,
  name,
  avatar,
  headline,
  location,
  isVerified,
  rating,
  reviewCount,
  stat,
  categories,
  totalCampaignsCount,
  hiredInfluencersCount,
  totalReach,
  website,
  socialLinks,
}: {
  id: string;
  to: string;
  name: string;
  avatar?: string;
  headline?: string;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  stat?: string;
  categories?: string[];
  totalCampaignsCount?: number;
  hiredInfluencersCount?: number;
  totalReach?: number;
  website?: string;
  socialLinks?: ProfileSocialLink[];
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnCard = user?.id === id;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  const stopAndRun = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const links = [
    ...(website ? [{ url: website, icon: Globe, label: "Website", color: "#525252" }] : []),
    ...(socialLinks ?? [])
      .filter((l) => l.url)
      .map((l) => ({ url: l.url, ...platformMeta(l.platform), label: l.platform || "Link" })),
  ];

  const visibleCategories = categories?.slice(0, 3) ?? [];
  const extraCategoryCount = Math.max((categories?.length ?? 0) - visibleCategories.length, 0);

  // Every number here comes straight from Campaigns/Applications (see
  // publicProfile.controller.js) — nothing self-reported or estimated.
  const stats = [
    { icon: ShoppingBag, color: "#8B5CF6", value: totalCampaignsCount, label: "Campaigns" },
    { icon: Users, color: "#10B981", value: hiredInfluencersCount, label: "Influencers" },
    { icon: Eye, color: "#0284C7", value: totalReach, label: "Reach" },
  ].filter((s) => !!s.value);
  // Tailwind needs literal class names (not a template string) to pick them
  // up — a fixed grid-cols-3 left empty tracks whenever fewer than 3 stats
  // had real data, so the row divides evenly by however many actually show.
  const STATS_GRID_COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

  return (
    <Link
      key={id}
      to={to}
      className="relative flex flex-col rounded-[22px] border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.18)]"
    >
      <div className="flex items-start gap-3.5">
        <Avatar className="h-[72px] w-[72px] shrink-0 rounded-2xl border border-neutral-100">
          <AvatarImage src={avatar} alt={name} className="rounded-2xl" />
          <AvatarFallback className="rounded-2xl bg-neutral-900 text-lg text-white">{initialsFromName(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {isVerified && (
            <span className="mb-1 flex w-fit items-center gap-1 rounded-full bg-[#6366F1]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6366F1]">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
          <p className="flex items-center gap-1.5 truncate text-[16px] font-bold text-neutral-900">
            {name}
            {isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#3B82F6]" />}
          </p>
          {(stat || headline) && <p className="truncate text-[12.5px] font-medium text-[#6366F1]">{stat || headline}</p>}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {location && (
              <span className="flex items-center gap-1 text-[12px] text-neutral-400">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            )}
            <span className="flex items-center gap-1 text-[12px] text-neutral-500">
              <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" /> {reviewCount ? `${rating?.toFixed(1)} (${reviewCount} Reviews)` : "No reviews yet"}
            </span>
          </div>
        </div>
      </div>

      {visibleCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleCategories.map((c) => (
            <Badge key={c} variant="secondary" className="text-[11px]">
              {c}
            </Badge>
          ))}
          {extraCategoryCount > 0 && (
            <Badge variant="outline" className="text-[11px]">
              +{extraCategoryCount}
            </Badge>
          )}
        </div>
      )}

      {stats.length > 0 && (
        <div className={`mt-3 grid gap-2.5 ${STATS_GRID_COLS[stats.length]}`}>
          {stats.map(({ icon: Icon, color, value, label }) => (
            <div key={label} className="rounded-2xl border border-neutral-100 p-2.5 text-center">
              <Icon className="mx-auto h-4 w-4" style={{ color }} />
              <p className="mt-1 text-[13px] font-bold text-neutral-900">{formatCompactNumber(value!)}+</p>
              <p className="text-[10.5px] text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3">
          {links.map(({ url, icon: Icon, label, color }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              onClick={(e) => stopAndRun(e, () => window.open(url, "_blank", "noopener,noreferrer"))}
              style={{ borderColor: color, color }}
              className="flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2.5 border-t border-neutral-100 pt-3">
        <span className="flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 py-2 text-[12.5px] font-semibold text-white transition-colors">
          View Profile <ArrowRight className="h-3.5 w-3.5" />
        </span>
        {!isOwnCard && (
          <button
            type="button"
            disabled={messageMutation.isPending}
            onClick={(e) => stopAndRun(e, () => (user ? messageMutation.mutate() : navigate("/login")))}
            className="flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 py-2 text-[12.5px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Contact
          </button>
        )}
      </div>
    </Link>
  );
}

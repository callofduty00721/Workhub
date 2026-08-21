import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  MapPin,
  ArrowRight,
  Send,
  Users,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Facebook,
  Music2,
  Globe,
  Loader2,
  BadgeCheck,
  Star,
  ExternalLink,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { formatCompactNumber, initialsFromName, getFollowerTier } from "@/lib/utils";
import type { InfluencerSummary } from "@/types";

// Real brand colors, flat (no gradients) — matched case-insensitively since
// `platform` is free text on the model, not a fixed enum. Anything unlisted
// falls back to a plain neutral chip rather than guessing a color.
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

export function InfluencerCard({ influencer }: { influencer: InfluencerSummary }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const platforms = influencer.influencerProfile?.platforms ?? [];
  // The list endpoint now sums this server-side (see listInfluencers'
  // totalFollowers aggregation); fall back to a local sum for any caller
  // that only has a plain profile fetch (no aggregation) to work with.
  const totalFollowers = influencer.totalFollowers ?? platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
  const byFollowers = [...platforms].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
  const followerTier = getFollowerTier(totalFollowers);
  const isOwnCard = user?.id === influencer._id;

  // Cap the list so every card in a grid stays the same height no matter how
  // many platforms an influencer has added — extras collapse into a "+N
  // more" row instead of growing the card. Full list is on the profile page.
  const MAX_VISIBLE_PLATFORMS = 2;
  const visiblePlatforms = byFollowers.slice(0, MAX_VISIBLE_PLATFORMS);
  const hiddenPlatformCount = byFollowers.length - visiblePlatforms.length;

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(influencer._id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  const stopAndRun = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <Link to={`/influencers/${influencer._id}`} className="block h-full">
      <div className="relative flex h-full flex-col rounded-[22px] border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.18)]">
        {/* Stacked on the right so neither ever overlaps the avatar (which
            sits top-left, pulled up by -mt-3) or each other — the badge is
            only shown when it deviates from the assumed-available default,
            the button only for viewers who can actually save an influencer
            (see SaveButton's own role check), so this container can hold
            zero, one, or both. */}
        <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
          {influencer.availabilityStatus === "busy" && (
            <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-bold text-warning">Not Taking Campaigns</span>
          )}
          <SaveButton type="influencer" id={influencer._id} />
        </div>
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="h-16 w-16 -mt-3 rounded-full p-[2px]"
              style={{ background: "conic-gradient(from 180deg, #F59E0B, #EC4899, #8B5CF6, #3B82F6, #F59E0B)" }}
            >
              <Avatar className="h-full w-full border-2  border-white">
                <AvatarImage src={influencer.avatar} alt={influencer.name} />
                <AvatarFallback className="bg-neutral-900 text-lg text-white">{initialsFromName(influencer.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 -mt-3 truncate text-[19px] font-bold leading-tight text-neutral-900">
              {influencer.name}
              {influencer.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#3B82F6]" />}
            </p>
            <p className="truncate text-[12px] font-medium text-[#6366F1]">
              {influencer.influencerProfile?.niche || influencer.influencerProfile?.category || influencer.headline || "Influencer"}
              {followerTier && <span className="text-neutral-400"> · {followerTier}</span>}
            </p>
            {/* Reserved slot — rendered invisible (not omitted) when absent so
                cards without a location don't pull everything below them up
                and misalign against cards that have one. */}
            <span className={`mt-0.5 flex items-center gap-1 text-[12px] text-neutral-400 ${influencer.location ? "" : "invisible"}`}>
              <MapPin className="h-3 w-3" /> {influencer.location || "—"}
            </span>
          </div>
        </div>

        {/* Same reserved-slot approach for bio — two lines tall either way. */}
        <p className={`mt-3 line-clamp-2 min-h-[36px] text-[12px] leading-relaxed text-neutral-500 ${influencer.bio ? "" : "invisible"}`}>
          {influencer.bio || "—"}
        </p>

        {/* Real stats only — rating/reviewCount are the same cached fields
            recomputed by review.controller.js on every review create/delete
            (Review.targetType "user" applies to any role, influencers
            included); "—" shown honestly when there are zero reviews yet. No
            invented "reach" figure distinct from the real, summed follower
            count either. */}
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-neutral-100 bg-white p-2 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Users className="mx-auto h-5 w-5 text-[#8B5CF6]" />
            <p className="mt-1 text-[13px] font-bold text-neutral-900">{totalFollowers > 0 ? formatCompactNumber(totalFollowers) : "—"}</p>
            <p className="text-[11px] text-neutral-500">Followers</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-2 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Megaphone className="mx-auto h-5 w-5 text-[#0284C7]" />
            <p className="mt-1 text-[13px] font-bold text-neutral-900">{influencer.campaignsCompleted ?? 0}</p>
            <p className="text-[11px] text-neutral-500">Campaigns</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-2 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Star className="mx-auto h-5 w-5 text-[#F59E0B]" />
            <p className="mt-1 text-[13px] font-bold text-neutral-900">
              {influencer.reviewCount ? `${influencer.rating?.toFixed(1)}/5` : "—"}
            </p>
            <p className="text-[11px] text-neutral-500">Rating</p>
          </div>
        </div>

        {/* Social Presence always renders exactly MAX_VISIBLE_PLATFORMS row
            slots plus one "more" row — real content when present, an
            invisible placeholder of identical size when not. That's what
            keeps every card the same height whether an influencer has 0, 1,
            2, or 6 platforms, instead of the block growing/shrinking with
            real data and knocking the buttons row out of alignment across
            the grid. */}
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-neutral-900">Social Presence</p>
            <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-medium text-neutral-500">
              {platforms.length} Platform{platforms.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
            {Array.from({ length: MAX_VISIBLE_PLATFORMS }, (_, i) => visiblePlatforms[i] ?? null).map((p, i) => {
              if (!p) {
                return i === 0 && byFollowers.length === 0 ? (
                  <div key={i} className="flex h-[52px] items-center justify-center text-[12px] text-neutral-400">
                    No platforms added yet
                  </div>
                ) : (
                  <div key={i} className="invisible flex h-[52px] items-center gap-2 px-3 py-1.5" aria-hidden="true" />
                );
              }
              const meta = platformMeta(p.platform);
              const Icon = meta.icon;
              const unit = p.platform.trim().toLowerCase() === "youtube" ? "Subscribers" : "Followers";
              return (
                <div key={i} className="flex h-[52px] items-center gap-2 px-3 py-1.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-neutral-900">{p.platform}</p>
                    {p.handle && <p className="truncate text-[12px] text-neutral-400">{p.handle}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] font-bold text-neutral-900">{p.followers ? formatCompactNumber(p.followers) : "—"}</p>
                    <p className="text-[11px] text-neutral-400">{unit}</p>
                  </div>
                  {p.url && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(p.url, "_blank", "noopener,noreferrer");
                      }}
                      style={{ borderColor: meta.color, color: meta.color }}
                      className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition-transform hover:scale-105"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <div className={`flex h-8 items-center justify-center text-[11.5px] font-semibold text-neutral-400 ${hiddenPlatformCount > 0 ? "" : "invisible"}`}>
              +{hiddenPlatformCount || 1} more platform{hiddenPlatformCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Audience breakdown — real per-platform share of the same follower
            total shown above, not a separately-invented "reach" metric.
            Always rendered (never removed) so cards without follower data
            don't end up shorter than ones with it — an empty state fills
            the same fixed-height slot instead. */}
        <div className="mt-2.5 rounded-2xl border border-neutral-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-neutral-900">Audience Breakdown</p>
            <p className="text-[12px] font-bold text-neutral-900">{totalFollowers > 0 ? formatCompactNumber(totalFollowers) : "—"}</p>
          </div>
          {totalFollowers > 0 ? (
            <>
              <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                {byFollowers.map((p, i) => {
                  const pct = ((p.followers ?? 0) / totalFollowers) * 100;
                  if (pct <= 0) return null;
                  return <div key={i} style={{ width: `${pct}%`, backgroundColor: platformMeta(p.platform).color }} className="h-full" />;
                })}
              </div>
              <div className="mt-3 flex h-[14px] flex-wrap gap-x-4 gap-y-1.5">
                {visiblePlatforms.map((p, i) => {
                  const pct = Math.round(((p.followers ?? 0) / totalFollowers) * 100);
                  if (pct <= 0) return null;
                  return (
                    <span key={i} className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: platformMeta(p.platform).color }} />
                      {p.platform} <span className="font-semibold text-neutral-700">{pct}%</span>
                    </span>
                  );
                })}
                {hiddenPlatformCount > 0 && (
                  <span className="text-[10px] font-semibold text-neutral-400">+{hiddenPlatformCount} more</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 h-2 w-full rounded-full bg-neutral-100" />
              <div className="mt-3 flex h-[14px] items-center text-[10px] text-neutral-400">No audience data yet</div>
            </>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <span className="flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 py-3 text-[13px] font-semibold text-white transition-colors">
            View Profile <ArrowRight className="h-3.5 w-3.5" />
          </span>
          {!isOwnCard && (
            <button
              type="button"
              disabled={messageMutation.isPending}
              onClick={(e) => stopAndRun(e, () => (user ? messageMutation.mutate() : navigate("/login")))}
              className="flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 py-1.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Collaborate
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

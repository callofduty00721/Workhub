import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  MapPin,
  MessageSquare,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Globe,
  CalendarDays,
  Copy,
  Users,
  Megaphone,
  Image as ImageIcon,
  Star,
  BadgeCheck,
  Award,
  Building2,
  TrendingUp,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Facebook,
  Music2,
  Send,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { influencerApi } from "@/api/influencers";
import { InviteToCampaignDialog } from "./InviteToCampaignDialog";
import { SaveButton } from "@/components/shared/SaveButton";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { usePageMeta } from "@/lib/usePageMeta";
import { chatApi } from "@/api/chat";
import { formatCompactNumber, initialsFromName, getFollowerTier } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";
import { CAMPAIGN_HIRER_ROLES } from "@/lib/roles";

const PLATFORM_META: Record<string, { icon: LucideIcon; color: string }> = {
  instagram: { icon: Instagram, color: "#E1306C" },
  youtube: { icon: Youtube, color: "#FF0000" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  twitter: { icon: Twitter, color: "#111111" },
  x: { icon: Twitter, color: "#111111" },
  "x (twitter)": { icon: Twitter, color: "#111111" },
  tiktok: { icon: Music2, color: "#111111" },
  facebook: { icon: Facebook, color: "#1877F2" },
};

const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  conversational: "Conversational",
  fluent: "Fluent",
  native: "Native",
};

function platformMeta(name: string) {
  return PLATFORM_META[name.trim().toLowerCase()] ?? { icon: Globe, color: "#6B7280" };
}

export default function InfluencerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: influencer, isLoading } = useQuery({
    queryKey: ["influencers", id],
    queryFn: () => influencerApi.getProfile(id),
    enabled: !!id,
  });

  usePageMeta(
    influencer ? `${influencer.name} — ${influencer.influencerProfile?.niche || influencer.headline || "Influencer"}` : "Influencer Profile",
    influencer ? `Collaborate with ${influencer.name} on GrowHive.` : undefined
  );

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(id),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  if (isLoading) {
    return (
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-40 w-full rounded-[20px] bg-[#EDEFEA]" />
        </div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Influencer not found</p>
        <Link
          to="/influencers"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const platforms = influencer.influencerProfile?.platforms ?? [];
  const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
  const byFollowers = [...platforms].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
  const contentSamples = influencer.influencerProfile?.contentSamples ?? [];
  const pastCollaborations = [...(influencer.verifiedCollaborations ?? []), ...(influencer.influencerProfile?.pastCollaborations ?? [])];
  const rateCard = influencer.influencerProfile?.rateCard ?? [];
  const tags = [influencer.influencerProfile?.category, influencer.influencerProfile?.niche].filter(Boolean) as string[];
  const languages = influencer.influencerProfile?.languages ?? [];
  const tagline = influencer.influencerProfile?.niche || influencer.headline || "Influencer";
  const followerTier = getFollowerTier(totalFollowers);
  const canInvite = !!user && user.id !== influencer._id && !!user.role && CAMPAIGN_HIRER_ROLES.includes(user.role);
  const isOwnProfile = user?.id === influencer._id;

  const copyProfileLink = () => navigator.clipboard.writeText(window.location.href);

  const nameRow = (variant: "sidebar" | "header") => (
    <p className={variant === "sidebar" ? "flex items-center justify-center gap-1.5 text-[19px] font-extrabold text-[#111111]" : "flex items-center gap-1.5 text-[22px] font-extrabold text-[#111111]"}>
      {influencer.name}
      {influencer.isVerified && <BadgeCheck className={variant === "sidebar" ? "h-4 w-4 shrink-0 text-[#2563EB]" : "h-5 w-5 shrink-0 text-[#2563EB]"} />}
    </p>
  );

  return (
    <div className="bg-[#F7F8F5]">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/influencers" className="hover:text-[#111111]">
            Influencers
          </Link>{" "}
          / <span className="text-[#6B7280]">{influencer.name}</span>
        </nav>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-3 mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
          {/* LEFT — profile card */}
          <div className="overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white lg:sticky lg:top-24">
            <div className="h-24 bg-gradient-to-br from-[#F1FFD6] to-[#F7F8F5]" />
            <div className="px-6 pb-6 text-center">
              <div className="relative -mt-12 inline-block">
                <Avatar className="h-24 w-24 border-4 border-white">
                  <AvatarImage src={influencer.avatar} alt={influencer.name} />
                  <AvatarFallback className="bg-[#111111] text-2xl text-white">{initialsFromName(influencer.name)}</AvatarFallback>
                </Avatar>
                {influencer.isVerified && (
                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] ring-2 ring-white">
                    <BadgeCheck className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
              </div>

              <div className="mt-3">{nameRow("sidebar")}</div>
              <p className="text-[13px] font-medium text-[#6B7280]">{tagline}</p>
              {influencer.location && (
                <span className="mt-1 flex items-center justify-center gap-1 text-[12px] text-[#9CA3AF]">
                  <MapPin className="h-3.5 w-3.5" /> {influencer.location}
                </span>
              )}

              {influencer.bio && (
                <p className="mt-3 text-left text-[12.5px] leading-relaxed text-[#6B7280]" dangerouslySetInnerHTML={{ __html: renderBioHtml(influencer.bio) }} />
              )}

              {(influencer.socialLinks?.website || influencer.createdAt) && (
                <>
                  <div className="my-4 border-t border-[#F1F3EF]" />
                  <div className="space-y-2.5 text-left">
                    {influencer.socialLinks?.website && (
                      <a href={influencer.socialLinks.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12.5px] text-[#6B7280] hover:text-[#111111]">
                        <Globe className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{influencer.socialLinks.website}</span>
                      </a>
                    )}
                    <p className="flex items-center gap-2 text-[12.5px] text-[#6B7280]">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      Joined {new Date(influencer.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </>
              )}

              {tags.length > 0 && (
                <>
                  <div className="my-4 border-t border-[#F1F3EF]" />
                  <p className="mb-2 text-left text-[12px] font-bold text-[#111111]">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {languages.length > 0 && (
                <>
                  <div className="my-4 border-t border-[#F1F3EF]" />
                  <p className="mb-2 text-left text-[12px] font-bold text-[#111111]">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((l, i) => (
                      <span key={i} className="rounded-full border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                        {l.name} <span className="ml-1 text-[#9CA3AF]">· {LANGUAGE_LEVEL_LABELS[l.level]}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}

              {!!influencer.achievements?.length && (
                <>
                  <div className="my-4 border-t border-[#F1F3EF]" />
                  <p className="mb-2 text-left text-[12px] font-bold text-[#111111]">Achievements</p>
                  <div className="space-y-2.5 text-left">
                    {influencer.achievements.map((a, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1F3EF] text-[#6B7280]">
                          <Award className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold text-[#111111]">{a.title}</p>
                          {a.description && <p className="truncate text-[11px] text-[#9CA3AF]">{a.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {influencer.influencerProfile?.mediaKitUrl && (
                <>
                  <div className="my-4 border-t border-[#F1F3EF]" />
                  <a
                    href={influencer.influencerProfile.mediaKitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
                  >
                    <ExternalLink className="h-4 w-4" /> Download Media Kit
                  </a>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — main content */}
          <div className="space-y-6">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {nameRow("header")}
                    {followerTier && <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[11px] font-semibold text-[#4B5563]">{followerTier} Creator</span>}
                    {influencer.availabilityStatus === "busy" && (
                      <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[11px] font-bold text-[#B45309]">Not Taking Campaigns</span>
                    )}
                  </div>
                  <p className="text-[14px] font-medium text-[#6B7280]">{tagline}</p>
                  {influencer.location && (
                    <span className="mt-1 flex items-center gap-1 text-[12.5px] text-[#9CA3AF]">
                      <MapPin className="h-3.5 w-3.5" /> {influencer.location}
                    </span>
                  )}
                  {tags.length > 0 && <p className="mt-1.5 text-[12.5px] text-[#6B7280]">{tags.join(" • ")}</p>}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isOwnProfile ? (
                    <Link
                      to="/dashboard/profile"
                      className="flex items-center gap-1.5 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
                    >
                      <Pencil className="h-4 w-4" /> Edit Profile
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={!user || messageMutation.isPending}
                      onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
                      className="flex items-center gap-1.5 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
                    >
                      {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                      Contact Me
                    </button>
                  )}
                  {canInvite && (
                    <button
                      type="button"
                      onClick={() => setInviteOpen(true)}
                      className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
                    >
                      <Send className="h-4 w-4" /> Invite to Campaign
                    </button>
                  )}
                  {rateCard.length > 0 && (
                    <a href="#rate-card" className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]">
                      Collaboration
                    </a>
                  )}
                  <button
                    type="button"
                    aria-label="Copy profile link"
                    onClick={copyProfileLink}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors hover:bg-[#F1F3EF]"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <SaveButton type="influencer" id={influencer._id} className="h-11 w-11 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
                </div>
              </div>

              {/* Real stats only */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#F1F3EF] pt-6 sm:grid-cols-4">
                <div className="text-center">
                  <Users className="mx-auto h-5 w-5 text-[#8B5CF6]" />
                  <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{totalFollowers > 0 ? formatCompactNumber(totalFollowers) : "—"}</p>
                  <p className="text-[11px] text-[#9CA3AF]">Total Followers</p>
                </div>
                <div className="text-center">
                  <Megaphone className="mx-auto h-5 w-5 text-[#2563EB]" />
                  <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{influencer.campaignsCompleted ?? 0}</p>
                  <p className="text-[11px] text-[#9CA3AF]">Campaigns Completed</p>
                </div>
                <div className="text-center">
                  <ImageIcon className="mx-auto h-5 w-5 text-[#16A34A]" />
                  <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{contentSamples.length || "—"}</p>
                  <p className="text-[11px] text-[#9CA3AF]">Content Samples</p>
                </div>
                <div className="text-center">
                  <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
                  <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{influencer.reviewCount ? `${influencer.rating?.toFixed(1)}/5` : "—"}</p>
                  <p className="text-[11px] text-[#9CA3AF]">Rating ({influencer.reviewCount ?? 0})</p>
                </div>
              </div>

              {(byFollowers.length > 0 || rateCard.length > 0) && (
                <div
                  className={`mt-6 grid items-start gap-6 border-t border-[#F1F3EF] pt-6 ${byFollowers.length > 0 && rateCard.length > 0 ? "lg:grid-cols-[1fr_420px]" : "grid-cols-1"}`}
                >
                  {byFollowers.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-bold text-[#111111]">Social Platforms</h3>
                        <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
                          {platforms.length} Platform{platforms.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="divide-y divide-[#F1F3EF] rounded-xl border border-[#F1F3EF]">
                        {byFollowers.map((p, i) => {
                          const meta = platformMeta(p.platform);
                          const Icon = meta.icon;
                          const unit = p.platform.trim().toLowerCase() === "youtube" ? "Subscribers" : "Followers";
                          return (
                            <div key={i} className="flex items-center gap-3 px-3 py-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: meta.color }}>
                                <Icon className="h-5 w-5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13.5px] font-semibold text-[#111111]">{p.platform}</p>
                                {p.handle && <p className="truncate text-[12px] text-[#9CA3AF]">{p.handle}</p>}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-[14.5px] font-bold text-[#111111]">{p.followers ? formatCompactNumber(p.followers) : "—"}</p>
                                <p className="text-[11px] text-[#9CA3AF]">{unit}</p>
                              </div>
                              {p.url && (
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ borderColor: meta.color, color: meta.color }}
                                  className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-transform hover:scale-105"
                                >
                                  View <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {byFollowers.length > 1 && totalFollowers > 0 && (
                        <div className="mt-5 rounded-xl border border-[#F1F3EF] p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-[#111111]">Audience Breakdown</p>
                            <p className="text-[13px] font-bold text-[#111111]">{formatCompactNumber(totalFollowers)}</p>
                          </div>
                          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[#F1F3EF]">
                            {byFollowers.map((p, i) => {
                              const pct = ((p.followers ?? 0) / totalFollowers) * 100;
                              if (pct <= 0) return null;
                              return <div key={i} style={{ width: `${pct}%`, backgroundColor: platformMeta(p.platform).color }} className="h-full" />;
                            })}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                            {byFollowers.map((p, i) => {
                              const pct = Math.round(((p.followers ?? 0) / totalFollowers) * 100);
                              if (pct <= 0) return null;
                              return (
                                <span key={i} className="flex items-center gap-1.5 text-[11.5px] text-[#6B7280]">
                                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: platformMeta(p.platform).color }} />
                                  {p.platform} <span className="font-semibold text-[#111111]">{pct}%</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {rateCard.length > 0 && (
                    <div id="rate-card">
                      <h3 className="mb-3 text-base font-bold text-[#111111]">Rate Card</h3>
                      <div className="space-y-2">
                        {rateCard.map((r, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm">
                            <div>
                              <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#4B5563]">{r.platform}</span>
                              <span className="ml-2 text-[#6B7280]">{r.contentType}</span>
                            </div>
                            <span className="text-xs font-bold text-[#111111]">₹{r.priceInInr.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {contentSamples.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h3 className="mb-3 text-base font-bold text-[#111111]">Content Samples</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {contentSamples.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-[#F1F3EF] transition-shadow hover:shadow-[0_12px_24px_-14px_rgba(15,23,42,0.25)]">
                      <div className="relative aspect-square bg-[#F1F3EF]">
                        {s.thumbnailUrl ? (
                          <img src={s.thumbnailUrl} alt={s.caption || ""} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#D1D5DB]">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                      {s.caption && <p className="truncate px-2.5 py-2 text-[11.5px] font-medium text-[#4B5563]">{s.caption}</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {pastCollaborations.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h3 className="mb-3 text-base font-bold text-[#111111]">Past Collaborations</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pastCollaborations.map((c, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-[#F1F3EF] p-4">
                      <Avatar className="h-11 w-11 shrink-0 border border-[#E5E7EB]">
                        <AvatarImage src={c.logoUrl} alt={c.brandName} />
                        <AvatarFallback className="bg-[#F1F3EF] text-[#9CA3AF]">
                          <Building2 className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-[#111111]">
                          {c.brandName}
                          {c.verified && (
                            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#ECFDF3] px-1.5 py-0.5 text-[9.5px] font-semibold text-[#16A34A]">
                              <BadgeCheck className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                        </p>
                        {c.description && <p className="mt-0.5 line-clamp-2 text-[12px] text-[#6B7280]">{c.description}</p>}
                        {c.resultMetric && (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                            <TrendingUp className="h-3 w-3" /> {c.resultMetric}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <ReviewsSection targetType="user" targetId={influencer._id} />
            </div>
          </div>
        </div>
      </div>

      {canInvite && <InviteToCampaignDialog influencerId={influencer._id} influencerName={influencer.name} open={inviteOpen} onOpenChange={setInviteOpen} />}
    </div>
  );
}

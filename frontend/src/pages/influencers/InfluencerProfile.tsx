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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

// Same flat brand-color map as InfluencerCard — kept here too rather than
// shared, since this is the only other place it's used.
const PLATFORM_META: Record<string, { icon: LucideIcon; color: string }> = {
  instagram: { icon: Instagram, color: "#E1306C" },
  youtube: { icon: Youtube, color: "#FF0000" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  twitter: { icon: Twitter, color: "#171717" },
  x: { icon: Twitter, color: "#171717" },
  "x (twitter)": { icon: Twitter, color: "#171717" },
  tiktok: { icon: Music2, color: "#171717" },
  facebook: { icon: Facebook, color: "#1877F2" },
};

const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  conversational: "Conversational",
  fluent: "Fluent",
  native: "Native",
};

function platformMeta(name: string) {
  return PLATFORM_META[name.trim().toLowerCase()] ?? { icon: Globe, color: "#525252" };
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
      <div className="container space-y-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Influencer not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/influencers">Back to Directory</Link>
        </Button>
      </div>
    );
  }

  const platforms = influencer.influencerProfile?.platforms ?? [];
  const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers ?? 0), 0);
  const byFollowers = [...platforms].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
  const contentSamples = influencer.influencerProfile?.contentSamples ?? [];
  // Verified (auto, from real released campaign payments) always shown
  // first, then the influencer's own manually-typed entries.
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
    <p
      className={
        variant === "sidebar"
          ? "flex items-center justify-center gap-1.5 text-[19px] font-bold text-neutral-900"
          : "flex items-center gap-1.5 text-[22px] font-bold text-neutral-900"
      }
    >
      {influencer.name}
      {influencer.isVerified && (
        <BadgeCheck className={variant === "sidebar" ? "h-4 w-4 shrink-0 text-[#3B82F6]" : "h-5 w-5 shrink-0 text-[#3B82F6]"} />
      )}
    </p>
  );

  return (
    <div className="container py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        {/* LEFT — profile card. The decorative banner gradient is the one
            deliberate exception to the site's no-gradient rule, same as the
            logo mark; everything below it is real data. */}
        <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white lg:sticky lg:top-24">
          <div className="h-28 bg-gradient-to-br from-amber-400 via-pink-500 to-indigo-500" />
          <div className="px-6 pb-6 text-center">
            <div className="relative -mt-14 inline-block">
            
              <Avatar className="h-24 w-24 border-4 border-white">
                <AvatarImage src={influencer.avatar} alt={influencer.name} />
                <AvatarFallback className="bg-neutral-900 text-2xl text-white">{initialsFromName(influencer.name)}</AvatarFallback>
              </Avatar>
              {influencer.isVerified && (
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#3B82F6] ring-2 ring-white">
                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </div>

            <div className="mt-3">{nameRow("sidebar")}</div>
            <p className="text-[13px] font-medium text-[#6366F1]">{tagline}</p>
            {influencer.location && (
              <span className="mt-1 flex items-center justify-center gap-1 text-[12px] text-neutral-400">
                <MapPin className="h-3.5 w-3.5" /> {influencer.location}
              </span>
            )}

            {influencer.bio && (
              <p
                className="mt-3 text-left text-[12.5px] leading-relaxed text-neutral-500"
                dangerouslySetInnerHTML={{ __html: renderBioHtml(influencer.bio) }}
              />
            )}

            {(influencer.socialLinks?.website || influencer.createdAt) && (
              <>
                <div className="my-4 border-t border-neutral-100" />
                <div className="space-y-2.5 text-left">
                  {influencer.socialLinks?.website && (
                    <a
                      href={influencer.socialLinks.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[12.5px] text-neutral-500 hover:text-neutral-900"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{influencer.socialLinks.website}</span>
                    </a>
                  )}
                  <p className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    Joined {new Date(influencer.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                </div>
              </>
            )}

            {tags.length > 0 && (
              <>
                <div className="my-4 border-t border-neutral-100" />
                <p className="mb-2 text-left text-[12px] font-semibold text-neutral-900">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[11px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {languages.length > 0 && (
              <>
                <div className="my-4 border-t border-neutral-100" />
                <p className="mb-2 text-left text-[12px] font-semibold text-neutral-900">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l, i) => (
                    <Badge key={i} variant="outline" className="text-[11px]">
                      {l.name} <span className="ml-1 text-neutral-400">· {LANGUAGE_LEVEL_LABELS[l.level]}</span>
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {!!influencer.achievements?.length && (
              <>
                <div className="my-4 border-t border-neutral-100" />
                <p className="mb-2 text-left text-[12px] font-semibold text-neutral-900">Achievements</p>
                <div className="space-y-2.5 text-left">
                  {influencer.achievements.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                        <Award className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-neutral-900">{a.title}</p>
                        {a.description && <p className="truncate text-[11px] text-neutral-400">{a.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {influencer.influencerProfile?.mediaKitUrl && (
              <>
                <div className="my-4 border-t border-neutral-100" />
                <Button variant="outline" className="w-full" asChild>
                  <a href={influencer.influencerProfile.mediaKitUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> Download Media Kit
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — main content */}
        <div className="space-y-6">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {nameRow("header")}
                  {followerTier && (
                    <Badge variant="secondary" className="text-[11px]">
                      {followerTier} Creator
                    </Badge>
                  )}
                  {influencer.availabilityStatus === "busy" && (
                    <Badge variant="warning" className="text-[11px]">
                      Not Taking Campaigns
                    </Badge>
                  )}
                </div>
                <p className="text-[14px] font-medium text-[#6366F1]">{tagline}</p>
                {influencer.location && (
                  <span className="mt-1 flex items-center gap-1 text-[12.5px] text-neutral-400">
                    <MapPin className="h-3.5 w-3.5" /> {influencer.location}
                  </span>
                )}
                {tags.length > 0 && <p className="mt-1.5 text-[12.5px] text-neutral-500">{tags.join(" • ")}</p>}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {isOwnProfile ? (
                  <Button variant="gradient" asChild>
                    <Link to="/dashboard/profile">
                      <Pencil className="h-4 w-4" /> Edit Profile
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="bg-[#6366F1] hover:bg-[#4F46E5]"
                    disabled={!user || messageMutation.isPending}
                    onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
                  >
                    {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Contact Me
                  </Button>
                )}
                {canInvite && (
                  <Button variant="outline" onClick={() => setInviteOpen(true)}>
                    <Send className="h-4 w-4" /> Invite to Campaign
                  </Button>
                )}
                {rateCard.length > 0 && (
                  <Button variant="outline" asChild>
                    <a href="#rate-card">Collaboration</a>
                  </Button>
                )}
                <Button variant="outline" size="icon" aria-label="Copy profile link" onClick={copyProfileLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <SaveButton
                  type="influencer"
                  id={influencer._id}
                  className="h-10 w-10 rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
                />
              </div>
            </div>
          </div>

          {/* Real stats only — no "Total Reach" distinct from the real
              summed follower count, and no invented 30-day growth.
              Campaigns Completed counts released campaign-escrow payments —
              a platform-verified transaction count, not a self-reported
              number (that's what used to be here as "Engagement Rate"). */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Users className="mx-auto h-5 w-5 text-[#8B5CF6]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{totalFollowers > 0 ? formatCompactNumber(totalFollowers) : "—"}</p>
              <p className="text-[11px] text-neutral-500">Total Followers</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Megaphone className="mx-auto h-5 w-5 text-[#0284C7]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{influencer.campaignsCompleted ?? 0}</p>
              <p className="text-[11px] text-neutral-500">Campaigns Completed</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <ImageIcon className="mx-auto h-5 w-5 text-[#10B981]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{contentSamples.length || "—"}</p>
              <p className="text-[11px] text-neutral-500">Content Samples</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Star className="mx-auto h-5 w-5 text-[#F59E0B]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">
                {influencer.reviewCount ? `${influencer.rating?.toFixed(1)}/5` : "—"}
              </p>
              <p className="text-[11px] text-neutral-500">Rating ({influencer.reviewCount ?? 0})</p>
            </div>
          </div>

          {(byFollowers.length > 0 || rateCard.length > 0) && (
            <div className={`grid gap-6 items-start ${byFollowers.length > 0 && rateCard.length > 0 ? "lg:grid-cols-[1fr_500px]" : "grid-cols-1"}`}>
              {byFollowers.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold">Social Platforms</h3>
                      <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                        {platforms.length} Platform{platforms.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
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
                              <p className="truncate text-[13.5px] font-semibold text-neutral-900">{p.platform}</p>
                              {p.handle && <p className="truncate text-[12px] text-neutral-400">{p.handle}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[14.5px] font-bold text-neutral-900">{p.followers ? formatCompactNumber(p.followers) : "—"}</p>
                              <p className="text-[11px] text-neutral-400">{unit}</p>
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
                      <div className="mt-5 rounded-2xl border border-neutral-100 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-semibold text-neutral-900">Audience Breakdown</p>
                          <p className="text-[13px] font-bold text-neutral-900">{formatCompactNumber(totalFollowers)}</p>
                        </div>
                        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
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
                              <span key={i} className="flex items-center gap-1.5 text-[11.5px] text-neutral-500">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: platformMeta(p.platform).color }} />
                                {p.platform} <span className="font-semibold text-neutral-700">{pct}%</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {rateCard.length > 0 && (
                <Card id="rate-card">
                  <CardContent className="p-6">
                    <h3 className="mb-3 text-base font-semibold">Rate Card</h3>
                    <div className="space-y-2">
                      {rateCard.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                          <div>
                            <Badge variant="outline">{r.platform}</Badge>
                            <span className="ml-2 text-muted-foreground">{r.contentType}</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">₹{r.priceInInr.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {contentSamples.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Content Samples</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {contentSamples.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded-2xl border border-neutral-100 transition-shadow hover:shadow-[0_12px_24px_-14px_rgba(15,23,42,0.25)]"
                    >
                      <div className="relative aspect-square bg-neutral-100">
                        {s.thumbnailUrl ? (
                          <img
                            src={s.thumbnailUrl}
                            alt={s.caption || ""}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-300">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                      {s.caption && <p className="truncate px-2.5 py-2 text-[11.5px] font-medium text-neutral-700">{s.caption}</p>}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pastCollaborations.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Past Collaborations</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pastCollaborations.map((c, i) => (
                    <div key={i} className="flex gap-3 rounded-2xl border border-neutral-100 p-4">
                      <Avatar className="h-11 w-11 shrink-0 border border-neutral-100">
                        <AvatarImage src={c.logoUrl} alt={c.brandName} />
                        <AvatarFallback className="bg-neutral-100 text-neutral-400">
                          <Building2 className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-neutral-900">
                          {c.brandName}
                          {c.verified && (
                            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-success">
                              <BadgeCheck className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                        </p>
                        {c.description && <p className="mt-0.5 line-clamp-2 text-[12px] text-neutral-500">{c.description}</p>}
                        {c.resultMetric && (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                            <TrendingUp className="h-3 w-3" /> {c.resultMetric}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <ReviewsSection targetType="user" targetId={influencer._id} />
        </div>
      </div>

      {canInvite && (
        <InviteToCampaignDialog influencerId={influencer._id} influencerName={influencer.name} open={inviteOpen} onOpenChange={setInviteOpen} />
      )}
    </div>
  );
}

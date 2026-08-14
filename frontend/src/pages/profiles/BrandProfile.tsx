import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, Loader2, ArrowLeft, Copy, Users, Megaphone, Star, Building2, Image as ImageIcon, Pencil, BadgeCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { HorizontalSlider } from "@/components/shared/HorizontalSlider";
import { ProfileHeader } from "./ProfileHeader";
import { CampaignCard } from "./CampaignCard";
import { publicProfileApi } from "@/api/publicProfiles";
import { campaignApi } from "@/api/campaigns";
import { chatApi } from "@/api/chat";
import { usePageMeta } from "@/lib/usePageMeta";
import { formatCompactNumber, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function BrandProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: brand, isLoading } = useQuery({
    queryKey: ["public-profiles", "brand", id],
    queryFn: () => publicProfileApi.getBrand(id),
    enabled: !!id,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns", { employer: id }],
    queryFn: () => campaignApi.list({ employer: id, limit: 20 }),
    enabled: !!id,
  });

  usePageMeta(brand ? `${brand.name} — ${brand.brandProfile?.industry || "Brand"}` : "Brand Profile", brand ? `Collaborate with ${brand.name} on GrowHive.` : undefined);

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(id),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Brand not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  const isOwnProfile = user?.id === brand._id;
  const tagline = brand.brandProfile?.industry || brand.headline || "Brand";
  const products = brand.brandProfile?.products ?? [];
  const requirements = brand.brandProfile?.influencerRequirements ?? [];
  // Verified (auto, from real released campaign payments) always shown
  // first, then the brand's own manually-typed entries.
  const pastCollaborations = [...(brand.verifiedCollaborations ?? []), ...(brand.brandProfile?.pastCollaborations ?? [])];
  const copyProfileLink = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="container py-10">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        <ProfileHeader
          name={brand.name}
          avatar={brand.avatar}
          isVerified={brand.isVerified}
          tagline={tagline}
          location={brand.location}
          bio={brand.bio}
          website={brand.brandProfile?.website}
          createdAt={brand.createdAt}
          extra={
            brand.company?.name ? (
              <p className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                <Building2 className="h-3.5 w-3.5 shrink-0" /> {brand.company.name}
              </p>
            ) : undefined
          }
          cta={
            isOwnProfile ? (
              <Button className="w-full" variant="gradient" asChild>
                <Link to="/dashboard/profile">
                  <Pencil className="h-4 w-4" /> Edit Profile
                </Link>
              </Button>
            ) : (
              <Button
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5]"
                disabled={!user || messageMutation.isPending}
                onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              >
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Contact Brand
              </Button>
            )
          }
        />

        <div className="space-y-6">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-[22px] font-bold text-neutral-900">{brand.name}</p>
                <p className="text-[14px] font-medium text-[#6366F1]">{tagline}</p>
                {brand.location && (
                  <span className="mt-1 flex items-center gap-1 text-[12.5px] text-neutral-400">
                    <MapPin className="h-3.5 w-3.5" /> {brand.location}
                  </span>
                )}
              </div>
              <Button variant="outline" size="icon" aria-label="Copy profile link" onClick={copyProfileLink} className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Users className="mx-auto h-5 w-5 text-[#8B5CF6]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">
                {brand.brandProfile?.followerCount ? formatCompactNumber(brand.brandProfile.followerCount) : "—"}
              </p>
              <p className="text-[11px] text-neutral-500">Followers</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Megaphone className="mx-auto h-5 w-5 text-[#0284C7]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{campaigns?.pagination.total ?? 0}</p>
              <p className="text-[11px] text-neutral-500">Active Campaigns</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Star className="mx-auto h-5 w-5 text-[#F59E0B]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{brand.reviewCount ? `${brand.rating?.toFixed(1)}/5` : "—"}</p>
              <p className="text-[11px] text-neutral-500">Rating ({brand.reviewCount ?? 0})</p>
            </div>
          </div>

          {products.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Products & Services</h3>
                <HorizontalSlider itemClassName="w-56">
                  {products.map((p, i) => (
                    <div
                      key={i}
                      className="group overflow-hidden rounded-2xl border border-neutral-100 transition-shadow hover:shadow-[0_12px_24px_-14px_rgba(15,23,42,0.25)]"
                    >
                      <div className="relative aspect-[4/3] bg-neutral-100">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-300">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="text-[13.5px] font-semibold text-neutral-900">{p.name}</p>
                        {p.description && <p className="mt-1 line-clamp-2 text-[12px] text-neutral-500">{p.description}</p>}
                      </div>
                    </div>
                  ))}
                </HorizontalSlider>
              </CardContent>
            </Card>
          )}

          {requirements.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Influencer Requirements</h3>
                <div className="space-y-2">
                  {requirements.map((r, i) => (
                    <div key={i} className="rounded-lg border border-border px-4 py-3 text-sm">
                      <p className="font-semibold">{r.category || "Any category"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[r.minFollowers ? `${r.minFollowers.toLocaleString("en-IN")}+ followers` : null, r.platforms?.join(", "), r.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {r.notes && <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 text-base font-semibold">Campaigns</h3>
              {!campaigns?.data.length ? (
                <p className="text-sm text-muted-foreground">No open campaigns right now.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {campaigns.data.map((c) => (
                    <CampaignCard key={c._id} campaign={c} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {pastCollaborations.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Past Collaborations</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pastCollaborations.map((c, i) => (
                    <div key={i} className="flex gap-3 rounded-2xl border border-neutral-100 p-4">
                      <Avatar className="h-11 w-11 shrink-0 border border-neutral-100">
                        <AvatarImage src={c.logoUrl} alt={c.brandName} />
                        <AvatarFallback className="bg-neutral-100 text-neutral-500">{initialsFromName(c.brandName)}</AvatarFallback>
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

          <ReviewsSection targetType="user" targetId={brand._id} />
        </div>
      </div>
    </div>
  );
}

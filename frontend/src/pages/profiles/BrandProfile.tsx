import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, Loader2, ArrowLeft, Copy, Users, Megaphone, Star, Building2, Image as ImageIcon, Pencil, BadgeCheck, TrendingUp } from "lucide-react";
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
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-40 w-full rounded-[20px] bg-[#EDEFEA]" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Brand not found</p>
        <Link
          to="/brands"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Brands
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === brand._id;
  const tagline = brand.brandProfile?.industry || brand.headline || "Brand";
  const products = brand.brandProfile?.products ?? [];
  const requirements = brand.brandProfile?.influencerRequirements ?? [];
  const pastCollaborations = [...(brand.verifiedCollaborations ?? []), ...(brand.brandProfile?.pastCollaborations ?? [])];
  const copyProfileLink = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="bg-[#F7F8F5]">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/brands" className="hover:text-[#111111]">
            Brands
          </Link>{" "}
          / <span className="text-[#6B7280]">{brand.name}</span>
        </nav>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-3 mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back
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
                <p className="flex items-center gap-2 text-[12.5px] text-[#6B7280]">
                  <Building2 className="h-3.5 w-3.5 shrink-0" /> {brand.company.name}
                </p>
              ) : undefined
            }
            cta={
              isOwnProfile ? (
                <Link
                  to="/dashboard/profile"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#111111] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
                >
                  <Pencil className="h-4 w-4" /> Edit Profile
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={!user || messageMutation.isPending}
                  onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#111111] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
                >
                  {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  Contact Brand
                </button>
              )
            }
          />

          <div className="space-y-6">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-[22px] font-extrabold text-[#111111]">{brand.name}</p>
                  <p className="text-[14px] font-medium text-[#6B7280]">{tagline}</p>
                  {brand.location && (
                    <span className="mt-1 flex items-center gap-1 text-[12.5px] text-[#9CA3AF]">
                      <MapPin className="h-3.5 w-3.5" /> {brand.location}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Copy profile link"
                  onClick={copyProfileLink}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors hover:bg-[#F1F3EF]"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Users className="mx-auto h-5 w-5 text-[#8B5CF6]" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{brand.brandProfile?.followerCount ? formatCompactNumber(brand.brandProfile.followerCount) : "—"}</p>
                <p className="text-[11px] text-[#9CA3AF]">Followers</p>
              </div>
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Megaphone className="mx-auto h-5 w-5 text-[#2563EB]" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{campaigns?.pagination.total ?? 0}</p>
                <p className="text-[11px] text-[#9CA3AF]">Active Campaigns</p>
              </div>
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{brand.reviewCount ? `${brand.rating?.toFixed(1)}/5` : "—"}</p>
                <p className="text-[11px] text-[#9CA3AF]">Rating ({brand.reviewCount ?? 0})</p>
              </div>
            </div>

            {products.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Products & Services</h2>
                <HorizontalSlider itemClassName="w-56">
                  {products.map((p, i) => (
                    <div key={i} className="group overflow-hidden rounded-xl border border-[#F1F3EF] transition-shadow hover:shadow-[0_12px_24px_-14px_rgba(15,23,42,0.25)]">
                      <div className="relative aspect-[4/3] bg-[#F1F3EF]">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#D1D5DB]">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="text-[13.5px] font-semibold text-[#111111]">{p.name}</p>
                        {p.description && <p className="mt-1 line-clamp-2 text-[12px] text-[#6B7280]">{p.description}</p>}
                      </div>
                    </div>
                  ))}
                </HorizontalSlider>
              </div>
            )}

            {requirements.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Influencer Requirements</h2>
                <div className="space-y-2">
                  {requirements.map((r, i) => (
                    <div key={i} className="rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm">
                      <p className="font-semibold text-[#111111]">{r.category || "Any category"}</p>
                      <p className="mt-0.5 text-xs text-[#6B7280]">
                        {[r.minFollowers ? `${r.minFollowers.toLocaleString("en-IN")}+ followers` : null, r.platforms?.join(", "), r.location].filter(Boolean).join(" · ")}
                      </p>
                      {r.notes && <p className="mt-1 text-xs text-[#6B7280]">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="mb-3 text-base font-bold text-[#111111]">Campaigns</h2>
              {!campaigns?.data.length ? (
                <p className="text-sm text-[#9CA3AF]">No open campaigns right now.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {campaigns.data.map((c) => (
                    <CampaignCard key={c._id} campaign={c} />
                  ))}
                </div>
              )}
            </div>

            {pastCollaborations.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Past Collaborations</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pastCollaborations.map((c, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-[#F1F3EF] p-4">
                      <Avatar className="h-11 w-11 shrink-0 border border-[#E5E7EB]">
                        <AvatarImage src={c.logoUrl} alt={c.brandName} />
                        <AvatarFallback className="bg-[#F1F3EF] text-[#9CA3AF]">{initialsFromName(c.brandName)}</AvatarFallback>
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
              <ReviewsSection targetType="user" targetId={brand._id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

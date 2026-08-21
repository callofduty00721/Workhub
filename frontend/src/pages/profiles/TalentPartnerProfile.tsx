import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, Loader2, ArrowLeft, Copy, Star, Building2, Handshake, Users, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { ProfileHeader } from "./ProfileHeader";
import { TeamSection } from "./TeamSection";
import { CreatorCard } from "./CreatorCard";
import { publicProfileApi } from "@/api/publicProfiles";
import { talentRosterApi } from "@/api/talentRoster";
import { chatApi } from "@/api/chat";
import { usePageMeta } from "@/lib/usePageMeta";
import { useAuth } from "@/context/AuthContext";

export default function TalentPartnerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: partner, isLoading } = useQuery({
    queryKey: ["public-profiles", "talent_partner", id],
    queryFn: () => publicProfileApi.getTalentPartner(id),
    enabled: !!id,
  });

  const { data: creators } = useQuery({
    queryKey: ["talent-roster", "public", id],
    queryFn: () => talentRosterApi.publicRoster(id),
    enabled: !!id,
  });

  usePageMeta(
    partner ? `${partner.name} — ${partner.talentPartnerProfile?.partnerType || "Talent Partner"}` : "Talent Partner Profile",
    partner ? `${partner.name} on GrowHive.` : undefined
  );

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

  if (!partner) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Talent partner not found</p>
        <Link
          to="/influencers"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Influencers
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === id;
  const tagline = partner.talentPartnerProfile?.partnerType || partner.headline || "Talent Partner";
  const services = partner.talentPartnerProfile?.services ?? [];
  const brandPartnerships = partner.talentPartnerProfile?.brandPartnerships ?? [];
  const copyProfileLink = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="bg-[#F7F8F5]">
      <div className="container py-8">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/influencers" className="hover:text-[#111111]">
            Partners
          </Link>{" "}
          / <span className="text-[#6B7280]">{partner.name}</span>
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
            name={partner.name}
            avatar={partner.avatar}
            isVerified={partner.isVerified}
            tagline={tagline}
            location={partner.location}
            bio={partner.bio}
            website={partner.talentPartnerProfile?.website}
            createdAt={partner.createdAt}
            extra={
              partner.company?.name ? (
                <p className="flex items-center gap-2 text-[12.5px] text-[#6B7280]">
                  <Building2 className="h-3.5 w-3.5 shrink-0" /> {partner.company.name}
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
                  {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
                  Partner With Us
                </button>
              )
            }
          />

          <div className="space-y-6">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[22px] font-extrabold text-[#111111]">{partner.name}</p>
                  <p className="text-[14px] font-medium text-[#6B7280]">{tagline}</p>
                  {partner.location && (
                    <span className="mt-1 flex items-center gap-1 text-[12.5px] text-[#9CA3AF]">
                      <MapPin className="h-3.5 w-3.5" /> {partner.location}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Building2 className="mx-auto h-5 w-5 text-[#8B5CF6]" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{brandPartnerships.length || "—"}</p>
                <p className="text-[11px] text-[#9CA3AF]">Brand Partnerships</p>
              </div>
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{partner.reviewCount ? `${partner.rating?.toFixed(1)}/5` : "—"}</p>
                <p className="text-[11px] text-[#9CA3AF]">Rating ({partner.reviewCount ?? 0})</p>
              </div>
            </div>

            {/* Only ever accepted, consent-given roster rows — see
                talentRoster.controller.js's getPublicRoster. */}
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#111111]">
                <Users className="h-4 w-4" /> Our Creators
              </h2>
              {!creators?.length ? (
                <p className="text-sm text-[#9CA3AF]">No creators on the roster yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {creators.map((c) => (
                    <CreatorCard key={c._id} creator={c} />
                  ))}
                </div>
              )}
            </div>

            {services.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <span key={s} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {brandPartnerships.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Brand Partnerships</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {brandPartnerships.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-[#F1F3EF] px-4 py-3">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.clientName} className="h-9 w-9 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F1F3EF] text-[#9CA3AF]">
                          <Building2 className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#111111]">{c.clientName}</p>
                        {c.description && <p className="truncate text-xs text-[#9CA3AF]">{c.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <TeamSection companyId={partner.company?._id} />

            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <ReviewsSection targetType="user" targetId={partner._id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

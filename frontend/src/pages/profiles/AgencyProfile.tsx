import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Copy, Users, Megaphone, Star, Building2, Search, Handshake, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { ProfileHeader } from "./ProfileHeader";
import { CampaignCard } from "./CampaignCard";
import { TeamSection } from "./TeamSection";
import { CreatorCard } from "./CreatorCard";
import { InviteAgencyDialog } from "./InviteAgencyDialog";
import { publicProfileApi } from "@/api/publicProfiles";
import { campaignApi } from "@/api/campaigns";
import { talentRosterApi } from "@/api/talentRoster";
import { usePageMeta } from "@/lib/usePageMeta";
import { useAuth } from "@/context/AuthContext";

// Roles that could plausibly delegate campaign work to an agency. Mirrors
// agencyClient.routes.js's invite-route authorize() list.
const BRAND_DELEGATOR_ROLES = ["brand", "employer", "client"];

const SERVICE_LABELS: Record<string, string> = {
  influencer_marketing: "Influencer Marketing",
  social_media_marketing: "Social Media Marketing",
  performance_marketing: "Performance Marketing",
  brand_campaigns: "Brand Campaigns",
  ugc: "UGC",
  content_production: "Content Production",
  pr: "PR",
};

export default function AgencyProfile() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const canDelegate = !!user && user.id !== id && !!user.role && BRAND_DELEGATOR_ROLES.includes(user.role);
  const isOwnProfile = user?.id === id;

  const { data: agency, isLoading } = useQuery({
    queryKey: ["public-profiles", "agency", id],
    queryFn: () => publicProfileApi.getAgency(id),
    enabled: !!id,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns", { employer: id }],
    queryFn: () => campaignApi.list({ employer: id, limit: 20 }),
    enabled: !!id,
  });

  const { data: creators } = useQuery({
    queryKey: ["talent-roster", "public", id],
    queryFn: () => talentRosterApi.publicRoster(id),
    enabled: !!id,
  });

  usePageMeta(agency ? `${agency.name} — ${agency.agencyProfile?.agencyType || "Agency"}` : "Agency Profile", agency ? `${agency.name} on GrowHive.` : undefined);

  if (isLoading) {
    return (
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-40 w-full rounded-[20px] bg-[#EDEFEA]" />
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Agency not found</p>
        <Link
          to="/campaigns"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Campaigns
        </Link>
      </div>
    );
  }

  const tagline = agency.agencyProfile?.agencyType || agency.headline || "Agency";
  const services = agency.agencyProfile?.services ?? [];
  const clients = agency.agencyProfile?.clients ?? [];
  const pastCampaigns = agency.agencyProfile?.pastCampaigns ?? [];
  const copyProfileLink = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="bg-[#F7F8F5]">
      <div className="container py-8">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/campaigns" className="hover:text-[#111111]">
            Agencies
          </Link>{" "}
          / <span className="text-[#6B7280]">{agency.name}</span>
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
            name={agency.name}
            avatar={agency.avatar}
            isVerified={agency.isVerified}
            tagline={tagline}
            location={agency.location}
            bio={agency.bio}
            website={agency.agencyProfile?.website}
            createdAt={agency.createdAt}
            extra={
              <div className="space-y-2.5">
                {!!agency.agencyProfile?.teamSize && (
                  <p className="flex items-center gap-2 text-[12.5px] text-[#6B7280]">
                    <Users className="h-3.5 w-3.5 shrink-0" /> {agency.agencyProfile.teamSize} team members
                  </p>
                )}
                {agency.company?.name && (
                  <p className="flex items-center gap-2 text-[12.5px] text-[#6B7280]">
                    <Building2 className="h-3.5 w-3.5 shrink-0" /> {agency.company.name}
                  </p>
                )}
              </div>
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
                <Link
                  to="/influencers"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#111111] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
                >
                  <Search className="h-4 w-4" /> Find Influencers
                </Link>
              )
            }
          />

          <div className="space-y-6">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[22px] font-extrabold text-[#111111]">{agency.name}</p>
                  <p className="text-[14px] font-medium text-[#6B7280]">{tagline}</p>
                  {agency.location && (
                    <span className="mt-1 flex items-center gap-1 text-[12.5px] text-[#9CA3AF]">
                      <MapPin className="h-3.5 w-3.5" /> {agency.location}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canDelegate && (
                    <button
                      type="button"
                      onClick={() => setInviteOpen(true)}
                      className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
                    >
                      <Handshake className="h-4 w-4" /> Invite to Manage
                    </button>
                  )}
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
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Megaphone className="mx-auto h-5 w-5 text-[#2563EB]" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{campaigns?.pagination.total ?? 0}</p>
                <p className="text-[11px] text-[#9CA3AF]">Active Campaigns</p>
              </div>
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Building2 className="mx-auto h-5 w-5 text-[#8B5CF6]" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{clients.length || "—"}</p>
                <p className="text-[11px] text-[#9CA3AF]">Clients Shown</p>
              </div>
              <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 text-center">
                <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="mt-1.5 text-[17px] font-extrabold text-[#111111]">{agency.reviewCount ? `${agency.rating?.toFixed(1)}/5` : "—"}</p>
                <p className="text-[11px] text-[#9CA3AF]">Rating ({agency.reviewCount ?? 0})</p>
              </div>
            </div>

            {services.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <span key={s} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                      {SERVICE_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {clients.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Our Clients</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {clients.map((c, i) => (
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

            {pastCampaigns.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="mb-3 text-base font-bold text-[#111111]">Past Campaigns</h2>
                <div className="space-y-3">
                  {pastCampaigns.map((c, i) => (
                    <div key={i} className="rounded-xl border border-[#F1F3EF] px-4 py-3">
                      <p className="text-sm font-semibold text-[#111111]">{c.brandName}</p>
                      {c.description && <p className="mt-1 text-xs text-[#6B7280]">{c.description}</p>}
                      {c.resultMetric && <p className="mt-1 text-xs font-semibold text-[#16A34A]">{c.resultMetric}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#111111]">
                <Users className="h-4 w-4" /> Creators & Influencers
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

            <TeamSection companyId={agency.company?._id} />

            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <ReviewsSection targetType="user" targetId={agency._id} />
            </div>
          </div>
        </div>
      </div>

      {canDelegate && <InviteAgencyDialog agencyId={agency._id} agencyName={agency.name} open={inviteOpen} onOpenChange={setInviteOpen} />}
    </div>
  );
}

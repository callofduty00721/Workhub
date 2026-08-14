import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Copy, Users, Megaphone, Star, Building2, Search, Handshake, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="container space-y-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Agency not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  const tagline = agency.agencyProfile?.agencyType || agency.headline || "Agency";
  const services = agency.agencyProfile?.services ?? [];
  const clients = agency.agencyProfile?.clients ?? [];
  const pastCampaigns = agency.agencyProfile?.pastCampaigns ?? [];
  const copyProfileLink = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="container py-10">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900">
        ← Back
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
                <p className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                  <Users className="h-3.5 w-3.5 shrink-0" /> {agency.agencyProfile.teamSize} team members
                </p>
              )}
              {agency.company?.name && (
                <p className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                  <Building2 className="h-3.5 w-3.5 shrink-0" /> {agency.company.name}
                </p>
              )}
            </div>
          }
          cta={
            isOwnProfile ? (
              <Button className="w-full" variant="gradient" asChild>
                <Link to="/dashboard/profile">
                  <Pencil className="h-4 w-4" /> Edit Profile
                </Link>
              </Button>
            ) : (
              <Button className="w-full bg-[#6366F1] hover:bg-[#4F46E5]" asChild>
                <Link to="/influencers">
                  <Search className="h-4 w-4" /> Find Influencers
                </Link>
              </Button>
            )
          }
        />

        <div className="space-y-6">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[22px] font-bold text-neutral-900">{agency.name}</p>
                <p className="text-[14px] font-medium text-[#6366F1]">{tagline}</p>
                {agency.location && (
                  <span className="mt-1 flex items-center gap-1 text-[12.5px] text-neutral-400">
                    <MapPin className="h-3.5 w-3.5" /> {agency.location}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canDelegate && (
                  <Button variant="outline" onClick={() => setInviteOpen(true)}>
                    <Handshake className="h-4 w-4" /> Invite to Manage
                  </Button>
                )}
                <Button variant="outline" size="icon" aria-label="Copy profile link" onClick={copyProfileLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Megaphone className="mx-auto h-5 w-5 text-[#0284C7]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{campaigns?.pagination.total ?? 0}</p>
              <p className="text-[11px] text-neutral-500">Active Campaigns</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Building2 className="mx-auto h-5 w-5 text-[#8B5CF6]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{clients.length || "—"}</p>
              <p className="text-[11px] text-neutral-500">Clients Shown</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Star className="mx-auto h-5 w-5 text-[#F59E0B]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{agency.reviewCount ? `${agency.rating?.toFixed(1)}/5` : "—"}</p>
              <p className="text-[11px] text-neutral-500">Rating ({agency.reviewCount ?? 0})</p>
            </div>
          </div>

          {services.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[11px]">
                      {SERVICE_LABELS[s] ?? s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {clients.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Our Clients</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {clients.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.clientName} className="h-9 w-9 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                          <Building2 className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.clientName}</p>
                        {c.description && <p className="truncate text-xs text-muted-foreground">{c.description}</p>}
                      </div>
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

          {pastCampaigns.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Past Campaigns</h3>
                <div className="space-y-3">
                  {pastCampaigns.map((c, i) => (
                    <div key={i} className="rounded-lg border border-border px-4 py-3">
                      <p className="text-sm font-semibold">{c.brandName}</p>
                      {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                      {c.resultMetric && <p className="mt-1 text-xs font-medium text-success">{c.resultMetric}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4" /> Creators & Influencers
              </h3>
              {!creators?.length ? (
                <p className="text-sm text-muted-foreground">No creators on the roster yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {creators.map((c) => (
                    <CreatorCard key={c._id} creator={c} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <TeamSection companyId={agency.company?._id} />

          {/* Portfolio tab lands later — needs its own edit UI first. */}

          <ReviewsSection targetType="user" targetId={agency._id} />
        </div>
      </div>

      {canDelegate && <InviteAgencyDialog agencyId={agency._id} agencyName={agency.name} open={inviteOpen} onOpenChange={setInviteOpen} />}
    </div>
  );
}

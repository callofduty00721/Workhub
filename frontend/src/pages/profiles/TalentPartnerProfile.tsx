import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, Loader2, ArrowLeft, Copy, Star, Building2, Handshake, Users, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="container space-y-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Talent partner not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/influencers">Back to Influencers</Link>
        </Button>
      </div>
    );
  }

  const isOwnProfile = user?.id === id;
  const tagline = partner.talentPartnerProfile?.partnerType || partner.headline || "Talent Partner";
  const services = partner.talentPartnerProfile?.services ?? [];
  const brandPartnerships = partner.talentPartnerProfile?.brandPartnerships ?? [];
  const copyProfileLink = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="container py-10">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back
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
              <p className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                <Building2 className="h-3.5 w-3.5 shrink-0" /> {partner.company.name}
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
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
                Partner With Us
              </Button>
            )
          }
        />

        <div className="space-y-6">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[22px] font-bold text-neutral-900">{partner.name}</p>
                <p className="text-[14px] font-medium text-[#6366F1]">{tagline}</p>
                {partner.location && (
                  <span className="mt-1 flex items-center gap-1 text-[12.5px] text-neutral-400">
                    <MapPin className="h-3.5 w-3.5" /> {partner.location}
                  </span>
                )}
              </div>
              <Button variant="outline" size="icon" aria-label="Copy profile link" onClick={copyProfileLink} className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Building2 className="mx-auto h-5 w-5 text-[#8B5CF6]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{brandPartnerships.length || "—"}</p>
              <p className="text-[11px] text-neutral-500">Brand Partnerships</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Star className="mx-auto h-5 w-5 text-[#F59E0B]" />
              <p className="mt-1.5 text-[17px] font-bold text-neutral-900">{partner.reviewCount ? `${partner.rating?.toFixed(1)}/5` : "—"}</p>
              <p className="text-[11px] text-neutral-500">Rating ({partner.reviewCount ?? 0})</p>
            </div>
          </div>

          {/* Only ever accepted, consent-given roster rows — see
              talentRoster.controller.js's getPublicRoster. */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4" /> Our Creators
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

          {services.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[11px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {brandPartnerships.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Brand Partnerships</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {brandPartnerships.map((c, i) => (
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

          <TeamSection companyId={partner.company?._id} />

          <ReviewsSection targetType="user" targetId={partner._id} />
        </div>
      </div>
    </div>
  );
}

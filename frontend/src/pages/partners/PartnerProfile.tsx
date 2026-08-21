import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, Loader2, BadgeCheck, Globe, Linkedin, Briefcase, Users, Building2, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { partnerApi } from "@/api/partners";
import { chatApi } from "@/api/chat";
import { initialsFromName } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  agency: "Agency",
  company: "Company",
  consultant: "Consultant",
  service_provider: "Service Provider",
  technology_partner: "Technology Partner",
  strategic_partner: "Strategic Partner",
};

const PARTNERSHIP_TYPE_LABELS: Record<string, string> = {
  service: "Service Partnership",
  referral: "Referral Partnership",
  technology: "Technology Partnership",
  strategic: "Strategic Partnership",
  distribution: "Distribution Partnership",
};

export default function PartnerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: partner, isLoading } = useQuery({ queryKey: ["partners", id], queryFn: () => partnerApi.getProfile(id), enabled: !!id });

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

  if (!partner) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Partner not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/partners">Back to Directory</Link>
        </Button>
      </div>
    );
  }

  const stats = [
    { icon: CalendarDays, value: partner.yearsInBusiness, label: "Years in Business" },
    { icon: Briefcase, value: partner.projectsCompleted, label: "Projects Completed" },
    { icon: Users, value: partner.clientsServed, label: "Clients Served" },
    { icon: Building2, value: partner.teamSize, label: "Team Size" },
  ].filter((s) => !!s.value);

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={partner.avatar} alt={partner.name} />
                <AvatarFallback className="text-lg">{initialsFromName(partner.organizationName || partner.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{partner.organizationName || partner.name}</h1>
                  {partner.isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-success" />}
                </div>
                <p className="text-sm text-muted-foreground">Represented by {partner.name}</p>
                {partner.location && (
                  <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {partner.location}
                  </span>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{PARTNER_TYPE_LABELS[partner.partnerType]}</Badge>
                  {partner.companySize && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {partner.companySize} employees
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {partner.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: renderBioHtml(partner.bio) }} />
              </CardContent>
            </Card>
          )}

          {partner.services.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {partner.services.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!!partner.industries?.length && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Industries Served</h3>
                <div className="flex flex-wrap gap-2">
                  {partner.industries.map((i) => (
                    <Badge key={i} variant="secondary">
                      {i}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!!partner.partnershipTypes?.length && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Partnership Types</h3>
                <div className="flex flex-wrap gap-2">
                  {partner.partnershipTypes.map((t) => (
                    <Badge key={t} variant="outline">
                      {PARTNERSHIP_TYPE_LABELS[t] ?? t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {partner.programDetails && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">Program Details</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{partner.programDetails}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((s) => (
                    <div key={s.label} className="rounded-lg border border-border p-3">
                      <s.icon className="h-4 w-4 text-muted-foreground" />
                      <p className="mt-1.5 text-lg font-bold">{s.value}</p>
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {!!partner.startupsSupportedCount && (
                <div>
                  <p className="text-xs text-muted-foreground">Startups Supported</p>
                  <p className="text-lg font-bold">{partner.startupsSupportedCount}</p>
                </div>
              )}
              {(partner.socialLinks?.website || partner.linkedIn || partner.applicationLink) && (
                <div className="flex flex-wrap gap-3 text-xs">
                  {partner.socialLinks?.website && (
                    <a href={partner.socialLinks.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                  {partner.linkedIn && (
                    <a href={partner.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary hover:underline">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                  {partner.applicationLink && (
                    <a href={partner.applicationLink} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                      Inquire
                    </a>
                  )}
                </div>
              )}
              <Button
                className="w-full"
                variant="gradient"
                disabled={!user || messageMutation.isPending}
                onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              >
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Connect
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

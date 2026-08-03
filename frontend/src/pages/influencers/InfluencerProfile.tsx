import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { influencerApi } from "@/api/influencers";
import { chatApi } from "@/api/chat";
import { formatCompactNumber, initialsFromName } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";

export default function InfluencerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: influencer, isLoading } = useQuery({
    queryKey: ["influencers", id],
    queryFn: () => influencerApi.getProfile(id),
    enabled: !!id,
  });

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
  const contentSamples = influencer.influencerProfile?.contentSamples ?? [];
  const pastCollaborations = influencer.influencerProfile?.pastCollaborations ?? [];
  const rateCard = influencer.influencerProfile?.rateCard ?? [];

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={influencer.avatar} alt={influencer.name} />
                <AvatarFallback className="text-lg">{initialsFromName(influencer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold">{influencer.name}</h1>
                <p className="text-sm text-muted-foreground">{influencer.influencerProfile?.niche || influencer.headline || "Influencer"}</p>
                {influencer.influencerProfile?.category && (
                  <Badge variant="secondary" className="mt-1.5 w-fit">
                    {influencer.influencerProfile.category}
                  </Badge>
                )}
                {influencer.location && (
                  <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {influencer.location}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {influencer.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: renderBioHtml(influencer.bio) }} />
              </CardContent>
            </Card>
          )}

          {platforms.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Platforms</h3>
                <div className="space-y-2">
                  {platforms.map((p, i) => {
                    const content = (
                      <>
                        <div>
                          <Badge variant="outline">{p.platform}</Badge>
                          {p.handle && <span className="ml-2 text-muted-foreground">{p.handle}</span>}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {p.followers ? `${formatCompactNumber(p.followers)} followers` : ""}
                        </span>
                      </>
                    );
                    return p.url ? (
                      <a
                        key={i}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {contentSamples.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Content Samples</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {contentSamples.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-border px-3 py-2.5 text-sm text-primary hover:underline"
                    >
                      {s.caption || s.url}
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
                <div className="space-y-3">
                  {pastCollaborations.map((c, i) => (
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

          {rateCard.length > 0 && (
            <Card>
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

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Total Reach</p>
                <p className="text-lg font-bold text-success">{totalFollowers > 0 ? formatCompactNumber(totalFollowers) : "New creator"}</p>
              </div>
              {!!influencer.influencerProfile?.avgEngagementRate && (
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Engagement Rate</p>
                  <p className="text-lg font-bold">{influencer.influencerProfile.avgEngagementRate}%</p>
                </div>
              )}
              {influencer.influencerProfile?.mediaKitUrl && (
                <a
                  href={influencer.influencerProfile.mediaKitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> View Media Kit
                </a>
              )}
              <Button
                className="w-full"
                variant="gradient"
                disabled={!user || messageMutation.isPending}
                onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              >
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

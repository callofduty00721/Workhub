import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, Star, Briefcase, MessageSquare, Loader2, Link as LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard } from "@/components/freelancers/ServiceCard";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { freelancerApi } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function FreelancerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["freelancers", id],
    queryFn: () => freelancerApi.getProfile(id),
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

  if (!data) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Freelancer not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/freelancers">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const { freelancer, services } = data;

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                <AvatarFallback className="text-lg">{initialsFromName(freelancer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold">{freelancer.name}</h1>
                <p className="text-sm text-muted-foreground">{freelancer.headline || "Freelancer"}</p>
                {(freelancer.category || freelancer.subCategory) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {freelancer.category && <Badge variant="secondary">{freelancer.category}</Badge>}
                    {freelancer.subCategory && <Badge variant="outline">{freelancer.subCategory}</Badge>}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {freelancer.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {freelancer.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {freelancer.rating || "New"}{" "}
                    {freelancer.reviewCount > 0 && `(${freelancer.reviewCount} reviews)`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {freelancer.yearsOfExperience}+ years experience
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {freelancer.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {freelancer.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{freelancer.bio}</p>
              </CardContent>
            </Card>
          )}

          {freelancer.portfolioItems && freelancer.portfolioItems.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-base font-semibold">Portfolio</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {freelancer.portfolioItems.map((item, i) => (
                    <div key={i} className="overflow-hidden rounded-lg border border-border">
                      {item.image && <img src={item.image} alt={item.title} className="h-36 w-full object-cover" />}
                      <div className="p-3.5">
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.description && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{item.description}</p>}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" /> View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="mb-4 text-base font-semibold">Services by {freelancer.name}</h3>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active services listed yet.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>
            )}
          </div>

          <ReviewsSection targetType="user" targetId={freelancer._id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              {freelancer.hourlyRate > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Hourly Rate</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(freelancer.hourlyRate)}/hr</p>
                </div>
              )}
              <Button
                className="w-full"
                variant="gradient"
                disabled={!user || user.id === freelancer._id || messageMutation.isPending}
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

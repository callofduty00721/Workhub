import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { partnerApi } from "@/api/partners";
import { chatApi } from "@/api/chat";
import { initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  accelerator: "Accelerator",
  incubator: "Incubator",
  government: "Government",
  ngo: "NGO",
  service_provider: "Service Provider",
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
                <h1 className="text-xl font-bold">{partner.organizationName || partner.name}</h1>
                <p className="text-sm text-muted-foreground">Represented by {partner.name}</p>
                {partner.location && (
                  <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {partner.location}
                  </span>
                )}
                <Badge variant="outline" className="mt-3">
                  {PARTNER_TYPE_LABELS[partner.partnerType]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {partner.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{partner.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
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

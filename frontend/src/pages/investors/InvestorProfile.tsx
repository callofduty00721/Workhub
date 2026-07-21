import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { investorApi } from "@/api/investors";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function InvestorProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: investor, isLoading } = useQuery({
    queryKey: ["investors", id],
    queryFn: () => investorApi.getProfile(id),
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

  if (!investor) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Investor not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/investors">Back to Directory</Link>
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
                <AvatarImage src={investor.avatar} alt={investor.name} />
                <AvatarFallback className="text-lg">{initialsFromName(investor.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold">{investor.name}</h1>
                <p className="text-sm text-muted-foreground">{investor.headline || "Investor"}</p>
                {investor.location && (
                  <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {investor.location}
                  </span>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {investor.investmentFocus.map((focus) => (
                    <Badge key={focus} variant="outline">
                      {focus}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {investor.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{investor.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Ticket Size</p>
                <p className="text-lg font-bold text-success">
                  {investor.ticketSizeMin > 0 ? `${formatCurrency(investor.ticketSizeMin)} - ${formatCurrency(investor.ticketSizeMax)}` : "On request"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Portfolio Companies</p>
                <p className="text-lg font-bold">{investor.portfolioCompanyCount}</p>
              </div>
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

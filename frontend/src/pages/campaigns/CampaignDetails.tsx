import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { MapPin, Clock, Briefcase, CheckCircle2, Loader2, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { campaignApi } from "@/api/campaigns";
import { jobApi } from "@/api/jobs";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  facebook: "Facebook",
  other: "Other",
};

export default function CampaignDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedRate, setProposedRate] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: campaign, isLoading } = useQuery({ queryKey: ["campaigns", id], queryFn: () => campaignApi.getById(id), enabled: !!id });

  const { data: myApplications } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: jobApi.myApplications,
    enabled: !!user && user.role === "influencer",
  });

  const alreadyApplied = myApplications?.some((a) => (typeof a.job === "string" ? a.job : a.job._id) === id);

  const applyMutation = useMutation({
    mutationFn: () => campaignApi.apply(id, { coverLetter, proposedRate, deliveryDays }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      setDialogOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Campaign not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  const canApply = user && user.role === "influencer";

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white">
                  {campaign.companyName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold">{campaign.title}</h1>
                  <p className="text-sm text-muted-foreground">{campaign.companyName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Megaphone className="h-3 w-3" /> {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
                    </Badge>
                    {campaign.niche && <Badge variant="outline">{campaign.niche}</Badge>}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {campaign.location}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <h3 className="mb-2 text-base font-semibold">Campaign Brief</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{campaign.description}</p>
              </div>
              {campaign.deliverables && (
                <div>
                  <h3 className="mb-2 text-base font-semibold">Deliverables</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{campaign.deliverables}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              {campaign.budgetMin > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(campaign.budgetMin, campaign.currency as "INR" | "USD")}
                    {campaign.budgetMax > campaign.budgetMin ? ` - ${formatCurrency(campaign.budgetMax, campaign.currency as "INR" | "USD")}` : ""}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Posted {new Date(campaign.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" /> {campaign.applicationsCount} applicants so far
              </div>

              {!canApply ? (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!user}
                  onClick={() => !user && navigate("/login", { state: { from: `/campaigns/${id}` } })}
                >
                  {user ? "Only influencers can apply" : "Log in to Apply"}
                </Button>
              ) : alreadyApplied ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> Applied
                </div>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="gradient">
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply to {campaign.title}</DialogTitle>
                      <DialogDescription>Propose your rate and introduce yourself to {campaign.companyName}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Your Rate ({campaign.currency})</Label>
                        <Input type="number" min={0} value={proposedRate || ""} onChange={(e) => setProposedRate(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Delivery (days)</Label>
                        <Input type="number" min={0} value={deliveryDays || ""} onChange={(e) => setDeliveryDays(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Message</Label>
                      <Textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell them why you're a great fit..."
                        className="min-h-[120px]"
                      />
                    </div>
                    {applyMutation.isError && (
                      <p className="mt-2 text-xs text-danger">
                        {isAxiosError(applyMutation.error) ? applyMutation.error.response?.data?.message : "Something went wrong."}
                      </p>
                    )}
                    <Button className="mt-2 w-full" variant="gradient" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                      {applyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Share2,
  Bookmark,
  MapPin,
  Wallet,
  Users,
  CalendarRange,
  Timer,
  FileText,
  Target,
  UserCheck,
  ScrollText,
  Sparkles,
  Star as StarIcon,
  CheckCircle2,
  Loader2,
  BadgeCheck,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Facebook,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { campaignApi } from "@/api/campaigns";
import { jobApi } from "@/api/jobs";
import { userApi } from "@/api/users";
import { formatCurrency, initialsFromName, timeUntil, cn } from "@/lib/utils";
import { publicProfilePathForRole } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

const PLATFORM_META: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "#E1306C" },
  youtube: { label: "YouTube", icon: Youtube, color: "#FF0000" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  twitter: { label: "Twitter / X", icon: Twitter, color: "#171717" },
  facebook: { label: "Facebook", icon: Facebook, color: "#1877F2" },
  other: { label: "Other", icon: Globe, color: "#525252" },
};

const COLLABORATION_TYPE_LABELS: Record<string, string> = {
  paid: "Paid Collaboration",
  barter: "Barter / Product Exchange",
  affiliate: "Affiliate / Commission",
  hybrid: "Hybrid",
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  upi: "UPI",
  escrow: "Platform Escrow (GrowHive)",
  other: "Other",
};

function platformMeta(name: string) {
  return PLATFORM_META[name.trim().toLowerCase()] ?? PLATFORM_META.other;
}

export default function CampaignDetails() {
  const { id = "" } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedRate, setProposedRate] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const isSaved = !!campaign && user?.savedCampaigns?.includes(campaign._id);
  const saveMutation = useMutation({
    mutationFn: () => userApi.toggleSavedCampaign(id),
    onSuccess: () => refreshUser(),
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

  const employer = typeof campaign.employer === "object" ? campaign.employer : undefined;
  const employerProfilePath = employer ? publicProfilePathForRole(employer.role as UserRole, employer._id) : null;
  // First platform is the "lead" one — sets the banner color when there's
  // no cover image; every platform still gets its own badge/icon below.
  const meta = platformMeta(campaign.platforms[0] ?? "other");

  const isFixedBudget = campaign.budgetMin > 0 && campaign.budgetMin === campaign.budgetMax;
  const hasCollaborators = !!campaign.collaboratorsMin || !!campaign.collaboratorsMax;
  const hasDuration = !!campaign.startDate && !!campaign.endDate;
  const countdown = campaign.applicationDeadline ? timeUntil(campaign.applicationDeadline) : null;
  const hasTargetAge = !!campaign.targetAgeMin || !!campaign.targetAgeMax;
  const hasEstimatedReach = !!campaign.estimatedReachMin || !!campaign.estimatedReachMax;
  const contentLines = campaign.deliverables?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const termsLines = campaign.termsAndConditions?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const previousClients = employer?.agencyProfile?.clients ?? [];
  const canApply = user && user.role === "influencer";

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="container py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/campaigns">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" /> {copied ? "Link Copied" : "Share Campaign"}
          </Button>
          {canApply &&
            (alreadyApplied ? (
              <Button variant="outline" size="sm" disabled>
                <CheckCircle2 className="h-3.5 w-3.5" /> Applied
              </Button>
            ) : (
              <Button variant="gradient" size="sm" onClick={() => setDialogOpen(true)}>
                Apply Now
              </Button>
            ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white p-5">
            <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
              <div className="relative h-44 shrink-0 overflow-hidden rounded-2xl sm:h-full" style={{ backgroundColor: meta.color }}>
                {campaign.imageUrl && <img src={campaign.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                {campaign.isFeatured && (
                  <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#6366F1] px-2.5 py-1 text-[10px] font-bold text-white">
                    <Sparkles className="h-3 w-3" /> FEATURED
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => user?.role === "influencer" && saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  title={isSaved ? "Remove from saved" : "Save for later"}
                  className={cn(
                    "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50",
                    user?.role !== "influencer" && "hidden"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                </button>
              </div>

              <div className="min-w-0">
                <h1 className="text-[21px] font-bold leading-tight text-neutral-900">{campaign.title}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {campaign.influencerCategory && (
                    <Badge variant="secondary" className="text-[11px]">
                      {campaign.influencerCategory}
                    </Badge>
                  )}
                  {campaign.niche && (
                    <Badge variant="outline" className="text-[11px]">
                      {campaign.niche}
                    </Badge>
                  )}
                  {campaign.platforms.map((p) => {
                    const pMeta = platformMeta(p);
                    const PIcon = pMeta.icon;
                    return (
                      <Badge key={p} variant="outline" className="flex items-center gap-1 text-[11px]">
                        <PIcon className="h-3 w-3" style={{ color: pMeta.color }} /> {pMeta.label}
                      </Badge>
                    );
                  })}
                </div>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-neutral-500">{campaign.description}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-neutral-100 p-3 text-center">
                <Wallet className="mx-auto h-4.5 w-4.5 text-[#8B5CF6]" />
                <p className="mt-1 text-[13px] font-bold text-neutral-900">
                  {campaign.budgetMin > 0
                    ? isFixedBudget
                      ? formatCurrency(campaign.budgetMin, campaign.currency as "INR" | "USD")
                      : `${formatCurrency(campaign.budgetMin, campaign.currency as "INR" | "USD")}–${formatCurrency(campaign.budgetMax, campaign.currency as "INR" | "USD")}`
                    : "—"}
                </p>
                <p className="text-[11px] text-neutral-500">Budget{isFixedBudget && " (Fixed)"}</p>
              </div>
              <div className="rounded-2xl border border-neutral-100 p-3 text-center">
                <Users className="mx-auto h-4.5 w-4.5 text-[#0284C7]" />
                <p className="mt-1 text-[13px] font-bold text-neutral-900">
                  {hasCollaborators ? `${campaign.collaboratorsMin || 1}–${campaign.collaboratorsMax || campaign.collaboratorsMin}` : "—"}
                </p>
                <p className="text-[11px] text-neutral-500">Influencers</p>
              </div>
              <div className="rounded-2xl border border-neutral-100 p-3 text-center">
                <CalendarRange className="mx-auto h-4.5 w-4.5 text-[#D97706]" />
                <p className="mt-1 text-[13px] font-bold text-neutral-900">
                  {hasDuration
                    ? `${new Date(campaign.startDate!).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${new Date(
                        campaign.endDate!
                      ).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
                    : "—"}
                </p>
                <p className="text-[11px] text-neutral-500">Duration</p>
              </div>
              <div className="rounded-2xl border border-neutral-100 p-3 text-center">
                <Timer className="mx-auto h-4.5 w-4.5 text-[#EC4899]" />
                <p className={cn("mt-1 text-[13px] font-bold", countdown ? "text-[#6366F1]" : "text-neutral-900")}>{countdown ?? "—"}</p>
                <p className="text-[11px] text-neutral-500">Applications End</p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <h3 className="mb-2 text-base font-semibold">About the Campaign</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{campaign.description}</p>
              </div>

              {(!!campaign.highlights?.length || contentLines.length > 0) && (
                <div className="grid gap-6 border-t border-neutral-100 pt-5 sm:grid-cols-2">
                  {!!campaign.highlights?.length && (
                    <div>
                      <h3 className="mb-3 text-[14px] font-semibold">Campaign Highlights</h3>
                      <ul className="space-y-2">
                        {campaign.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {contentLines.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-1.5 text-[14px] font-semibold">
                        <FileText className="h-4 w-4 text-neutral-400" /> Content Requirements
                      </h3>
                      <ul className="space-y-2">
                        {contentLines.map((l, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {(hasTargetAge || campaign.location || hasEstimatedReach || !!campaign.minEngagementRate) && (
            <Card>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold">
                    <Target className="h-4 w-4 text-neutral-400" /> Target Audience
                  </h3>
                  <div className="space-y-2 text-sm">
                    {hasTargetAge && (
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Age</span>
                        <span className="font-medium">
                          {campaign.targetAgeMin ?? "—"} – {campaign.targetAgeMax ?? "—"} yrs
                        </span>
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{campaign.location}</span>
                    </p>
                  </div>
                </div>
                {(hasEstimatedReach || !!campaign.minEngagementRate) && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold">
                      <Sparkles className="h-4 w-4 text-neutral-400" /> Campaign Goals
                    </h3>
                    <div className="space-y-2 text-sm">
                      {hasEstimatedReach && (
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Target Reach</span>
                          <span className="font-medium">
                            {campaign.estimatedReachMin?.toLocaleString("en-IN") ?? "—"} – {campaign.estimatedReachMax?.toLocaleString("en-IN") ?? "—"}
                          </span>
                        </p>
                      )}
                      {!!campaign.minEngagementRate && (
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Min. Engagement Rate</span>
                          <span className="font-medium">{campaign.minEngagementRate}%</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {employer && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={employer.avatar} alt={employer.name} />
                    <AvatarFallback className="bg-neutral-900 text-base text-white">{initialsFromName(employer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[15px] font-bold text-neutral-900">
                      {employer.name}
                      {employer.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#3B82F6]" />}
                    </p>
                    {!!employer.reviewCount && (
                      <p className="flex items-center gap-1 text-[12.5px] text-neutral-500">
                        <StarIcon className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" /> {employer.rating?.toFixed(1)} ({employer.reviewCount} reviews)
                      </p>
                    )}
                  </div>
                  {employerProfilePath && (
                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <Link to={employerProfilePath}>View Profile</Link>
                    </Button>
                  )}
                </div>

                {previousClients.length > 0 && (
                  <div className="border-t border-neutral-100 pt-4">
                    <p className="mb-2.5 text-[13px] font-semibold text-neutral-900">Previously Worked With</p>
                    <div className="flex flex-wrap gap-2">
                      {previousClients.map((c, i) => (
                        <span
                          key={i}
                          title={c.description}
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-[12px] font-medium text-neutral-700"
                        >
                          {c.logoUrl ? <img src={c.logoUrl} alt="" className="h-4 w-4 shrink-0 rounded object-cover" /> : null}
                          {c.clientName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-base font-semibold">Campaign Overview</h3>
              <div className="space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Campaign ID</span>
                  <span className="font-mono font-medium">{campaign.campaignId ?? `CMP-${campaign._id.slice(-6).toUpperCase()}`}</span>
                </div>
                {employer && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span className="flex items-center gap-1 truncate font-medium">
                      {employer.name}
                      {employer.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Posted On</span>
                  <span className="font-medium">{new Date(campaign.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                {(campaign.influencerCategory || campaign.niche) && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="max-w-[60%] truncate text-right font-medium">
                      {[campaign.influencerCategory, campaign.niche].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{campaign.platforms.length > 1 ? "Platforms" : "Platform"}</span>
                  <span className="flex items-center gap-2 font-medium">
                    {campaign.platforms.map((p) => {
                      const pMeta = platformMeta(p);
                      const PIcon = pMeta.icon;
                      return (
                        <span key={p} title={pMeta.label}>
                          <PIcon className="h-3.5 w-3.5" style={{ color: pMeta.color }} />
                        </span>
                      );
                    })}
                  </span>
                </div>
                {campaign.collaborationType && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Collaboration Type</span>
                    <span className="font-medium">{COLLABORATION_TYPE_LABELS[campaign.collaborationType]}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Applicants</span>
                  <span className="font-medium">{campaign.applicationsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-3 w-3" /> {campaign.location}
                  </span>
                </div>
                {campaign.paymentMode && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment Mode</span>
                    <span className="font-medium">{PAYMENT_MODE_LABELS[campaign.paymentMode]}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(campaign.influencerCategory || !!campaign.minFollowers || !!campaign.minEngagementRate) && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <h3 className="flex items-center gap-1.5 text-base font-semibold">
                  <UserCheck className="h-4 w-4 text-neutral-400" /> Ideal Influencer
                </h3>
                <ul className="space-y-2">
                  {campaign.influencerCategory && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> {campaign.influencerCategory} Content Creator
                    </li>
                  )}
                  {!!campaign.minFollowers && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> {campaign.minFollowers.toLocaleString("en-IN")}+ Followers
                    </li>
                  )}
                  {!!campaign.minEngagementRate && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> Min. {campaign.minEngagementRate}% Engagement Rate
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {termsLines.length > 0 && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <h3 className="flex items-center gap-1.5 text-base font-semibold">
                  <ScrollText className="h-4 w-4 text-neutral-400" /> Terms & Conditions
                </h3>
                <ul className="space-y-1.5">
                  {termsLines.map((l, i) => (
                    <li key={i} className="text-[12.5px] leading-relaxed text-muted-foreground">
                      • {l}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3 p-6">
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
                <Button className="w-full" variant="gradient" onClick={() => setDialogOpen(true)}>
                  Apply Now
                </Button>
              )}
              {canApply && (
                <Button variant="outline" className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} /> {isSaved ? "Saved" : "Save Campaign"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
    </div>
  );
}

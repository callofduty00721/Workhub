import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/context/AuthContext";
import { FormGuidelines } from "@/components/shared/FormGuidelines";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { campaignApi } from "@/api/campaigns";
import { agencyClientApi } from "@/api/agencyClients";
import { cn } from "@/lib/utils";
import { CAMPAIGN_PLATFORMS, COLLABORATION_TYPES, PAYMENT_MODES } from "@/types";

// <input type="date"> needs "YYYY-MM-DD"; the API gives back a full ISO string.
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : undefined);

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  facebook: "Facebook",
  other: "Other",
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

const schema = z.object({
  title: z.string().min(2, "Campaign title is required"),
  companyName: z.string().min(2, "Brand name is required"),
  description: z.string().min(20, "Description should be at least 20 characters"),
  deliverables: z.string().optional(),
  platforms: z.array(z.enum(CAMPAIGN_PLATFORMS)).min(1, "Select at least one platform"),
  niche: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(0),
  collaboratorsMin: z.coerce.number().min(0).optional(),
  collaboratorsMax: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  applicationDeadline: z.string().optional(),
  targetAgeMin: z.coerce.number().min(0).optional(),
  targetAgeMax: z.coerce.number().min(0).optional(),
  influencerCategory: z.string().optional(),
  minFollowers: z.coerce.number().min(0).optional(),
  minEngagementRate: z.coerce.number().min(0).optional(),
  estimatedReachMin: z.coerce.number().min(0).optional(),
  estimatedReachMax: z.coerce.number().min(0).optional(),
  collaborationType: z.enum(COLLABORATION_TYPES).optional(),
  paymentMode: z.enum(PAYMENT_MODES).optional(),
  highlightsText: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PostCampaign() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // brand/agency/talent_partner post through this exact same form (they only
  // ever hire via Campaigns) — the sidebar it renders under should match
  // whoever's actually signed in, not always say "employer".
  const dashboardRole = (user?.role ?? "employer") as DashboardRole;
  const isEdit = !!id;
  const basePath = "/dashboard/employer/campaigns";

  const { data: existing } = useQuery({ queryKey: ["campaigns", id], queryFn: () => campaignApi.getById(id!), enabled: isEdit });

  // Only an agency ever has clients to post on behalf of (see
  // agencyClient.model.js) — everyone else always posts as themselves.
  const [onBehalfOf, setOnBehalfOf] = useState("");
  // Outside react-hook-form, same pattern CreateGig.tsx uses for its cover
  // images — FileUpload manages its own upload state, this just tracks the
  // resulting URL.
  const [imageUrl, setImageUrl] = useState("");
  const { data: managedClients } = useQuery({
    queryKey: ["agency-clients", "managed"],
    queryFn: agencyClientApi.managed,
    enabled: dashboardRole === "agency",
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { platforms: ["instagram"], location: "Remote", budgetMin: 0, budgetMax: 0 },
  });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        companyName: existing.companyName,
        description: existing.description,
        deliverables: existing.deliverables,
        platforms: existing.platforms,
        niche: existing.niche,
        location: existing.location,
        budgetMin: existing.budgetMin,
        budgetMax: existing.budgetMax,
        collaboratorsMin: existing.collaboratorsMin,
        collaboratorsMax: existing.collaboratorsMax,
        startDate: toDateInput(existing.startDate),
        endDate: toDateInput(existing.endDate),
        applicationDeadline: toDateInput(existing.applicationDeadline),
        targetAgeMin: existing.targetAgeMin,
        targetAgeMax: existing.targetAgeMax,
        influencerCategory: existing.influencerCategory,
        minFollowers: existing.minFollowers,
        minEngagementRate: existing.minEngagementRate,
        estimatedReachMin: existing.estimatedReachMin,
        estimatedReachMax: existing.estimatedReachMax,
        collaborationType: existing.collaborationType,
        paymentMode: existing.paymentMode,
        highlightsText: existing.highlights?.join("\n"),
        termsAndConditions: existing.termsAndConditions,
      });
      setOnBehalfOf(typeof existing.onBehalfOf === "object" && existing.onBehalfOf ? existing.onBehalfOf._id : "");
      setImageUrl(existing.imageUrl ?? "");
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const { highlightsText, ...rest } = values;
      const payload = {
        ...rest,
        status: "open" as const,
        onBehalfOf: onBehalfOf || undefined,
        imageUrl: imageUrl || undefined,
        highlights: highlightsText
          ? highlightsText.split("\n").map((h) => h.trim()).filter(Boolean)
          : [],
      };
      return isEdit ? campaignApi.update(id!, payload) : campaignApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      navigate(basePath);
    },
  });

  return (
    <DashboardLayout role={dashboardRole} title={isEdit ? "Edit Campaign" : "Post a Campaign"} subtitle="Brief influencers on what your brand needs.">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
        <FormGuidelines
          tips={[
            "Be specific about the platform and content type you need",
            "State your budget range so influencers can self-select",
            "List deliverables clearly (e.g. '1 Reel + 2 Stories')",
          ]}
        />
        <Card>
          <CardContent className="space-y-5 p-6">
            {dashboardRole === "agency" && !!managedClients?.length && (
              <div className="space-y-2">
                <FieldLabel info="Post this campaign for one of your clients instead of yourself.">
                  Post On Behalf Of (optional)
                </FieldLabel>
                <Select value={onBehalfOf || "__self__"} onValueChange={(v) => setOnBehalfOf(v === "__self__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__self__">Post as myself</SelectItem>
                    {managedClients.map((row) => (
                      <SelectItem key={row._id} value={row.brand?._id ?? ""}>
                        {row.brand?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <FieldLabel info="A cover image shown on the campaign card and details page, e.g. the product being promoted.">
                Cover Image (optional)
              </FieldLabel>
              {imageUrl ? (
                <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-border">
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-2 h-7"
                    onClick={() => setImageUrl("")}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <FileUpload folder="campaign_cover" onUploaded={(url) => setImageUrl(url)} className="max-w-xs" />
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="title" info="A short, clear name for this campaign.">
                  Campaign Title
                </FieldLabel>
                <Input id="title" placeholder="e.g. Diwali Collection Launch" {...register("title")} />
                {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="companyName" info="Your brand's name, shown to influencers.">
                  Brand Name
                </FieldLabel>
                <Input id="companyName" placeholder="Your brand name" {...register("companyName")} />
                {errors.companyName && <p className="text-xs text-danger">{errors.companyName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="description" info="Describe the campaign goals and what you're looking for.">
                Campaign Brief
              </FieldLabel>
              <Textarea id="description" placeholder="Describe the campaign..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="deliverables" info="What content you expect, e.g. '1 Instagram Post + 1 Story'.">
                Deliverables (optional)
              </FieldLabel>
              <Textarea id="deliverables" placeholder="1 Instagram Post + 1 Story..." {...register("deliverables")} />
            </div>

            <div className="space-y-2">
              <FieldLabel info="Every platform this campaign runs on — pick as many as apply.">Platforms</FieldLabel>
              <Controller
                control={control}
                name="platforms"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {CAMPAIGN_PLATFORMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          field.onChange(field.value.includes(p) ? field.value.filter((v) => v !== p) : [...field.value, p])
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          field.value.includes(p)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {PLATFORM_LABELS[p]}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.platforms && <p className="text-xs text-danger">{errors.platforms.message}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="niche" info="The content niche you're targeting, e.g. Fashion, Tech, Fitness.">
                  Niche (optional)
                </FieldLabel>
                <Input id="niche" placeholder="Fashion, Tech, Fitness..." {...register("niche")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="location" info="Where the influencer should be based, or 'Remote'.">
                  Location
                </FieldLabel>
                <Input id="location" placeholder="Remote, Mumbai..." {...register("location")} />
                {errors.location && <p className="text-xs text-danger">{errors.location.message}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="budgetMin" info="The lowest budget you can offer.">
                  Min Budget (₹)
                </FieldLabel>
                <Input id="budgetMin" type="number" min={0} {...register("budgetMin")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="budgetMax" info="The highest budget you can offer.">
                  Max Budget (₹)
                </FieldLabel>
                <Input id="budgetMax" type="number" min={0} {...register("budgetMax")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <h3 className="text-sm font-semibold text-neutral-900">Additional Details (optional)</h3>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="collaboratorsMin" info="The smallest number of influencers you want to work with.">
                  Min Collaborators
                </FieldLabel>
                <Input id="collaboratorsMin" type="number" min={0} {...register("collaboratorsMin")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="collaboratorsMax" info="The largest number of influencers you want to work with.">
                  Max Collaborators
                </FieldLabel>
                <Input id="collaboratorsMax" type="number" min={0} {...register("collaboratorsMax")} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel htmlFor="influencerCategory" info="The kind of influencer this campaign is looking for, e.g. 'Beauty & Skincare'.">
                  Influencer Category
                </FieldLabel>
                <Input id="influencerCategory" placeholder="Beauty & Skincare..." {...register("influencerCategory")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="minFollowers" info="The fewest followers an applicant should have.">
                  Min. Followers
                </FieldLabel>
                <Input id="minFollowers" type="number" min={0} {...register("minFollowers")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="minEngagementRate" info="The minimum engagement rate you require from applicants (%).">
                  Min. Engagement Rate (%)
                </FieldLabel>
                <Input id="minEngagementRate" type="number" min={0} step="0.1" {...register("minEngagementRate")} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel info="How influencers will be compensated for this campaign.">Collaboration Type</FieldLabel>
                <Controller
                  control={control}
                  name="collaborationType"
                  render={({ field }) => (
                    <Select value={field.value ?? "paid"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLABORATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {COLLABORATION_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel info="How you plan to pay influencers for this campaign.">Payment Mode</FieldLabel>
                <Controller
                  control={control}
                  name="paymentMode"
                  render={({ field }) => (
                    <Select value={field.value ?? "escrow"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {PAYMENT_MODE_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="estimatedReachMin" info="Your own target/goal for how many people this campaign could reach — not a platform-measured figure.">
                  Target Reach — Min (optional)
                </FieldLabel>
                <Input id="estimatedReachMin" type="number" min={0} {...register("estimatedReachMin")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="estimatedReachMax" info="Your own target/goal for how many people this campaign could reach — not a platform-measured figure.">
                  Target Reach — Max (optional)
                </FieldLabel>
                <Input id="estimatedReachMax" type="number" min={0} {...register("estimatedReachMax")} />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="highlightsText" info="Campaign goals, one per line, e.g. 'Increase brand awareness'.">
                Campaign Highlights (optional, one per line)
              </FieldLabel>
              <Textarea id="highlightsText" placeholder={"Increase brand awareness\nBoost product sales"} {...register("highlightsText")} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="termsAndConditions" info="Any terms influencers should agree to before applying.">
                Terms & Conditions (optional)
              </FieldLabel>
              <Textarea id="termsAndConditions" placeholder="Content should be original..." {...register("termsAndConditions")} />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel htmlFor="startDate" info="When the campaign content goes live.">
                  Campaign Start Date
                </FieldLabel>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="endDate" info="When the campaign wraps up.">
                  Campaign End Date
                </FieldLabel>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="applicationDeadline" info="Last date influencers can apply by.">
                  Applications Close
                </FieldLabel>
                <Input id="applicationDeadline" type="date" {...register("applicationDeadline")} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="targetAgeMin" info="The youngest age in your target audience.">
                  Target Audience — Min Age
                </FieldLabel>
                <Input id="targetAgeMin" type="number" min={0} {...register("targetAgeMin")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="targetAgeMax" info="The oldest age in your target audience.">
                  Target Audience — Max Age
                </FieldLabel>
                <Input id="targetAgeMax" type="number" min={0} {...register("targetAgeMax")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {mutation.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Something went wrong while saving this campaign. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Publish Campaign"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

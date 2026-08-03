import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FormGuidelines } from "@/components/shared/FormGuidelines";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { campaignApi } from "@/api/campaigns";
import { CAMPAIGN_PLATFORMS } from "@/types";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  facebook: "Facebook",
  other: "Other",
};

const schema = z.object({
  title: z.string().min(2, "Campaign title is required"),
  companyName: z.string().min(2, "Brand name is required"),
  description: z.string().min(20, "Description should be at least 20 characters"),
  deliverables: z.string().optional(),
  platform: z.enum(CAMPAIGN_PLATFORMS),
  niche: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function PostCampaign() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const basePath = "/dashboard/employer/campaigns";

  const { data: existing } = useQuery({ queryKey: ["campaigns", id], queryFn: () => campaignApi.getById(id!), enabled: isEdit });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { platform: "instagram", location: "Remote", budgetMin: 0, budgetMax: 0 },
  });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        companyName: existing.companyName,
        description: existing.description,
        deliverables: existing.deliverables,
        platform: existing.platform,
        niche: existing.niche,
        location: existing.location,
        budgetMin: existing.budgetMin,
        budgetMax: existing.budgetMax,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, status: "open" as const };
      return isEdit ? campaignApi.update(id!, payload) : campaignApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      navigate(basePath);
    },
  });

  return (
    <DashboardLayout role="employer" title={isEdit ? "Edit Campaign" : "Post a Campaign"} subtitle="Brief influencers on what your brand needs.">
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

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel info="Which platform this campaign runs on.">Platform</FieldLabel>
                <Controller
                  control={control}
                  name="platform"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPAIGN_PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PLATFORM_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
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

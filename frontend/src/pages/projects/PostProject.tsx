import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Lock, Globe, FileText, X, Search, UserPlus, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FormGuidelines } from "@/components/shared/FormGuidelines";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { SkillsInput } from "@/components/shared/SkillsInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectApi } from "@/api/projects";
import { uploadApi } from "@/api/uploads";
import { freelancerApi } from "@/api/freelancers";
import { initialsFromName } from "@/lib/utils";
import { SERVICE_CATEGORY_NAMES, SERVICE_SUBCATEGORIES } from "@/lib/mockData";
import type { JobAttachment, JobVisibility } from "@/types";

// Projects are always bid-based — freelancers propose their own rate and
// delivery time when they apply (see JobDetails.tsx), so there's no salary
// or experience-level dropdown here like the Employer job form has.
const PROJECT_TYPES = ["freelance", "contract"] as const;

const schema = z.object({
  title: z.string().min(2, "Project title is required"),
  companyName: z.string().min(2, "Your name / company is required"),
  description: z.string().min(20, "Scope should be at least 20 characters"),
  requirements: z.string().optional(),
  type: z.enum(PROJECT_TYPES),
  category: z.string().min(1, "Select a category"),
  subCategory: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  isRemote: z.boolean(),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(0),
  expectedDeliveryDays: z.coerce.number().min(0),
  skillsInput: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PostProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const basePath = "/dashboard/client";

  const { data: existing } = useQuery({ queryKey: ["projects", id], queryFn: () => projectApi.getById(id!), enabled: isEdit });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "freelance", isRemote: true, budgetMin: 0, budgetMax: 0, expectedDeliveryDays: 0 },
  });

  const [visibility, setVisibility] = useState<JobVisibility>("public");
  const [requiresNda, setRequiresNda] = useState(false);
  const [ndaText, setNdaText] = useState("");
  const [attachments, setAttachments] = useState<JobAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [inviteSearch, setInviteSearch] = useState("");

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        companyName: existing.companyName,
        description: existing.description,
        requirements: existing.requirements,
        type: existing.type as (typeof PROJECT_TYPES)[number],
        category: existing.category ?? "",
        subCategory: existing.subCategory ?? "",
        location: existing.location,
        isRemote: existing.isRemote,
        budgetMin: existing.budgetMin,
        budgetMax: existing.budgetMax,
        expectedDeliveryDays: existing.expectedDeliveryDays ?? 0,
        skillsInput: existing.skills.join(", "),
      });
      setVisibility(existing.visibility ?? "public");
      setRequiresNda(existing.requiresNda ?? false);
      setNdaText(existing.ndaText ?? "");
      setAttachments(existing.attachments ?? []);
    }
  }, [existing, reset]);

  const handleAttachmentUpload = async (file: File | undefined) => {
    if (!file) return;
    setAttachmentError(null);
    setIsUploadingAttachment(true);
    try {
      const result = await uploadApi.upload(file, "job_attachment");
      setAttachments((prev) => [...prev, { key: result.publicId, name: result.name }]);
    } catch (err) {
      setAttachmentError(isAxiosError(err) ? err.response?.data?.message || "Upload failed" : "Upload failed");
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const { data: inviteResults } = useQuery({
    queryKey: ["freelancers", "invite-search", inviteSearch],
    queryFn: () => freelancerApi.list({ search: inviteSearch, limit: 6 }),
    enabled: isEdit && visibility === "invite_only" && inviteSearch.trim().length > 1,
  });

  const inviteMutation = useMutation({
    mutationFn: (freelancerId: string) => projectApi.invite(id!, freelancerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
      setInviteSearch("");
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (freelancerId: string) => projectApi.revokeInvite(id!, freelancerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", id] }),
  });

  const invitedFreelancers = (existing?.invitedFreelancers ?? []).filter(
    (f): f is { _id: string; name: string; avatar?: string; email?: string } => typeof f === "object"
  );

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skillsInput ? values.skillsInput.split(",").map((s) => s.trim()).filter(Boolean) : [],
        status: "open" as const,
        visibility,
        requiresNda,
        ndaText: requiresNda ? ndaText : "",
        attachments,
      };
      return isEdit ? projectApi.update(id!, payload) : projectApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(basePath);
    },
  });

  return (
    <DashboardLayout role="client" title={isEdit ? "Edit Project" : "Post a Project"} subtitle="Describe the work and get bids from freelancers.">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
        <FormGuidelines
          tips={[
            "Be clear and specific about the scope of work",
            "Use simple, professional language",
            "Set a realistic budget and delivery window",
            "Detailed project posts get better quality bids",
          ]}
        />
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="title" info="Use a clear title, like 'Landing page redesign' instead of just 'Website work'.">
                  Project Title
                </FieldLabel>
                <Input id="title" placeholder="e.g. Landing page redesign" {...register("title")} />
                {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="companyName" info="Your name or company name, shown to freelancers.">
                  Your Name / Company
                </FieldLabel>
                <Input id="companyName" placeholder="Your name or company" {...register("companyName")} />
                {errors.companyName && <p className="text-xs text-danger">{errors.companyName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="description" info="Explain what you need done in simple words.">
                Scope of Work
              </FieldLabel>
              <Textarea id="description" placeholder="Describe what you need done..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="requirements" info="Skills or tools a freelancer needs for this work.">
                Requirements (optional)
              </FieldLabel>
              <Textarea id="requirements" placeholder="Required skills, tools, or experience..." {...register("requirements")} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="skillsInput" info="Add skills separated by commas, like React, Figma.">
                Skills (comma separated)
              </FieldLabel>
              <Controller
                control={control}
                name="skillsInput"
                render={({ field }) => (
                  <SkillsInput id="skillsInput" value={field.value ?? ""} onChange={field.onChange} placeholder="React, Figma, SEO" />
                )}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel info="Choose the type of work this is.">Project Type</FieldLabel>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freelance">One-off Freelance Work</SelectItem>
                      <SelectItem value="contract">Ongoing Contract</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel info="What kind of work this project needs.">Category</FieldLabel>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue("subCategory", "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORY_NAMES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel info="A more specific type within the category.">Sub-Category</FieldLabel>
                <ProjectSubCategorySelect control={control} category={watch("category")} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <FieldLabel htmlFor="location" info="City and state, or write 'Remote'.">Location</FieldLabel>
                <Input id="location" placeholder="City, State (or Remote)" {...register("location")} />
                {errors.location && <p className="text-xs text-danger">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="budgetMin" info="The lowest amount you're willing to pay.">
                  Budget Min (₹)
                </FieldLabel>
                <Input id="budgetMin" type="number" min={0} {...register("budgetMin")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="budgetMax" info="The highest amount you're willing to pay.">Budget Max (₹)</FieldLabel>
                <Input id="budgetMax" type="number" min={0} {...register("budgetMax")} />
              </div>
            </div>
            <div className="space-y-2 sm:w-1/3">
              <FieldLabel htmlFor="expectedDeliveryDays" info="How many days you think this will take.">
                Expected Delivery (days)
              </FieldLabel>
              <Input id="expectedDeliveryDays" type="number" min={0} {...register("expectedDeliveryDays")} placeholder="e.g. 7" />
            </div>
            <p className="text-xs text-muted-foreground">
              Budget and delivery time are just a guide for freelancers — they'll still propose their own rate and delivery time when they apply. Leave at 0 if you'd rather not suggest either.
            </p>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("isRemote")} />
              This is a remote project
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="text-base font-semibold">Privacy &amp; Confidentiality</h3>
              <p className="text-xs text-muted-foreground">Control who can see this project and require an NDA before details are shown.</p>
            </div>

            <div className="space-y-2">
              <FieldLabel info="Public: everyone can see it. Private: only people you invite can see it.">
                Visibility
              </FieldLabel>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    visibility === "public" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <Globe className="h-4 w-4" /> Public — listed &amp; searchable
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("invite_only")}
                  className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    visibility === "invite_only" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <Lock className="h-4 w-4" /> Private — invite only
                </button>
              </div>
              {visibility === "invite_only" && (
                <p className="text-xs text-muted-foreground">
                  This project won't appear in search or public listings — only freelancers you invite can view or bid.
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={requiresNda}
                onChange={(e) => setRequiresNda(e.target.checked)}
              />
              Require freelancers to accept an NDA before viewing full details
            </label>
            {requiresNda && (
              <div className="space-y-2">
                <FieldLabel info="Write your own NDA, or leave blank to use MahaHub's default one.">
                  NDA Text (optional — leave blank to use the standard MahaHub NDA)
                </FieldLabel>
                <Textarea
                  value={ndaText}
                  onChange={(e) => setNdaText(e.target.value)}
                  placeholder="Paste your own NDA terms here, or leave blank for the default..."
                  className="min-h-[100px]"
                />
              </div>
            )}

            <div className="space-y-2">
              <FieldLabel info="Private files that only people you allow can see.">
                Confidential Attachments (optional)
              </FieldLabel>
              <p className="text-xs text-muted-foreground">
                Only accessible via short-lived signed links to authorized viewers, and expire automatically 7 days after posting.
              </p>
              <div className="space-y-2">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs">
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="h-3.5 w-3.5 shrink-0" /> {a.name}
                    </span>
                    <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5 text-danger" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={attachmentInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleAttachmentUpload(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" disabled={isUploadingAttachment} onClick={() => attachmentInputRef.current?.click()}>
                {isUploadingAttachment && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add File
              </Button>
              {attachmentError && <p className="text-xs text-danger">{attachmentError}</p>}
            </div>

            {isEdit && visibility === "invite_only" && (
              <div className="space-y-3 border-t border-border pt-5">
                <Label className="flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Invited Freelancers
                </Label>
                {invitedFreelancers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {invitedFreelancers.map((f) => (
                      <Badge key={f._id} variant="outline" className="flex items-center gap-1.5 py-1">
                        {f.name}
                        <button type="button" onClick={() => revokeInviteMutation.mutate(f._id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    placeholder="Search freelancers by name..."
                    className="pl-8"
                  />
                </div>
                {inviteResults && inviteResults.data.length > 0 && (
                  <div className="space-y-1.5 rounded-lg border border-border p-2">
                    {inviteResults.data.map((f) => {
                      const alreadyInvited = invitedFreelancers.some((inv) => inv._id === f._id);
                      return (
                        <div key={f._id} className="flex items-center justify-between gap-2 px-1.5 py-1 text-sm">
                          <span className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[10px] font-semibold text-white">
                              {initialsFromName(f.name)}
                            </span>
                            {f.name}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={alreadyInvited || inviteMutation.isPending}
                            onClick={() => inviteMutation.mutate(f._id)}
                          >
                            {alreadyInvited ? "Invited" : "Invite"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {visibility === "invite_only" && !isEdit && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Save this project first, then invite specific freelancers from the edit page.
              </p>
            )}
          </CardContent>
        </Card>

        {mutation.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Something went wrong while saving this project. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Publish Project"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

function ProjectSubCategorySelect({ control, category }: { control: Control<FormValues>; category?: string }) {
  const options = category ? SERVICE_SUBCATEGORIES[category] ?? [] : [];
  if (options.length === 0) {
    return <p className="flex h-9 items-center text-xs text-muted-foreground">Select a category first.</p>;
  }
  return (
    <Controller
      control={control}
      name="subCategory"
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select sub-category" />
          </SelectTrigger>
          <SelectContent>
            {options.map((sub) => (
              <SelectItem key={sub} value={sub}>
                {sub}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

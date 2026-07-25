import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jobApi } from "@/api/jobs";
import { uploadApi } from "@/api/uploads";
import { freelancerApi } from "@/api/freelancers";
import { initialsFromName } from "@/lib/utils";
import type { JobAttachment, JobVisibility } from "@/types";

// Traditional employment only — freelance/contract "Projects" have their own
// dedicated form (PostProject.tsx) since they're bid-based, not salaried.
const JOB_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"] as const;

const schema = z.object({
  title: z.string().min(2, "Job title is required"),
  companyName: z.string().min(2, "Company name is required"),
  description: z.string().min(20, "Description should be at least 20 characters"),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  type: z.enum(JOB_TYPES),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  location: z.string().min(2, "Location is required"),
  isRemote: z.boolean(),
  salaryMin: z.coerce.number().min(0),
  salaryMax: z.coerce.number().min(0),
  skillsInput: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PostJob() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const basePath = "/dashboard/employer";

  const { data: existing } = useQuery({ queryKey: ["jobs", id], queryFn: () => jobApi.getById(id!), enabled: isEdit });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "full_time", experienceLevel: "entry", isRemote: false, salaryMin: 0, salaryMax: 0 },
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
        responsibilities: existing.responsibilities,
        requirements: existing.requirements,
        type: existing.type as (typeof JOB_TYPES)[number],
        experienceLevel: existing.experienceLevel,
        location: existing.location,
        isRemote: existing.isRemote,
        salaryMin: existing.salaryMin,
        salaryMax: existing.salaryMax,
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
    mutationFn: (freelancerId: string) => jobApi.invite(id!, freelancerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
      setInviteSearch("");
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (freelancerId: string) => jobApi.revokeInvite(id!, freelancerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs", id] }),
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
      return isEdit ? jobApi.update(id!, payload) : jobApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate(basePath);
    },
  });

  return (
    <DashboardLayout role="employer" title={isEdit ? "Edit Job" : "Post a Job"} subtitle="Reach qualified candidates on MahaHub.">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
        <FormGuidelines
          tips={[
            "Be clear and specific about the role and expectations",
            "Use simple, professional language",
            "List accurate salary range and requirements",
            "Detailed job posts attract better candidates",
          ]}
        />
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="title" info="Use a clear title, like 'Senior Frontend Developer' instead of just 'Developer'.">
                  Job Title
                </FieldLabel>
                <Input id="title" placeholder="e.g. Senior Frontend Developer" {...register("title")} />
                {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="companyName" info="Your company's name, shown to job seekers.">
                  Company Name
                </FieldLabel>
                <Input id="companyName" placeholder="Your company name" {...register("companyName")} />
                {errors.companyName && <p className="text-xs text-danger">{errors.companyName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="description" info="Explain the role in a few simple sentences.">
                Job Description
              </FieldLabel>
              <Textarea id="description" placeholder="Describe the role..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="responsibilities" info="List the main tasks for this role.">
                Responsibilities (optional)
              </FieldLabel>
              <Textarea id="responsibilities" placeholder="Key responsibilities..." {...register("responsibilities")} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="requirements" info="Skills or experience needed for this job.">
                Requirements (optional)
              </FieldLabel>
              <Textarea id="requirements" placeholder="Required skills and qualifications..." {...register("requirements")} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="skillsInput" info="Add skills separated by commas, like React, Node.js.">
                Skills (comma separated)
              </FieldLabel>
              <Input id="skillsInput" placeholder="React, Node.js, MongoDB" {...register("skillsInput")} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel info="Choose the type of job this is.">Job Type</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel info="How much experience you expect from candidates.">Experience Level</FieldLabel>
                <Controller
                  control={control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_LEVELS.map((l) => (
                          <SelectItem key={l} value={l} className="capitalize">
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <FieldLabel htmlFor="location" info="City and state for this job.">
                  Location
                </FieldLabel>
                <Input id="location" placeholder="City, State" {...register("location")} />
                {errors.location && <p className="text-xs text-danger">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="salaryMin" info="The lowest salary you can offer.">Min Salary (₹)</FieldLabel>
                <Input id="salaryMin" type="number" min={0} {...register("salaryMin")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="salaryMax" info="The highest salary you can offer.">Max Salary (₹)</FieldLabel>
                <Input id="salaryMax" type="number" min={0} {...register("salaryMax")} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("isRemote")} />
              This is a remote position
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="text-base font-semibold">Privacy &amp; Confidentiality</h3>
              <p className="text-xs text-muted-foreground">Control who can see this job and require an NDA before details are shown.</p>
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
                  This job won't appear in search or public listings — only freelancers you invite can view or apply.
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
                <ShieldCheck className="h-3.5 w-3.5" /> Save this job first, then invite specific freelancers from the edit page.
              </p>
            )}
          </CardContent>
        </Card>

        {mutation.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Something went wrong while saving this job. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Publish Job"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jobApi } from "@/api/jobs";

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"] as const;
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

export default function PostJob({
  role = "employer",
  basePath = "/dashboard/employer",
  entityLabel = "Job",
}: {
  role?: "employer" | "client";
  basePath?: string;
  entityLabel?: "Job" | "Project";
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

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

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        companyName: existing.companyName,
        description: existing.description,
        responsibilities: existing.responsibilities,
        requirements: existing.requirements,
        type: existing.type,
        experienceLevel: existing.experienceLevel,
        location: existing.location,
        isRemote: existing.isRemote,
        salaryMin: existing.salaryMin,
        salaryMax: existing.salaryMax,
        skillsInput: existing.skills.join(", "),
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skillsInput
          ? values.skillsInput.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        status: "open" as const,
      };
      return isEdit ? jobApi.update(id!, payload) : jobApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate(basePath);
    },
  });

  return (
    <DashboardLayout role={role} title={isEdit ? `Edit ${entityLabel}` : `Post a ${entityLabel}`} subtitle="Reach qualified candidates on MahaHub.">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" placeholder="e.g. Senior Frontend Developer" {...register("title")} />
                {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" placeholder="Your company name" {...register("companyName")} />
                {errors.companyName && <p className="text-xs text-danger">{errors.companyName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" placeholder="Describe the role..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities (optional)</Label>
              <Textarea id="responsibilities" placeholder="Key responsibilities..." {...register("responsibilities")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements (optional)</Label>
              <Textarea id="requirements" placeholder="Required skills and qualifications..." {...register("requirements")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsInput">Skills (comma separated)</Label>
              <Input id="skillsInput" placeholder="React, Node.js, MongoDB" {...register("skillsInput")} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Type</Label>
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
                <Label>Experience Level</Label>
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
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="City, State" {...register("location")} />
                {errors.location && <p className="text-xs text-danger">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Min Salary (₹)</Label>
                <Input id="salaryMin" type="number" min={0} {...register("salaryMin")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Salary (₹)</Label>
                <Input id="salaryMax" type="number" min={0} {...register("salaryMax")} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("isRemote")} />
              This is a remote position
            </label>
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

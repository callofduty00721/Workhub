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
import { SkillsInput } from "@/components/shared/SkillsInput";
import { Button } from "@/components/ui/button";
import { contestApi } from "@/api/contests";

const schema = z.object({
  title: z.string().min(2, "Contest title is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().min(20, "Brief should be at least 20 characters"),
  prizeAmount: z.coerce.number().min(1, "Prize amount is required"),
  deadline: z.string().min(1, "Deadline is required"),
  skillsInput: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PostContest({
  role = "employer",
  basePath = "/dashboard/employer/contests",
}: {
  role?: "employer" | "client";
  basePath?: string;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing } = useQuery({ queryKey: ["contests", id], queryFn: () => contestApi.getById(id!), enabled: isEdit });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { prizeAmount: 0 },
  });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        category: existing.category,
        description: existing.description,
        prizeAmount: existing.prizeAmount,
        deadline: existing.deadline.slice(0, 10),
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
      };
      return isEdit ? contestApi.update(id!, payload) : contestApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      navigate(basePath);
    },
  });

  return (
    <DashboardLayout role={role} title={isEdit ? "Edit Contest" : "Post a Contest"} subtitle="Get freelancers to compete and pick the best entry.">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
        <FormGuidelines
          tips={[
            "Be clear about what entries should include",
            "Use simple, professional language",
            "Set a fair prize amount for the effort involved",
            "Clear briefs attract more quality entries",
          ]}
        />
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="title" info="A clear title tells freelancers what you want.">Contest Title</FieldLabel>
                <Input id="title" placeholder="e.g. Design a Logo for Our Startup" {...register("title")} />
                {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="category" info="Type of work, like Graphic Design or Writing.">Category</FieldLabel>
                <Input id="category" placeholder="e.g. Graphic Design" {...register("category")} />
                {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="description" info="Describe what you want in simple words.">
                Brief
              </FieldLabel>
              <Textarea id="description" placeholder="Describe what you're looking for..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="skillsInput" info="Add skills separated by commas.">
                Skills (comma separated)
              </FieldLabel>
              <Controller
                control={control}
                name="skillsInput"
                render={({ field }) => (
                  <SkillsInput
                    id="skillsInput"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Logo Design, Branding, Illustrator"
                  />
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="prizeAmount" info="The prize money for the winner.">
                  Prize Amount (₹)
                </FieldLabel>
                <Input id="prizeAmount" type="number" min={1} {...register("prizeAmount")} />
                {errors.prizeAmount && <p className="text-xs text-danger">{errors.prizeAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="deadline" info="The last date to submit entries.">
                  Submission Deadline
                </FieldLabel>
                <Input id="deadline" type="date" {...register("deadline")} />
                {errors.deadline && <p className="text-xs text-danger">{errors.deadline.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {mutation.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Something went wrong while saving this contest. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Publish Contest"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

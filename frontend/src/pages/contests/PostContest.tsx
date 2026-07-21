import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
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
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Contest Title</Label>
                <Input id="title" placeholder="e.g. Design a Logo for Our Startup" {...register("title")} />
                {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Graphic Design" {...register("category")} />
                {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Brief</Label>
              <Textarea id="description" placeholder="Describe what you're looking for..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsInput">Skills (comma separated)</Label>
              <Input id="skillsInput" placeholder="Logo Design, Branding, Illustrator" {...register("skillsInput")} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prizeAmount">Prize Amount (₹)</Label>
                <Input id="prizeAmount" type="number" min={1} {...register("prizeAmount")} />
                {errors.prizeAmount && <p className="text-xs text-danger">{errors.prizeAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Submission Deadline</Label>
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

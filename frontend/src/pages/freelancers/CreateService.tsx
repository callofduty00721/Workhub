import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serviceApi } from "@/api/freelancers";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { FileUpload } from "@/components/shared/FileUpload";

const schema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters"),
  category: z.string().min(1, "Select a category"),
  subCategory: z.string().optional(),
  description: z.string().min(20, "Description should be at least 20 characters"),
  priceType: z.enum(["fixed", "hourly"]),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  deliveryDays: z.coerce.number().min(1),
  skillsInput: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing } = useQuery({ queryKey: ["services", id], queryFn: () => serviceApi.getById(id!), enabled: isEdit });

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
    defaultValues: { priceType: "fixed", deliveryDays: 3, price: 0 },
  });

  const [images, setImages] = useState<string[]>([]);
  const MAX_IMAGES = 5;

  useEffect(() => {
    if (existing) {
      setImages(existing.images ?? []);
      reset({
        title: existing.title,
        category: existing.category,
        subCategory: existing.subCategory ?? "",
        description: existing.description,
        priceType: existing.priceType,
        price: existing.price,
        deliveryDays: existing.deliveryDays,
        skillsInput: existing.skills.join(", "),
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skillsInput ? values.skillsInput.split(",").map((s) => s.trim()).filter(Boolean) : [],
        images,
        status: "active" as const,
      };
      return isEdit ? serviceApi.update(id!, payload) : serviceApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "mine"] });
      navigate("/dashboard/freelancer/gigs");
    },
  });

  return (
    <DashboardLayout role="freelancer" title={isEdit ? "Edit Gig" : "Create New Gig"} subtitle="Showcase a service you offer to potential clients.">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="title">Gig Title</Label>
              <Input id="title" placeholder="e.g. I will build a responsive React website" {...register("title")} />
              {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
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
                        <SelectValue placeholder="Select category" />
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
                <Label>Sub-Category</Label>
                <SubCategorySelect control={control} category={watch("category")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsInput">Skills (comma separated)</Label>
              <Input id="skillsInput" placeholder="React, Tailwind, Figma" {...register("skillsInput")} />
            </div>

            <div className="space-y-2">
              <Label>Gallery Images (up to {MAX_IMAGES})</Label>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((url, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <FileUpload
                    folder="service_cover"
                    onUploaded={(url) => setImages((prev) => [...prev, url])}
                    label="Add image"
                    className="aspect-square"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe what's included in this gig..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Price Type</Label>
                <Controller
                  control={control}
                  name="priceType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" min={1} {...register("price")} />
                {errors.price && <p className="text-xs text-danger">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDays">Delivery (days)</Label>
                <Input id="deliveryDays" type="number" min={1} {...register("deliveryDays")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {mutation.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Something went wrong while saving this gig. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Publish Gig"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

function SubCategorySelect({ control, category }: { control: Control<FormValues>; category?: string }) {
  const options = category ? SERVICE_CATEGORIES[category] ?? [] : [];
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

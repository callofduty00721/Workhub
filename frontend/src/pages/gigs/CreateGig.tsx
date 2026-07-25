import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FormGuidelines } from "@/components/shared/FormGuidelines";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/shared/FieldInfo";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serviceApi } from "@/api/freelancers";
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { FileUpload } from "@/components/shared/FileUpload";
import type { PackageName, ServicePackage } from "@/types";

const PACKAGE_NAMES: PackageName[] = ["basic", "standard", "premium"];
const EMPTY_PACKAGE = (name: PackageName): ServicePackage => ({ name, title: "", description: "", price: 0, deliveryDays: 3, revisions: 1, features: [] });
const MAX_VIDEO_MB = 50;
const MAX_VIDEO_SECONDS = 60;

function validateGigVideo(file: File): Promise<string | null> {
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) return Promise.resolve(`Video must be under ${MAX_VIDEO_MB}MB.`);
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration > MAX_VIDEO_SECONDS ? `Video must be ${MAX_VIDEO_SECONDS} seconds or shorter.` : null);
    };
    video.onerror = () => resolve("Could not read this video file.");
    video.src = URL.createObjectURL(file);
  });
}

const schema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters"),
  category: z.string().min(1, "Select a category"),
  subCategory: z.string().optional(),
  description: z.string().min(20, "Description should be at least 20 characters"),
  priceType: z.enum(["fixed", "hourly"]),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  deliveryDays: z.coerce.number().min(1),
  // -1 means unlimited.
  revisions: z.coerce.number().min(-1),
  skillsInput: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateGig() {
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
    defaultValues: { priceType: "fixed", deliveryDays: 3, price: 0, revisions: 1 },
  });

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState("");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const MAX_IMAGES = 5;

  useEffect(() => {
    if (existing) {
      setImages(existing.images ?? []);
      setVideo(existing.video ?? "");
      setPackages(existing.packages ?? []);
      reset({
        title: existing.title,
        category: existing.category,
        subCategory: existing.subCategory ?? "",
        description: existing.description,
        priceType: existing.priceType,
        price: existing.price,
        deliveryDays: existing.deliveryDays,
        revisions: existing.revisions ?? 1,
        skillsInput: existing.skills.join(", "),
      });
    }
  }, [existing, reset]);

  const usedPackageNames = new Set(packages.map((p) => p.name));
  const addPackage = () => {
    const nextName = PACKAGE_NAMES.find((n) => !usedPackageNames.has(n));
    if (nextName) setPackages((prev) => [...prev, EMPTY_PACKAGE(nextName)]);
  };
  const updatePackage = (index: number, patch: Partial<ServicePackage>) =>
    setPackages((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const removePackage = (index: number) => setPackages((prev) => prev.filter((_, i) => i !== index));

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skillsInput ? values.skillsInput.split(",").map((s) => s.trim()).filter(Boolean) : [],
        images,
        video,
        packages: packages.filter((p) => p.price > 0 && p.deliveryDays > 0),
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
        <FormGuidelines
          tips={[
            "Be clear and concise about what you're offering",
            "Use simple, professional language",
            "Add accurate pricing and delivery timelines",
            "Detailed gigs with samples get more orders",
          ]}
        />
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="title" info="Start with 'I will...' and be clear about what you offer.">
                Gig Title
              </FieldLabel>
              <Input id="title" placeholder="e.g. I will build a responsive React website" {...register("title")} />
              {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel info="Pick the category that fits your service.">Category</FieldLabel>
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
                <FieldLabel info="A more specific type within your category.">Sub-Category</FieldLabel>
                <SubCategorySelect control={control} category={watch("category")} />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="skillsInput" info="Add skills separated by commas.">
                Skills (comma separated)
              </FieldLabel>
              <Input id="skillsInput" placeholder="React, Tailwind, Figma" {...register("skillsInput")} />
            </div>

            <div className="space-y-2">
              <FieldLabel info="Add photos of your past work.">
                Gallery Images (up to {MAX_IMAGES})
              </FieldLabel>
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
              <FieldLabel info="A short video introducing yourself (optional).">
                Gig Video (optional, max {MAX_VIDEO_SECONDS}s, {MAX_VIDEO_MB}MB)
              </FieldLabel>
              {video ? (
                <div className="relative">
                  <video src={video} controls className="aspect-video w-full max-w-sm rounded-lg border border-border" />
                  <button
                    type="button"
                    onClick={() => setVideo("")}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <FileUpload
                  folder="service_video"
                  accept="video/mp4,video/webm,video/quicktime"
                  onUploaded={(url) => setVideo(url)}
                  validate={validateGigVideo}
                  label={`Upload a short intro video (max ${MAX_VIDEO_SECONDS}s, ${MAX_VIDEO_MB}MB)`}
                  className="max-w-sm"
                />
              )}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="description" info="Explain what's included in simple words.">
                Description
              </FieldLabel>
              <Textarea id="description" placeholder="Describe what's included in this gig..." {...register("description")} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel info="Fixed: one price for everything. Hourly: pay per hour.">Price Type</FieldLabel>
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
                <FieldLabel htmlFor="price" info="Price for this gig (used if you don't add packages below).">Price (₹)</FieldLabel>
                <Input id="price" type="number" min={1} {...register("price")} />
                {errors.price && <p className="text-xs text-danger">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="deliveryDays" info="How many days you need to finish the work.">
                  Delivery (days)
                </FieldLabel>
                <Input id="deliveryDays" type="number" min={1} {...register("deliveryDays")} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="revisions" info="How many times a buyer can ask for changes after delivery.">
                  Revisions
                </FieldLabel>
                <Input
                  id="revisions"
                  type="number"
                  min={0}
                  disabled={watch("revisions") === -1}
                  value={watch("revisions") === -1 ? "" : watch("revisions")}
                  onChange={(e) => setValue("revisions", Number(e.target.value))}
                  placeholder={watch("revisions") === -1 ? "Unlimited" : undefined}
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border"
                    checked={watch("revisions") === -1}
                    onChange={(e) => setValue("revisions", e.target.checked ? -1 : 1)}
                  />
                  Unlimited revisions
                </label>
              </div>
            </div>
            {packages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                You've added package tiers below — buyers will choose one of those instead of this flat price.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Package Tiers (optional)</h3>
                <p className="text-xs text-muted-foreground">Offer Basic / Standard / Premium options so buyers can pick their scope and budget.</p>
              </div>
              {packages.length < PACKAGE_NAMES.length && (
                <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                  <Plus className="h-3.5 w-3.5" /> Add Tier
                </Button>
              )}
            </div>

            {packages.map((pkg, i) => (
              <div key={pkg.name} className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold capitalize text-primary">{pkg.name}</span>
                  <button type="button" onClick={() => removePackage(i)} className="text-danger hover:opacity-80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label>Package Title</Label>
                  <Input value={pkg.title ?? ""} onChange={(e) => updatePackage(i, { title: e.target.value })} placeholder="e.g. Landing Page Only" />
                </div>
                <div className="space-y-1.5">
                  <Label>What's Included</Label>
                  <Textarea
                    value={pkg.description ?? ""}
                    onChange={(e) => updatePackage(i, { description: e.target.value })}
                    placeholder="Describe the scope of this tier..."
                    className="min-h-[60px]"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Price (₹)</Label>
                    <Input type="number" min={1} value={pkg.price || ""} onChange={(e) => updatePackage(i, { price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Delivery (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={pkg.deliveryDays || ""}
                      onChange={(e) => updatePackage(i, { deliveryDays: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Revisions</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={pkg.revisions === -1}
                      value={pkg.revisions === -1 ? "" : (pkg.revisions ?? 1)}
                      onChange={(e) => updatePackage(i, { revisions: Number(e.target.value) })}
                      placeholder={pkg.revisions === -1 ? "Unlimited" : undefined}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-border"
                        checked={pkg.revisions === -1}
                        onChange={(e) => updatePackage(i, { revisions: e.target.checked ? -1 : 1 })}
                      />
                      Unlimited
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Features (comma separated)</Label>
                  <Input
                    value={pkg.features?.join(", ") ?? ""}
                    onChange={(e) =>
                      updatePackage(i, { features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                    }
                    placeholder="Responsive design, 2 pages, Source files"
                  />
                </div>
              </div>
            ))}
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

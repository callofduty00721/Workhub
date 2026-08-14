import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  X,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Bold,
  Italic,
  Underline,
  List,
  Star,
  Eye,
  FileText,
  Tag,
  Code2,
  Globe2,
  IndianRupee,
  ClipboardList,
  Image as ImageIcon,
  Rocket,
  Lightbulb,
  Video as VideoIcon,
  Link2,
  Zap,
  Sparkles,
  LifeBuoy,
  GraduationCap,
  Lock,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldLabel, FieldInfo } from "@/components/shared/FieldInfo";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { serviceApi } from "@/api/freelancers";
import { SERVICE_CATEGORY_NAMES, SERVICE_SUBCATEGORIES } from "@/lib/mockData";
import { ALL_SKILLS } from "@/lib/skillsData";
import { FileUpload } from "@/components/shared/FileUpload";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { renderBioHtml, toggleMarkerAroundSelection, toggleBulletList } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";
import type { PackageName, ServicePackage } from "@/types";

const PACKAGE_NAMES: PackageName[] = ["basic", "standard", "premium"];
const EMPTY_PACKAGE = (name: PackageName): ServicePackage => ({ name, title: "", description: "", price: 0, deliveryDays: 3, revisions: 1, features: [] });
const PACKAGE_ACCENT: Record<PackageName, string> = {
  basic: "border-success/30 bg-success/5",
  standard: "border-blue-500/30 bg-blue-500/5",
  premium: "border-brand/30 bg-brand/5",
};
const PACKAGE_LABEL_ACCENT: Record<PackageName, string> = {
  basic: "text-success",
  standard: "text-blue-600",
  premium: "text-brand",
};
const PACKAGE_DEFAULT_COPY: Record<PackageName, string> = {
  basic: "Perfect for small projects and basic requirements.",
  standard: "Great for growing businesses and advanced needs.",
  premium: "Complete solution for large projects and businesses.",
};
const DELIVERY_DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30];
const MAX_IMAGES = 10;

const MAX_SKILLS = 10;
const MAX_TITLE_LENGTH = 80;
const MAX_LANGUAGES = 10;
const EXPERIENCE_LEVEL_META: { key: "beginner" | "intermediate" | "expert"; label: string; subtitle: string }[] = [
  { key: "beginner", label: "Beginner", subtitle: "New to freelancing" },
  { key: "intermediate", label: "Intermediate", subtitle: "1-3 years experience" },
  { key: "expert", label: "Expert", subtitle: "3+ years experience" },
];
const EXTRAS_PRESETS: { label: string; description: string; defaultPrice: number; icon: LucideIcon }[] = [
  { label: "Express Delivery (3 Days)", description: "Get your project delivered within 3 days.", defaultPrice: 5000, icon: Zap },
  { label: "Additional Page", description: "Add an extra page to your website.", defaultPrice: 2000, icon: FileText },
  { label: "Additional Features", description: "Add custom features as per your requirements.", defaultPrice: 3000, icon: Sparkles },
  { label: "30 Days Free Support", description: "I will provide free support for 30 days.", defaultPrice: 4000, icon: LifeBuoy },
  { label: "Deployment", description: "Deploy your project to a live server.", defaultPrice: 2500, icon: Rocket },
  { label: "Training", description: "One-on-one training session on how to use your project.", defaultPrice: 2000, icon: GraduationCap },
];

const MAX_TAGS = 15;
const RESPONSE_TIME_OPTIONS = ["Within 1 Hour", "Within a few hours", "Within a day", "Within 2 days"] as const;
const CANCELLATION_POLICY_OPTIONS: { value: "Flexible" | "Standard" | "Strict"; label: string }[] = [
  { value: "Flexible", label: "Flexible" },
  { value: "Standard", label: "Standard (Recommended)" },
  { value: "Strict", label: "Strict" },
];
const VISIBILITY_META: { key: "active" | "private" | "draft"; label: string; subtitle: string; icon: LucideIcon }[] = [
  { key: "active", label: "Public", subtitle: "Anyone can find and order your gig", icon: Globe2 },
  { key: "private", label: "Private", subtitle: "Only people with the link can view", icon: Lock },
  { key: "draft", label: "Draft", subtitle: "Save as draft and publish later", icon: FileText },
];

const STEPS = ["Basic Information", "Pricing", "Details", "Gallery & Extras", "Publish"] as const;
const STEP_META: { title: string; subtitle: string; icon: LucideIcon }[] = [
  { title: "Basic Information", subtitle: "Tell us about your gig.", icon: FileText },
  { title: "Pricing", subtitle: "Set your packages and pricing.", icon: Tag },
  { title: "Service Details", subtitle: "Describe what you will deliver.", icon: ClipboardList },
  { title: "Gallery & Extras", subtitle: "Add images, video and extra services.", icon: ImageIcon },
  { title: "Publish Gig", subtitle: "Review your gig and publish.", icon: Rocket },
];

const schema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters").max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`),
  category: z.string().min(1, "Select a category"),
  subCategory: z.string().optional(),
  description: z.string().min(20, "Description should be at least 20 characters"),
  priceType: z.enum(["fixed", "hourly"]),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  deliveryDays: z.coerce.number().min(1),
  // -1 means unlimited.
  revisions: z.coerce.number().min(-1),
  skillsInput: z.string().optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "expert"]),
  liveDemoUrl: z.string().optional(),
  status: z.enum(["active", "private", "draft"]),
  responseTime: z.enum(RESPONSE_TIME_OPTIONS),
  cancellationPolicy: z.enum(["Flexible", "Standard", "Strict"]),
});

type FormValues = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ["title", "category"],
  2: ["price", "deliveryDays"],
  3: ["description"],
  4: [],
  5: [],
};

const STEP_SIDE_TIPS: Record<number, string> = {
  2: "Offering multiple packages helps clients choose the best option for their budget and needs.",
  4: "High-quality images and videos increase client trust and can get you more orders.",
};

const PUBLISHING_TIPS = [
  "Add a compelling title and description",
  "Use high-quality images and videos",
  "Add relevant tags to increase visibility",
  "Respond to buyers quickly",
];

export default function CreateGig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEdit = !!id;

  const { data: existing } = useQuery({ queryKey: ["services", id], queryFn: () => serviceApi.getById(id!), enabled: isEdit });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priceType: "fixed",
      deliveryDays: 3,
      price: 0,
      revisions: 1,
      experienceLevel: "beginner",
      status: "active",
      responseTime: "Within a day",
      cancellationPolicy: "Standard",
    },
  });

  const [step, setStep] = useState(1);
  const [showTip, setShowTip] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState("");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [multiPackageEnabled, setMultiPackageEnabled] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<Set<PackageName>>(new Set());
  const [featuresText, setFeaturesText] = useState<Partial<Record<PackageName, string>>>({});
  const [languages, setLanguages] = useState<string[]>([]);
  const [extras, setExtras] = useState<{ label: string; price: number }[]>([]);
  const [customExtraLabel, setCustomExtraLabel] = useState("");
  const [customExtraPrice, setCustomExtraPrice] = useState(0);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsSeeded, setTagsSeeded] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: descRhfRef, ...descRegister } = register("description");

  useEffect(() => {
    if (existing) {
      setImages(existing.images ?? []);
      setVideo(existing.video ?? "");
      setPackages(existing.packages ?? []);
      setMultiPackageEnabled(!!existing.packages?.length);
      setLanguages(existing.languages ?? []);
      setExtras(existing.extras ?? []);
      setTags(existing.tags ?? []);
      setTagsSeeded(true);
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
        experienceLevel: existing.experienceLevel ?? "beginner",
        liveDemoUrl: existing.liveDemoUrl ?? "",
        status: existing.status === "draft" || existing.status === "private" ? existing.status : "active",
        responseTime: existing.responseTime ?? "Within a day",
        cancellationPolicy: existing.cancellationPolicy ?? "Standard",
      });
    }
  }, [existing, reset]);

  const handleToggleMultiPackage = (checked: boolean) => {
    setMultiPackageEnabled(checked);
    // Seed all three tiers the first time it's turned on — but if the user
    // had already entered tiers and just toggled off/on to compare against
    // the flat price, keep whatever they typed instead of wiping it.
    if (checked && packages.length === 0) setPackages(PACKAGE_NAMES.map((n) => EMPTY_PACKAGE(n)));
  };
  const updatePackage = (index: number, patch: Partial<ServicePackage>) =>
    setPackages((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const removePackage = (index: number) =>
    setPackages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setMultiPackageEnabled(false);
      return next;
    });
  const toggleExpandedPackage = (name: PackageName) =>
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const toggleExtra = (label: string, defaultPrice: number) =>
    setExtras((prev) => (prev.some((e) => e.label === label) ? prev.filter((e) => e.label !== label) : [...prev, { label, price: defaultPrice }]));
  const removeExtra = (label: string) => setExtras((prev) => prev.filter((e) => e.label !== label));
  const addCustomExtra = () => {
    const label = customExtraLabel.trim();
    if (!label || customExtraPrice <= 0 || extras.some((e) => e.label.toLowerCase() === label.toLowerCase())) return;
    setExtras((prev) => [...prev, { label, price: customExtraPrice }]);
    setCustomExtraLabel("");
    setCustomExtraPrice(0);
  };

  const applyDescMarker = (marker: string) => {
    const el = descriptionRef.current;
    if (!el) return;
    const value = watch("description") ?? "";
    const result = toggleMarkerAroundSelection(value, el.selectionStart ?? value.length, el.selectionEnd ?? value.length, marker);
    setValue("description", result.value, { shouldValidate: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const applyDescList = () => {
    const el = descriptionRef.current;
    if (!el) return;
    const value = watch("description") ?? "";
    const result = toggleBulletList(value, el.selectionStart ?? value.length, el.selectionEnd ?? value.length);
    setValue("description", result.value, { shouldValidate: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const goNext = async () => {
    if (step === 2 && multiPackageEnabled) {
      const hasValidTier = packages.some((p) => p.price > 0 && p.deliveryDays > 0);
      setPricingError(hasValidTier ? null : "Enter a price and delivery time for at least one package tier to continue.");
      if (!hasValidTier) return;
      setStep((s) => Math.min(s + 1, STEPS.length));
      return;
    }
    const fields = STEP_FIELDS[step];
    if (fields.length) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skillsInput ? values.skillsInput.split(",").map((s) => s.trim()).filter(Boolean) : [],
        images,
        video,
        packages: multiPackageEnabled ? packages.filter((p) => p.price > 0 && p.deliveryDays > 0) : [],
        languages,
        extras,
        tags,
      };
      return isEdit ? serviceApi.update(id!, payload) : serviceApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "mine"] });
      navigate("/dashboard/freelancer/gigs");
    },
  });

  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const watchedPrice = watch("price");
  const watchedDeliveryDays = watch("deliveryDays");
  const watchedRevisions = watch("revisions");
  const watchedSkillsInput = watch("skillsInput");
  const searchTags = (watchedSkillsInput ? watchedSkillsInput.split(",").map((s) => s.trim()).filter(Boolean) : []).slice(0, 5);
  const meta = STEP_META[step - 1];

  useEffect(() => {
    if (!tagsSeeded && searchTags.length > 0) {
      setTags(searchTags);
      setTagsSeeded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTags, tagsSeeded]);

  const cheapestPackage = packages.reduce<ServicePackage | null>(
    (min, p) => (p.price > 0 && (!min || p.price < min.price) ? p : min),
    null
  );
  const previewPrice = cheapestPackage?.price ?? watchedPrice;
  const previewDeliveryDays = cheapestPackage?.deliveryDays ?? watchedDeliveryDays;
  const previewRevisions = cheapestPackage?.revisions ?? watchedRevisions;

  // The backend's flat price/deliveryDays fields are still required even when
  // package tiers are used — keep them mirroring the cheapest tier so the
  // final-submit schema validation (which always checks price/deliveryDays)
  // doesn't silently fail on the stale price:0 default from before packages
  // were turned on.
  useEffect(() => {
    if (multiPackageEnabled && cheapestPackage) {
      setValue("price", cheapestPackage.price);
      setValue("deliveryDays", cheapestPackage.deliveryDays);
      setPricingError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiPackageEnabled, cheapestPackage?.price, cheapestPackage?.deliveryDays]);

  return (
    <DashboardLayout
      role="freelancer"
      title={isEdit ? "Edit Gig" : "Create a Gig"}
      subtitle={isEdit ? "Update your gig details." : "Create a professional gig and start getting orders."}
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5" noValidate>
        <StepIndicator current={step} onStepClick={(s) => (s < step ? setStep(s) : undefined)} />

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {step === 1 && (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader icon={meta.icon} title={meta.title} subtitle={meta.subtitle} />

                  <div className="space-y-2">
                    <FieldLabel htmlFor="title" info="Start with 'I will...' and be clear about what you offer.">
                      Gig Title <span className="text-danger">*</span>
                    </FieldLabel>
                    <Input id="title" placeholder="e.g. I will build a responsive React website" maxLength={MAX_TITLE_LENGTH} {...register("title")} />
                    <div className="flex items-center justify-between">
                      {errors.title ? <p className="text-xs text-danger">{errors.title.message}</p> : <span />}
                      <p className="text-[11px] text-muted-foreground">
                        {(watch("title") ?? "").length} / {MAX_TITLE_LENGTH}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel info="Pick the category that fits your service.">
                        Category <span className="text-danger">*</span>
                      </FieldLabel>
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
                      <FieldLabel info="A more specific type within your category.">
                        Sub-Category <span className="text-danger">*</span>
                      </FieldLabel>
                      <SubCategorySelect control={control} category={watch("category")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="skillsInput" info="Add the technologies or skills this gig covers.">
                      Skills (Max {MAX_SKILLS})
                    </FieldLabel>
                    <Controller
                      control={control}
                      name="skillsInput"
                      render={({ field }) => (
                        <SkillsChipInput id="skillsInput" value={field.value ?? ""} onChange={field.onChange} max={MAX_SKILLS} />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel info="How experienced you are with this kind of work.">
                      Experience Level <span className="text-danger">*</span>
                    </FieldLabel>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {EXPERIENCE_LEVEL_META.map(({ key, label, subtitle }) => {
                        const selected = watch("experienceLevel") === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setValue("experienceLevel", key)}
                            className={`relative rounded-lg border p-3 text-left transition-colors ${
                              selected ? "border-brand bg-brand/10" : "border-border bg-card hover:border-brand/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  selected ? "border-brand bg-brand" : "border-border"
                                }`}
                              >
                                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="text-sm font-medium">{label}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                            {selected && (
                              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-brand-foreground">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel info="Type a language and press Enter to add it.">
                      Languages <span className="text-danger">*</span>
                    </FieldLabel>
                    <TagsChipInput tags={languages} onChange={setLanguages} max={MAX_LANGUAGES} />
                  </div>

                  {showTip && (
                    <div className="flex items-start gap-2 rounded-lg bg-brand/10 p-3 text-xs text-brand">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="flex-1">
                        <span className="font-semibold">Pro Tip:</span> A clear and specific title helps you get more views and orders.
                      </p>
                      <button type="button" onClick={() => setShowTip(false)} className="text-brand/70 hover:text-brand" aria-label="Dismiss tip">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <SectionHeader icon={meta.icon} title="Pricing Packages" subtitle="Create packages that fit different client needs." />
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium">Multi-package Gig</span>
                      <ToggleSwitch checked={multiPackageEnabled} onChange={handleToggleMultiPackage} />
                      <FieldInfo text="Offer Basic / Standard / Premium tiers instead of one flat price." />
                    </div>
                  </div>

                  {!multiPackageEnabled ? (
                    <>
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
                          <FieldLabel htmlFor="price" info="Price for this gig.">Price (₹)</FieldLabel>
                          <Input id="price" type="number" min={1} {...register("price")} />
                          {errors.price && <p className="text-xs text-danger">{errors.price.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <FieldLabel htmlFor="deliveryDays" info="How many days you need to finish the work.">
                            Delivery (days)
                          </FieldLabel>
                          <Input id="deliveryDays" type="number" min={1} {...register("deliveryDays")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <FieldLabel htmlFor="revisions" info="How many times a buyer can ask for changes after delivery.">
                          Revisions
                        </FieldLabel>
                        <div className="flex items-center gap-3">
                          <Input
                            id="revisions"
                            type="number"
                            min={0}
                            className="max-w-[140px]"
                            disabled={watch("revisions") === -1}
                            value={watch("revisions") === -1 ? "" : watch("revisions")}
                            onChange={(e) => setValue("revisions", Number(e.target.value))}
                            placeholder={watch("revisions") === -1 ? "Unlimited" : undefined}
                          />
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-border accent-brand"
                              checked={watch("revisions") === -1}
                              onChange={(e) => setValue("revisions", e.target.checked ? -1 : 1)}
                            />
                            Unlimited revisions
                          </label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        {packages.map((pkg, i) => {
                          const expanded = expandedPackages.has(pkg.name);
                          return (
                            <div key={pkg.name} className={`flex flex-col space-y-3 rounded-lg border p-4 ${PACKAGE_ACCENT[pkg.name]}`}>
                              <div className="flex items-start justify-between">
                                <span className={`text-base font-bold capitalize ${PACKAGE_LABEL_ACCENT[pkg.name]}`}>{pkg.name}</span>
                                <div className="flex items-center gap-1.5">
                                  {pkg.name === "standard" && (
                                    <Badge className="gap-1 border-transparent bg-brand/10 text-[10px] text-brand">
                                      <Star className="h-2.5 w-2.5 fill-brand" /> Recommended
                                    </Badge>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      className="rounded p-1 text-muted-foreground hover:bg-muted"
                                      aria-label={`${pkg.name} tier options`}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => removePackage(i)} className="text-danger">
                                        <Trash2 className="h-3.5 w-3.5" /> Remove Tier
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground">{pkg.description || PACKAGE_DEFAULT_COPY[pkg.name]}</p>

                              <div className="relative">
                                <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min={1}
                                  className="pl-8 text-base font-semibold"
                                  value={pkg.price || ""}
                                  onChange={(e) => updatePackage(i, { price: Number(e.target.value) })}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Delivery Time</Label>
                                  <Select value={String(pkg.deliveryDays)} onValueChange={(v) => updatePackage(i, { deliveryDays: Number(v) })}>
                                    <SelectTrigger className="h-9 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DELIVERY_DAY_OPTIONS.map((d) => (
                                        <SelectItem key={d} value={String(d)}>
                                          {d} {d === 1 ? "Day" : "Days"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Revisions</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-9 text-xs"
                                    disabled={pkg.revisions === -1}
                                    value={pkg.revisions === -1 ? "" : (pkg.revisions ?? 1)}
                                    onChange={(e) => updatePackage(i, { revisions: Number(e.target.value) })}
                                    placeholder={pkg.revisions === -1 ? "Unlimited" : undefined}
                                  />
                                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <input
                                      type="checkbox"
                                      className="h-3 w-3 rounded border-border accent-brand"
                                      checked={pkg.revisions === -1}
                                      onChange={(e) => updatePackage(i, { revisions: e.target.checked ? -1 : 1 })}
                                    />
                                    Unlimited
                                  </label>
                                </div>
                              </div>

                              <div className="flex-1 space-y-1.5">
                                <Label className="text-xs text-muted-foreground">What's Included</Label>
                                {pkg.features?.length ? (
                                  <ul className="space-y-1">
                                    {pkg.features.map((f) => (
                                      <li key={f} className="flex items-center gap-1.5 text-xs">
                                        <Check className={`h-3 w-3 shrink-0 ${PACKAGE_LABEL_ACCENT[pkg.name]}`} />
                                        <span>{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-muted-foreground">No features added yet.</p>
                                )}
                              </div>

                              {expanded ? (
                                <div className="space-y-2 rounded-md border border-dashed border-border p-2.5">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Package Title</Label>
                                    <Input
                                      value={pkg.title ?? ""}
                                      onChange={(e) => updatePackage(i, { title: e.target.value })}
                                      placeholder="e.g. Landing Page Only"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Description</Label>
                                    <Textarea
                                      value={pkg.description ?? ""}
                                      onChange={(e) => updatePackage(i, { description: e.target.value })}
                                      placeholder={PACKAGE_DEFAULT_COPY[pkg.name]}
                                      className="min-h-[50px] text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Features (comma separated)</Label>
                                    <Input
                                      value={featuresText[pkg.name] ?? pkg.features?.join(", ") ?? ""}
                                      onChange={(e) => {
                                        const text = e.target.value;
                                        setFeaturesText((prev) => ({ ...prev, [pkg.name]: text }));
                                        updatePackage(i, { features: text.split(",").map((s) => s.trim()).filter(Boolean) });
                                      }}
                                      placeholder="Responsive design, 2 pages, Source files"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => toggleExpandedPackage(pkg.name)}>
                                    Done
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={`w-full border-current ${PACKAGE_LABEL_ACCENT[pkg.name]}`}
                                  onClick={() => toggleExpandedPackage(pkg.name)}
                                >
                                  Edit Features
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {pricingError && <p className="text-xs text-danger">{pricingError}</p>}

                      <div className="flex items-start gap-2 rounded-lg bg-brand/10 p-3 text-xs text-brand">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>Click "Edit Features" on any package to customize its title, description and feature list.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <SectionHeader icon={meta.icon} title={meta.title} subtitle={meta.subtitle} />

                  <div className="space-y-2">
                    <FieldLabel htmlFor="description" info="Explain what's included in simple words.">
                      Service Description
                    </FieldLabel>
                    <div className="flex items-center gap-1 rounded-t-lg border border-b-0 border-border bg-muted/40 p-1.5">
                      <button type="button" onClick={() => applyDescMarker("**")} className="rounded p-1.5 hover:bg-muted" aria-label="Bold">
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => applyDescMarker("*")} className="rounded p-1.5 hover:bg-muted" aria-label="Italic">
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => applyDescMarker("__")} className="rounded p-1.5 hover:bg-muted" aria-label="Underline">
                        <Underline className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={applyDescList} className="rounded p-1.5 hover:bg-muted" aria-label="Bullet list">
                        <List className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Describe what's included in this gig..."
                      className="min-h-[140px] rounded-t-none border-border focus-visible:ring-brand"
                      {...descRegister}
                      ref={(el) => {
                        descRhfRef(el);
                        descriptionRef.current = el;
                      }}
                    />
                    {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">Gallery Images</h2>
                      <p className="text-xs text-muted-foreground">Add high-quality images that showcase your work.</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Tips for great images</span>
                      <FieldInfo text="Use bright, well-lit photos. Show your actual work, not stock images. Square or landscape photos work best." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {images.length < MAX_IMAGES && (
                        <FileUpload
                          folder="service_cover"
                          onUploaded={(url) => setImages((prev) => [...prev, url])}
                          label="Upload Image"
                          className="aspect-square"
                        />
                      )}
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
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended size 1280×960px (max 10MB per image). You can add up to {MAX_IMAGES} images.
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-border pt-5">
                    <div>
                      <h2 className="text-base font-semibold">Video (Optional)</h2>
                      <p className="text-xs text-muted-foreground">Add a video to better explain your service.</p>
                    </div>
                    <div className="relative">
                      <VideoIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={video}
                        onChange={(e) => setVideo(e.target.value)}
                        placeholder="Paste YouTube or Vimeo link here"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="liveDemoUrl" info="Link to a live example of your work (optional).">
                      Live Demo URL (Optional)
                    </FieldLabel>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="liveDemoUrl" placeholder="https://your-demo.com" className="pl-9" {...register("liveDemoUrl")} />
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border pt-5">
                    <div>
                      <h2 className="text-base font-semibold">Extras (Upsell Services)</h2>
                      <p className="text-xs text-muted-foreground">Offer additional services to increase your earnings.</p>
                    </div>
                    <div className="space-y-2">
                      {EXTRAS_PRESETS.map(({ label, description, defaultPrice, icon: Icon }) => {
                        const active = extras.find((e) => e.label === label);
                        return (
                          <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Icon className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-xs text-muted-foreground">{description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-foreground">+{formatCurrency(defaultPrice)}</span>
                              <ToggleSwitch checked={!!active} onChange={() => toggleExtra(label, defaultPrice)} />
                            </div>
                          </div>
                        );
                      })}
                      {extras
                        .filter((e) => !EXTRAS_PRESETS.some((p) => p.label === e.label))
                        .map((extra) => (
                          <div key={extra.label} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Plus className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-sm font-medium">{extra.label}</p>
                                <p className="text-xs text-muted-foreground">Custom extra</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-foreground">+{formatCurrency(extra.price)}</span>
                              <button
                                type="button"
                                onClick={() => removeExtra(extra.label)}
                                className="text-danger hover:opacity-80"
                                aria-label={`Remove ${extra.label}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
                      <Input
                        value={customExtraLabel}
                        onChange={(e) => setCustomExtraLabel(e.target.value)}
                        placeholder="Custom extra name"
                        className="h-9 min-w-[160px] flex-1 text-sm"
                      />
                      <div className="relative w-32">
                        <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          min={0}
                          value={customExtraPrice || ""}
                          onChange={(e) => setCustomExtraPrice(Number(e.target.value))}
                          placeholder="Price"
                          className="h-9 pl-7 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomExtra}
                        disabled={!customExtraLabel.trim() || customExtraPrice <= 0}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 5 && (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div>
                    <h2 className="text-base font-semibold">Publish Your Gig</h2>
                    <p className="text-xs text-muted-foreground">Review your gig settings and publish it for buyers to find.</p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <FieldLabel info="Who can find and view this gig.">Gig Visibility</FieldLabel>
                        <p className="text-xs text-muted-foreground">Choose who can see your gig.</p>
                        <div className="space-y-2">
                          {VISIBILITY_META.map(({ key, label, subtitle, icon: Icon }) => {
                            const selected = watch("status") === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setValue("status", key)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                  selected ? "border-brand bg-brand/10" : "border-border bg-card hover:border-brand/40"
                                }`}
                              >
                                {selected ? (
                                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-brand bg-brand">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                  </span>
                                ) : (
                                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{label}</p>
                                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel info="Keywords buyers can search for to find this gig.">Search Tags</FieldLabel>
                        <p className="text-xs text-muted-foreground">Add relevant keywords to help buyers find your gig.</p>
                        <TagsChipInput tags={tags} onChange={setTags} max={MAX_TAGS} />
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-muted-foreground">Maximum {MAX_TAGS} tags allowed</p>
                          <p className="text-[11px] text-muted-foreground">
                            {tags.length} / {MAX_TAGS}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Gig Title Preview</Label>
                        <p className="text-xs text-muted-foreground">This is how your title will appear in search results.</p>
                        <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
                          {watchedTitle || "Your gig title will appear here"}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {(watchedTitle ?? "").length} / {MAX_TITLE_LENGTH} characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Category Preview</Label>
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-muted-foreground">{watch("category") || "—"}</span>
                          {watch("subCategory") && (
                            <>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{watch("subCategory")}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel info="How quickly you commit to replying to buyer messages on this gig.">Response Time</FieldLabel>
                        <p className="text-xs text-muted-foreground">Set your expected response time to buyers.</p>
                        <Controller
                          control={control}
                          name="responseTime"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESPONSE_TIME_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <FieldLabel info="What happens if a buyer cancels an order on this gig.">Cancellation Policy</FieldLabel>
                        <p className="text-xs text-muted-foreground">Choose your cancellation policy.</p>
                        <Controller
                          control={control}
                          name="cancellationPolicy"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CANCELLATION_POLICY_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <FieldInfo text="Editing a published gig updates this policy immediately for future orders." />
                          You can update this later from gig settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg bg-brand/10 p-4">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-brand">Your Gig is Almost Ready!</p>
                      <p className="flex items-center gap-1.5 text-xs text-brand">
                        <Check className="h-3 w-3 shrink-0" /> You can preview how your gig will look to buyers on the right.
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-brand">
                        <Check className="h-3 w-3 shrink-0" /> Once published, your gig will be live and visible in search results.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {mutation.isError && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                Something went wrong while saving this gig. Please try again.
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <LivePreview
              variant={step === 2 ? "summary" : "preview"}
              heading={step === 5 ? "Gig Preview" : undefined}
              title={watchedTitle}
              description={watchedDescription}
              images={images}
              skills={searchTags}
              price={previewPrice}
              deliveryDays={previewDeliveryDays}
              revisions={previewRevisions}
              responseTime={watch("responseTime")}
              freelancerName={user?.name ?? "You"}
              freelancerAvatar={user?.avatar}
              freelancerRating={user?.rating}
              category={watch("category")}
              subCategory={watch("subCategory")}
              experienceLevelLabel={EXPERIENCE_LEVEL_META.find((l) => l.key === watch("experienceLevel"))?.label}
              languages={languages}
              onEdit={() => setStep(1)}
            />
            {step === 5 ? (
              <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                <p className="mb-2 text-sm font-semibold text-success">Publishing Tips</p>
                <ul className="space-y-1.5">
                  {PUBLISHING_TIPS.map((tip) => (
                    <li key={tip} className="flex items-start gap-1.5 text-xs text-foreground/90">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              STEP_SIDE_TIPS[step] && (
                <div className="flex items-start gap-2 rounded-lg bg-brand/10 p-3 text-xs text-brand">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Pro Tip</p>
                    <p className="mt-0.5">{STEP_SIDE_TIPS[step]}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {step} of {STEPS.length}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            {step < STEPS.length ? (
              <Button key="continue" type="button" className="bg-brand text-brand-foreground hover:brightness-90" onClick={goNext}>
                Save &amp; Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button key="submit" type="submit" className="bg-success text-success-foreground hover:opacity-90" disabled={isSubmitting || mutation.isPending}>
                {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : watch("status") === "draft" ? "Save as Draft" : "Publish Gig"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}

function TagsChipInput({ tags, onChange, max }: { tags: string[]; onChange: (tags: string[]) => void; max: number }) {
  const [text, setText] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.length >= max || tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...tags, trimmed]);
    setText("");
  };
  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
            <X className="h-3 w-3 text-brand/70 hover:text-brand" />
          </button>
        </span>
      ))}
      {tags.length < max && (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && text.trim()) {
              e.preventDefault();
              addTag(text);
            } else if (e.key === "Backspace" && !text && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          placeholder={tags.length === 0 ? "Add a tag and press Enter" : ""}
          className="min-w-[100px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
      <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

function SkillsChipInput({
  id,
  value,
  onChange,
  max,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const skills = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const suggestions = useMemo(() => {
    if (!text) return [];
    const query = text.toLowerCase();
    const chosen = new Set(skills.map((s) => s.toLowerCase()));
    return ALL_SKILLS.filter((s) => s.toLowerCase().includes(query) && !chosen.has(s.toLowerCase())).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const addSkill = (skill: string) => {
    if (skills.length >= max || skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    onChange([...skills, skill].join(", "));
    setText("");
  };
  const removeSkill = (skill: string) => onChange(skills.filter((s) => s !== skill).join(", "));

  return (
    <div className="relative">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        {skills.map((skill) => (
          <span key={skill} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
            {skill}
            <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </span>
        ))}
        {skills.length < max && (
          <input
            id={id}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 100)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && text.trim()) {
                e.preventDefault();
                addSkill(text.trim());
              } else if (e.key === "Backspace" && !text && skills.length) {
                removeSkill(skills[skills.length - 1]);
              }
            }}
            placeholder={skills.length === 0 ? "React, Tailwind, Figma" : ""}
            className="min-w-[100px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-input bg-card py-1 shadow-card">
          {suggestions.map((skill) => (
            <button
              key={skill}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addSkill(skill);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              {skill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}


function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function LivePreview({
  variant,
  heading,
  title,
  description,
  images,
  skills,
  price,
  deliveryDays,
  revisions,
  responseTime,
  freelancerName,
  freelancerAvatar,
  freelancerRating,
  category,
  subCategory,
  experienceLevelLabel,
  languages,
  onEdit,
}: {
  variant: "preview" | "summary";
  heading?: string;
  title?: string;
  description?: string;
  images: string[];
  skills: string[];
  price?: number;
  deliveryDays?: number;
  revisions?: number;
  responseTime?: string;
  freelancerName: string;
  freelancerAvatar?: string;
  freelancerRating?: number;
  category?: string;
  subCategory?: string;
  experienceLevelLabel?: string;
  languages?: string[];
  onEdit?: () => void;
}) {
  const visibleSkills = skills.slice(0, 4);
  const extraSkillsCount = skills.length - visibleSkills.length;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Eye className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{heading ?? (variant === "summary" ? "Gig Summary" : "Live Preview")}</p>
              {variant === "preview" && <p className="text-[11px] text-muted-foreground">This is how your gig will appear to clients.</p>}
            </div>
          </div>
          {variant === "summary" && onEdit && (
            <button type="button" onClick={onEdit} className="text-xs font-medium text-brand hover:underline">
              Edit
            </button>
          )}
        </div>

        <div className="relative h-36 overflow-hidden rounded-lg">
          {images[0] ? (
            <img src={images[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand to-brand-light" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3">
            <p className="line-clamp-2 text-sm font-semibold text-white">{title || "Your gig title will appear here"}</p>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 4).map((s) => (
                  <span key={s} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {variant === "preview" ? (
          <>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={freelancerAvatar} alt={freelancerName} />
                <AvatarFallback className="bg-gradient-to-br from-brand to-brand-light text-[10px] font-semibold text-brand-foreground">
                  {initialsFromName(freelancerName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium">{freelancerName}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" /> {freelancerRating ? freelancerRating.toFixed(1) : "New"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Starts at</p>
                <p className="text-xs font-semibold">{formatCurrency(price || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Delivery</p>
                <p className="text-xs font-semibold">{deliveryDays || 0}d</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Revisions</p>
                <p className="text-xs font-semibold">{revisions === -1 ? "Unlimited" : (revisions ?? 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Response</p>
                <p className="text-xs font-semibold">{responseTime?.replace("Within ", "") || "—"}</p>
              </div>
            </div>

            {description && (
              <p
                className="line-clamp-3 border-t border-border pt-3 text-xs text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderBioHtml(description) }}
              />
            )}

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                {visibleSkills.map((s) => (
                  <Badge key={s} variant="outline" className="border-border text-[10px]">
                    {s}
                  </Badge>
                ))}
                {extraSkillsCount > 0 && (
                  <Badge variant="outline" className="border-border text-[10px]">
                    +{extraSkillsCount}
                  </Badge>
                )}
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="line-clamp-2 text-sm font-semibold">{title || "Your gig title will appear here"}</p>
            <div className="mt-1 divide-y divide-border">
              <SummaryRow icon={Tag} label="Category" value={category || "—"} />
              <SummaryRow icon={Code2} label="Subcategory" value={subCategory || "—"} />
              <SummaryRow icon={Star} label="Experience Level" value={experienceLevelLabel || "—"} />
              <SummaryRow icon={Globe2} label="Languages" value={languages?.length ? languages.join(", ") : "—"} />
              <SummaryRow icon={IndianRupee} label="Starting Price" value={price ? formatCurrency(price) : "—"} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepIndicator({ current, onStepClick }: { current: number; onStepClick: (step: number) => void }) {
  return (
    <Card>
      <CardContent className="flex items-center p-5">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <button type="button" onClick={() => onStepClick(stepNum)} className="flex items-center gap-2" disabled={stepNum >= current}>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isComplete || isActive ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : stepNum}
                </span>
                <span
                  className={`hidden text-sm sm:block ${
                    isActive || isComplete ? "font-semibold text-brand" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
              {stepNum < STEPS.length && <div className="mx-3 h-px flex-1 bg-muted" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SubCategorySelect({ control, category }: { control: Control<FormValues>; category?: string }) {
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

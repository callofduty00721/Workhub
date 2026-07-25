import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, useFieldArray, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  FileEdit,
  Info,
  LifeBuoy,
  TrendingUp,
  Users2,
  Wallet,
  Handshake,
  X,
  History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startupApi } from "@/api/startups";
import { INDUSTRIES, INDUSTRY_SUBCATEGORIES } from "@/lib/mockData";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/lib/geo";
import { FileUpload } from "@/components/shared/FileUpload";
import { cn } from "@/lib/utils";
import type { Startup } from "@/types";

const NEW_STARTUP_DRAFT_KEY = "mahahub:createStartupDraft";

const STAGES = ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"] as const;
const OPEN_ROLE_TYPES = ["full_time", "part_time"] as const;
const WORK_MODES = ["on_site", "remote", "hybrid"] as const;
const PRODUCT_STATUSES = ["live", "beta", "coming_soon"] as const;
const PRODUCT_STATUS_LABELS: Record<(typeof PRODUCT_STATUSES)[number], string> = {
  live: "Live",
  beta: "Beta",
  coming_soon: "Coming Soon",
};
const DOCUMENT_CATEGORIES = ["Legal & Registration", "Financials", "Business Plan", "Pitch Deck", "Product", "Other"] as const;
const INCORPORATION_TYPES = ["Not Registered", "Sole Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited", "Other"] as const;

const STEPS = [
  { id: 1, title: "Overview", desc: "Story, problem/solution and business plan" },
  { id: 2, title: "Team", desc: "Team members and open roles" },
  { id: 3, title: "Funding & Needs", desc: "Funding requirement and fund usage" },
  { id: 4, title: "Product / Plan", desc: "Product, roadmap and market opportunity" },
  { id: 5, title: "Documents", desc: "Media, links and documents" },
] as const;

const schema = z.object({
  name: z.string().min(2, "Startup name is required").max(100),
  tagline: z.string().min(5, "Tagline is required").max(120),
  industry: z.string().min(1, "Select an industry"),
  subIndustry: z.string().optional(),
  stage: z.enum(STAGES),
  incorporationType: z.string().optional(),
  registrationNumber: z.string().optional(),
  foundedDate: z.string().optional(),
  country: z.string().min(1, "Select a country"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  description: z.string().min(20, "Description should be at least 20 characters").max(500),
  problemStatement: z.string().optional(),
  solution: z.string().optional(),
  targetAudience: z.string().optional(),
  missionStatement: z.string().optional(),
  highlightsText: z.string().optional(),
  website: z.string().optional(),
  socialLinkedin: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),

  team: z.array(
    z.object({
      name: z.string().min(1, "Name required"),
      role: z.string().min(1, "Role required"),
      bio: z.string().optional(),
      linkedin: z.string().optional(),
      skills: z.string().optional(),
      joinedDate: z.string().optional(),
    })
  ),

  openRoles: z.array(
    z.object({
      title: z.string().min(1, "Role title required"),
      type: z.enum(OPEN_ROLE_TYPES),
      workMode: z.enum(WORK_MODES),
      description: z.string().optional(),
      requiredSkills: z.string().optional(),
      requiredExperience: z.string().optional(),
      salary: z.string().optional(),
      responsibilitiesText: z.string().optional(),
    })
  ),

  tractionStats: z.array(z.object({ label: z.string().min(1, "Label required"), value: z.string().min(1, "Value required") })),
  businessPlan: z.array(z.object({ label: z.string().min(1, "Label required"), value: z.string().min(1, "Value required") })),
  milestones: z.array(
    z.object({ title: z.string().min(1, "Milestone title required"), description: z.string().optional(), date: z.string().min(1, "Date required") })
  ),

  fundingNeeded: z.coerce.number().min(0),
  fundingRaised: z.coerce.number().min(0).optional(),
  fundingTypeText: z.string().optional(),
  investmentType: z.string().optional(),
  minimumInvestment: z.coerce.number().min(0).optional(),
  fundingDurationMonths: z.coerce.number().min(0).optional(),
  expectedClosingDate: z.string().optional(),
  fundUsagePlan: z.array(
    z.object({ category: z.string().min(1, "Category required"), description: z.string().optional(), estimatedCost: z.coerce.number().min(0) })
  ),
  expectedOutcomes: z.array(z.object({ label: z.string().min(1, "Label required"), value: z.string().min(1, "Value required") })),
  whyInvestText: z.string().optional(),

  products: z.array(
    z.object({
      name: z.string().min(1, "Product name required"),
      description: z.string().optional(),
      images: z.array(z.object({ url: z.string() })),
      url: z.string().optional(),
      price: z.string().optional(),
      status: z.enum(PRODUCT_STATUSES).default("live"),
      featuresText: z.string().optional(),
      tagsText: z.string().optional(),
    })
  ),
  productHighlightsText: z.string().optional(),
  howItWorks: z.array(z.object({ title: z.string().min(1, "Step title required"), description: z.string().optional() })),
  planPhases: z.array(
    z.object({ title: z.string().min(1, "Phase title required"), timeframe: z.string().optional(), checklistText: z.string().optional(), estimatedCost: z.coerce.number().min(0) })
  ),
  marketStats: z.array(z.object({ value: z.string().min(1, "Value required"), label: z.string().min(1, "Label required") })),
  competitiveAdvantageText: z.string().optional(),
  whyProductText: z.string().optional(),

  documents: z.array(
    z.object({
      name: z.string().min(1, "Document name required"),
      description: z.string().optional(),
      url: z.string().min(1, "Upload a file"),
      category: z.enum(DOCUMENT_CATEGORIES),
      fileSize: z.string().optional(),
    })
  ),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  pitchDeckUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: [
    "name", "tagline", "industry", "stage", "country", "state", "city", "description",
    "problemStatement", "solution", "targetAudience",
    "missionStatement", "highlightsText", "businessPlan", "tractionStats", "milestones",
  ],
  2: ["team", "openRoles"],
  3: ["fundingNeeded", "fundingRaised", "fundUsagePlan", "expectedOutcomes"],
  4: ["products", "howItWorks", "planPhases", "marketStats", "competitiveAdvantageText", "whyProductText"],
  5: ["documents", "website"],
};

function splitLines(text?: string) {
  return (text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
}
function joinLines(items?: string[]) {
  return (items ?? []).join("\n");
}
function splitCommas(text?: string) {
  return (text ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
function joinCommas(items?: string[]) {
  return (items ?? []).join(", ");
}

const emptyDefaults: FormValues = {
  name: "",
  tagline: "",
  industry: "",
  subIndustry: "",
  stage: "idea",
  incorporationType: "",
  registrationNumber: "",
  foundedDate: "",
  country: "India",
  state: "",
  city: "",
  description: "",
  problemStatement: "",
  solution: "",
  targetAudience: "",
  missionStatement: "",
  highlightsText: "",
  website: "",
  socialLinkedin: "",
  socialTwitter: "",
  socialFacebook: "",
  socialInstagram: "",
  team: [{ name: "", role: "", bio: "", linkedin: "", skills: "", joinedDate: "" }],
  openRoles: [],
  tractionStats: [],
  businessPlan: [],
  milestones: [],
  fundingNeeded: 0,
  fundingRaised: 0,
  fundingTypeText: "",
  investmentType: "",
  minimumInvestment: 0,
  fundingDurationMonths: 0,
  expectedClosingDate: "",
  fundUsagePlan: [],
  expectedOutcomes: [],
  whyInvestText: "",
  products: [],
  productHighlightsText: "",
  howItWorks: [],
  planPhases: [],
  marketStats: [],
  competitiveAdvantageText: "",
  whyProductText: "",
  documents: [],
  logo: "",
  coverImage: "",
  pitchDeckUrl: "",
};

function buildPayload(values: FormValues, status: "draft" | "published"): Partial<Startup> {
  return {
    name: values.name,
    tagline: values.tagline,
    industry: values.industry,
    subIndustry: values.subIndustry,
    stage: values.stage,
    incorporationType: values.incorporationType,
    registrationNumber: values.registrationNumber,
    foundedDate: values.foundedDate || undefined,
    location: [values.city, values.state, values.country].filter(Boolean).join(", "),
    description: values.description,
    problemStatement: values.problemStatement,
    solution: values.solution,
    targetAudience: values.targetAudience,
    missionStatement: values.missionStatement,
    highlights: splitLines(values.highlightsText),
    website: values.website,
    socialLinks: {
      linkedin: values.socialLinkedin ?? "",
      twitter: values.socialTwitter ?? "",
      facebook: values.socialFacebook ?? "",
      instagram: values.socialInstagram ?? "",
    },
    team: values.team.map((t) => ({
      ...t,
      skills: (t.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      joinedDate: t.joinedDate || undefined,
    })),
    openRoles: values.openRoles.map((r) => ({
      title: r.title,
      type: r.type,
      workMode: r.workMode,
      description: r.description,
      requiredSkills: (r.requiredSkills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      requiredExperience: r.requiredExperience ?? "",
      salary: r.salary ?? "",
      responsibilities: splitLines(r.responsibilitiesText),
    })),
    tractionStats: values.tractionStats,
    businessPlan: values.businessPlan,
    milestones: values.milestones,
    fundingNeeded: values.fundingNeeded,
    fundingRaised: values.fundingRaised ?? 0,
    fundingType: splitCommas(values.fundingTypeText),
    investmentType: values.investmentType,
    minimumInvestment: values.minimumInvestment ?? 0,
    fundingDurationMonths: values.fundingDurationMonths ?? 0,
    expectedClosingDate: values.expectedClosingDate || undefined,
    fundUsagePlan: values.fundUsagePlan,
    expectedOutcomes: values.expectedOutcomes,
    whyInvest: splitLines(values.whyInvestText),
    products: values.products.map((p) => ({
      name: p.name,
      description: p.description,
      url: p.url,
      price: p.price,
      status: p.status,
      features: splitLines(p.featuresText),
      tags: splitCommas(p.tagsText),
      images: p.images.map((i) => i.url).filter(Boolean),
    })),
    productHighlights: splitLines(values.productHighlightsText),
    howItWorks: values.howItWorks,
    planPhases: values.planPhases.map((p) => ({ title: p.title, timeframe: p.timeframe, checklist: splitLines(p.checklistText), estimatedCost: p.estimatedCost })),
    marketStats: values.marketStats,
    competitiveAdvantage: splitLines(values.competitiveAdvantageText),
    whyProduct: splitLines(values.whyProductText),
    documents: values.documents,
    logo: values.logo,
    coverImage: values.coverImage,
    pitchDeckUrl: values.pitchDeckUrl,
    status,
  };
}

export default function CreateStartup() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: myStartups, isLoading: isLoadingMine } = useQuery({ queryKey: ["startups", "mine"], queryFn: startupApi.mine });
  const existing = id ? myStartups?.find((s) => s._id === id) : undefined;
  const notFound = !!id && !isLoadingMine && !existing;

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    getValues,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  const teamArray = useFieldArray({ control, name: "team" });
  const openRolesArray = useFieldArray({ control, name: "openRoles" });
  const tractionArray = useFieldArray({ control, name: "tractionStats" });
  const businessPlanArray = useFieldArray({ control, name: "businessPlan" });
  const milestonesArray = useFieldArray({ control, name: "milestones" });
  const fundUsageArray = useFieldArray({ control, name: "fundUsagePlan" });
  const outcomesArray = useFieldArray({ control, name: "expectedOutcomes" });
  const productsArray = useFieldArray({ control, name: "products" });
  const howItWorksArray = useFieldArray({ control, name: "howItWorks" });
  const planPhasesArray = useFieldArray({ control, name: "planPhases" });
  const marketStatsArray = useFieldArray({ control, name: "marketStats" });
  const documentsArray = useFieldArray({ control, name: "documents" });

  useEffect(() => {
    if (existing) {
      setMaxUnlockedStep(STEPS.length);
      const parts = (existing.location || "").split(",").map((s) => s.trim());
      reset({
        ...emptyDefaults,
        name: existing.name,
        tagline: existing.tagline,
        industry: existing.industry,
        subIndustry: existing.subIndustry ?? "",
        stage: existing.stage,
        incorporationType: existing.incorporationType ?? "",
        registrationNumber: existing.registrationNumber ?? "",
        foundedDate: existing.foundedDate ? existing.foundedDate.slice(0, 10) : "",
        city: parts[0] ?? "",
        state: parts[1] ?? "",
        country: parts[2] ?? "India",
        description: existing.description,
        problemStatement: existing.problemStatement ?? "",
        solution: existing.solution ?? "",
        targetAudience: existing.targetAudience ?? "",
        missionStatement: existing.missionStatement ?? "",
        highlightsText: joinLines(existing.highlights),
        website: existing.website ?? "",
        socialLinkedin: existing.socialLinks?.linkedin ?? "",
        socialTwitter: existing.socialLinks?.twitter ?? "",
        socialFacebook: existing.socialLinks?.facebook ?? "",
        socialInstagram: existing.socialLinks?.instagram ?? "",
        team: existing.team.length
          ? existing.team.map((t) => ({
              name: t.name,
              role: t.role,
              bio: t.bio ?? "",
              linkedin: t.linkedin ?? "",
              skills: (t.skills ?? []).join(", "),
              joinedDate: t.joinedDate ? t.joinedDate.slice(0, 10) : "",
            }))
          : [{ name: "", role: "", bio: "", linkedin: "", skills: "", joinedDate: "" }],
        openRoles: (existing.openRoles ?? []).map((r) => ({
          title: r.title,
          type: r.type,
          workMode: r.workMode,
          description: r.description ?? "",
          requiredSkills: (r.requiredSkills ?? []).join(", "),
          requiredExperience: r.requiredExperience ?? "",
          salary: r.salary ?? "",
          responsibilitiesText: joinLines(r.responsibilities),
        })),
        tractionStats: (existing.tractionStats ?? []).map((t) => ({ label: t.label, value: t.value })),
        businessPlan: (existing.businessPlan ?? []).map((b) => ({ label: b.label, value: b.value })),
        milestones: (existing.milestones ?? []).map((m) => ({ title: m.title, description: m.description ?? "", date: m.date ? m.date.slice(0, 10) : "" })),
        fundingNeeded: existing.fundingNeeded,
        fundingRaised: existing.fundingRaised ?? 0,
        fundingTypeText: joinCommas(existing.fundingType),
        investmentType: existing.investmentType ?? "",
        minimumInvestment: existing.minimumInvestment ?? 0,
        fundingDurationMonths: existing.fundingDurationMonths ?? 0,
        expectedClosingDate: existing.expectedClosingDate ? existing.expectedClosingDate.slice(0, 10) : "",
        fundUsagePlan: (existing.fundUsagePlan ?? []).map((f) => ({ category: f.category, description: f.description ?? "", estimatedCost: f.estimatedCost })),
        expectedOutcomes: (existing.expectedOutcomes ?? []).map((o) => ({ label: o.label, value: o.value })),
        whyInvestText: joinLines(existing.whyInvest),
        products: (existing.products ?? []).map((p) => ({
          name: p.name,
          description: p.description ?? "",
          images: (p.images?.length ? p.images : p.image ? [p.image] : []).map((url) => ({ url })),
          url: p.url ?? "",
          price: p.price ?? "",
          status: p.status ?? "live",
          featuresText: joinLines(p.features),
          tagsText: joinCommas(p.tags?.length ? p.tags : p.tag ? [p.tag] : []),
        })),
        productHighlightsText: joinLines(existing.productHighlights),
        howItWorks: (existing.howItWorks ?? []).map((s) => ({ title: s.title, description: s.description ?? "" })),
        planPhases: (existing.planPhases ?? []).map((p) => ({ title: p.title, timeframe: p.timeframe ?? "", checklistText: joinLines(p.checklist), estimatedCost: p.estimatedCost })),
        marketStats: (existing.marketStats ?? []).map((m) => ({ value: m.value, label: m.label })),
        competitiveAdvantageText: joinLines(existing.competitiveAdvantage),
        whyProductText: joinLines(existing.whyProduct),
        documents: (existing.documents ?? []).map((d) => ({ name: d.name, description: d.description ?? "", url: d.url, category: d.category, fileSize: d.fileSize ?? "" })),
        logo: existing.logo ?? "",
        coverImage: existing.coverImage ?? "",
        pitchDeckUrl: existing.pitchDeckUrl ?? "",
      });
    } else if (!id) {
      const saved = localStorage.getItem(NEW_STARTUP_DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { values: FormValues; step: number; maxUnlockedStep: number };
          reset(parsed.values);
          setStep(parsed.step ?? 1);
          setMaxUnlockedStep(parsed.maxUnlockedStep ?? 1);
          setRestoredDraft(true);
          return;
        } catch {
          localStorage.removeItem(NEW_STARTUP_DRAFT_KEY);
        }
      }
      reset(emptyDefaults);
      setStep(1);
      setMaxUnlockedStep(1);
    }
  }, [existing, id, reset]);

  useEffect(() => {
    if (id) return;
    const subscription = watch((values) => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = setTimeout(() => {
        localStorage.setItem(NEW_STARTUP_DRAFT_KEY, JSON.stringify({ values, step, maxUnlockedStep }));
      }, 500);
    });
    return () => {
      subscription.unsubscribe();
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, [watch, id, step, maxUnlockedStep]);

  const discardLocalDraft = () => {
    localStorage.removeItem(NEW_STARTUP_DRAFT_KEY);
    reset(emptyDefaults);
    setStep(1);
    setMaxUnlockedStep(1);
    setRestoredDraft(false);
  };

  const mutation = useMutation({
    mutationFn: ({ values, status }: { values: FormValues; status: "draft" | "published" }) => {
      const payload = buildPayload(values, status);
      return existing ? startupApi.update(existing._id, payload) : startupApi.create(payload);
    },
    onSuccess: (data, variables) => {
      if (!existing) localStorage.removeItem(NEW_STARTUP_DRAFT_KEY);
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      navigate(variables.status === "published" ? `/startups/${data._id}` : "/dashboard/founder");
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate({ values, status: "published" });
  const onSaveDraft = () => mutation.mutate({ values: getValues(), status: "draft" });

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) {
      const next = Math.min(STEPS.length, step + 1);
      setStep(next);
      setMaxUnlockedStep((m) => Math.max(m, next));
    }
  };

  const goToStep = (id: number) => {
    if (id <= maxUnlockedStep) setStep(id);
  };

  const nameLen = watch("name")?.length ?? 0;
  const taglineLen = watch("tagline")?.length ?? 0;
  const descLen = watch("description")?.length ?? 0;

  const progressPct = Math.round(((step - 1) / STEPS.length) * 100);

  if (notFound) {
    return (
      <div className="bg-[#f8fafc] py-20 text-center">
        <p className="text-lg font-semibold text-[#0f172a]">Startup not found</p>
        <p className="mt-1 text-sm text-[#64748b]">This startup doesn&apos;t exist or doesn&apos;t belong to you.</p>
        <Link to="/dashboard/founder" className="mt-4 inline-block rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-semibold hover:bg-white">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc]">
      <div className="container py-6">
        <Link to="/dashboard/founder" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748b] hover:text-[#0f172a]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold text-[#0f172a]">{existing ? "Manage Your Startup" : "Create Your Startup"}</h1>
            <p className="mt-1 text-[13.5px] text-[#64748b]">Showcase your idea, team and vision to the right people.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
            >
              <FileEdit className="h-4 w-4" /> Save as Draft
            </button>
            <button
              type="submit"
              form="create-startup-form"
              disabled={isSubmitting || mutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Preview &amp; Submit <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {restoredDraft && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#e8effe] bg-[#f5f8fe] px-4 py-3">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#2563eb]">
              <History className="h-4 w-4" /> We restored your unsaved progress from last time.
            </p>
            <button type="button" onClick={discardLocalDraft} className="flex items-center gap-1 text-[11.5px] font-bold text-[#64748b] hover:text-[#0f172a]">
              <X className="h-3.5 w-3.5" /> Discard &amp; start fresh
            </button>
          </div>
        )}

        <form id="create-startup-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr_280px] lg:items-start" noValidate>
          {/* LEFT STEP NAV */}
          <div className="space-y-4 lg:sticky lg:top-4">
            <div className="space-y-1 rounded-2xl border border-[#e2e8f0] bg-white p-3">
              {STEPS.map((s) => {
                const locked = s.id > maxUnlockedStep;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(s.id)}
                    disabled={locked}
                    title={locked ? "Complete the previous steps first" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl p-3 text-left",
                      step === s.id ? "bg-[#e8effe]" : locked ? "cursor-not-allowed opacity-50" : "hover:bg-[#f8fafc]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                        step === s.id ? "bg-[#2563eb] text-white" : step > s.id ? "bg-[#16a34a] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                      )}
                    >
                      {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                    </span>
                    <span>
                      <p className={cn("text-[13px] font-bold", step === s.id ? "text-[#2563eb]" : "text-[#0f172a]")}>{s.title}</p>
                      <p className="text-[11px] text-[#94a3b8]">{s.desc}</p>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
              <p className="text-[13px] font-bold text-[#0f172a]">{progressPct}% Completed</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                <div className="h-full rounded-full bg-[#2563eb] transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-[#94a3b8]">Complete all steps to publish your startup</p>
            </div>
          </div>

          {/* CENTER FORM */}
          <div className="min-w-0 rounded-2xl border border-[#e2e8f0] bg-white p-6">
            <h3 className="text-[17px] font-extrabold text-[#0f172a]">
              {step}. {STEPS[step - 1].title}
            </h3>
            <p className="mt-1 text-[13px] text-[#64748b]">{STEPS[step - 1].desc}.</p>

            <div className="mt-5 space-y-5">
              {step === 1 && (
                <>
                  <h4 className="text-[13px] font-bold text-[#0f172a]">Basic Details</h4>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="name">Startup Name <Req /></Label>
                        <span className="text-[10.5px] text-[#94a3b8]">{nameLen}/100</span>
                      </div>
                      <Hint>This is how your startup will appear across MahaHub.</Hint>
                      <Input id="name" maxLength={100} placeholder="Enter startup name" {...register("name")} />
                      {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tagline">Tagline <Req /></Label>
                        <span className="text-[10.5px] text-[#94a3b8]">{taglineLen}/120</span>
                      </div>
                      <Hint>A short, catchy one-liner that captures what you do.</Hint>
                      <Input id="tagline" maxLength={120} placeholder="A short and catchy tagline for your startup" {...register("tagline")} />
                      {errors.tagline && <p className="text-xs text-danger">{errors.tagline.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Industry / Sector <Req /></Label>
                      <Hint>Helps investors, mentors and partners discover startups like yours.</Hint>
                      <IndustrySelect control={control} name="industry" />
                      {errors.industry && <p className="text-xs text-danger">{errors.industry.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Sub-Category</Label>
                      <Hint>Narrow down within your industry, if applicable.</Hint>
                      <SubIndustrySelect control={control} industry={watch("industry")} />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Startup Stage <Req /></Label>
                      <Hint>Where you currently stand — from idea to growth.</Hint>
                      <StageSelect control={control} name="stage" />
                    </div>
                    <div className="space-y-2">
                      <Label>Incorporation Type</Label>
                      <Hint>Your business's legal structure, if registered.</Hint>
                      <Controller
                        control={control}
                        name="incorporationType"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              {INCORPORATION_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number (Optional)</Label>
                    <Hint>GST, Udyam or CIN number, if you have one.</Hint>
                    <Input id="registrationNumber" placeholder="Enter registration number" {...register("registrationNumber")} />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="foundedDate">Founded Date</Label>
                      <Hint>When your startup officially started.</Hint>
                      <Input id="foundedDate" type="date" {...register("foundedDate")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Country <Req /></Label>
                      <Hint>The country your startup is based in.</Hint>
                      <Controller
                        control={control}
                        name="country"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              setValue("state", "");
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.country && <p className="text-xs text-danger">{errors.country.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>State <Req /></Label>
                      <Hint>The state your startup operates from.</Hint>
                      <Controller
                        control={control}
                        name="state"
                        render={({ field }) => {
                          const stateOptions = STATES_BY_COUNTRY[watch("country") as (typeof COUNTRIES)[number]] ?? [];
                          return (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                              <SelectContent>
                                {stateOptions.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                      {errors.state && <p className="text-xs text-danger">{errors.state.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City <Req /></Label>
                      <Hint>The city or town your startup operates from.</Hint>
                      <Input id="city" placeholder="Enter city" {...register("city")} />
                      {errors.city && <p className="text-xs text-danger">{errors.city.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Short Description <Req /></Label>
                      <span className="text-[10.5px] text-[#94a3b8]">{descLen}/500</span>
                    </div>
                    <Hint>Describe your startup in a few lines — this shows up as "About the Idea" on your profile.</Hint>
                    <Textarea id="description" maxLength={500} className="min-h-[100px]" placeholder="Write a short description about your startup..." {...register("description")} />
                    {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Logo / Cover Image</Label>
                    <Hint>Upload your startup logo and a cover image for your profile page.</Hint>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Controller control={control} name="logo" render={({ field }) => (
                          <FileUpload folder="startup_logo" value={field.value} onUploaded={(url) => field.onChange(url)} label="Upload Logo — JPG, PNG" />
                        )} />
                        <p className="text-[10.5px] text-[#94a3b8]">Recommended: 400 × 400px (square), max 10MB.</p>
                      </div>
                      <div className="space-y-1">
                        <Controller control={control} name="coverImage" render={({ field }) => (
                          <FileUpload folder="startup_cover" value={field.value} onUploaded={(url) => field.onChange(url)} label="Upload Cover Image — JPG, PNG" />
                        )} />
                        <p className="text-[10.5px] text-[#94a3b8]">Recommended: 1600 × 500px (16:5 ratio), max 10MB.</p>
                      </div>
                    </div>
                  </div>

                  <h4 className="border-t border-[#e2e8f0] pt-5 text-[13px] font-bold text-[#0f172a]">Problem &amp; Solution</h4>
                  <div className="space-y-2">
                    <Label htmlFor="problemStatement">Problem Statement</Label>
                    <Hint>Explain the real-world problem your startup solves — one point per line.</Hint>
                    <Textarea id="problemStatement" placeholder="What problem are you solving?" {...register("problemStatement")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="solution">Solution</Label>
                    <Hint>How your product or service solves the problem above — one point per line.</Hint>
                    <Textarea id="solution" placeholder="How does your solution solve this problem?" {...register("solution")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Hint>Who will use or buy from you.</Hint>
                    <Input id="targetAudience" placeholder="e.g. Farmers, Small Businesses, Households" {...register("targetAudience")} />
                  </div>

                  <h4 className="border-t border-[#e2e8f0] pt-5 text-[13px] font-bold text-[#0f172a]">Mission, Highlights &amp; Business Plan</h4>
                  <div className="space-y-2">
                    <Label htmlFor="missionStatement">Mission Statement</Label>
                    <Hint>The long-term purpose behind your startup.</Hint>
                    <Textarea id="missionStatement" placeholder="What is your startup's mission?" {...register("missionStatement")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highlightsText">Highlights (one per line)</Label>
                    <Hint>Key achievements or proof points that build trust with visitors.</Hint>
                    <Textarea id="highlightsText" className="min-h-[80px]" placeholder={"15+ farmers onboarded\nFSSAI certified"} {...register("highlightsText")} />
                  </div>
                  <LabelValueArray
                    title="Business Model Summary"
                    hint="Your revenue model, target market and growth strategy, shown as label/value pairs."
                    placeholder1="Label (e.g. Revenue Model)"
                    placeholder2="Value (e.g. B2C direct sales)"
                    arr={businessPlanArray}
                    name="businessPlan"
                    register={register}
                  />
                  <LabelValueArray
                    title="Traction Stats"
                    hint="Numbers that prove momentum, e.g. users, revenue, orders."
                    placeholder1="Label (e.g. Farmers Onboarded)"
                    placeholder2="Value (e.g. 15+)"
                    arr={tractionArray}
                    name="tractionStats"
                    register={register}
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Milestones</Label>
                        <Hint>Key events in your startup's journey, in chronological order.</Hint>
                      </div>
                      <Button onClick={() => milestonesArray.append({ title: "", description: "", date: "" })}>Add Milestone</Button>
                    </div>
                    {milestonesArray.fields.length === 0 && <p className="text-[12.5px] text-[#94a3b8]">No milestones added yet — highlight key moments in your journey.</p>}
                    {milestonesArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Milestone title (e.g. First 100 customers)" {...register(`milestones.${index}.title` as const)} />
                        <Input type="date" {...register(`milestones.${index}.date` as const)} />
                        <Textarea placeholder="Description (optional)" className="min-h-[60px] sm:col-span-2" {...register(`milestones.${index}.description` as const)} />
                        <RemoveRowButton onClick={() => milestonesArray.remove(index)} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Team Members</Label>
                        <Hint>The people currently working on the startup.</Hint>
                      </div>
                      <Button onClick={() => teamArray.append({ name: "", role: "", bio: "", linkedin: "", skills: "", joinedDate: "" })}>Add Member</Button>
                    </div>
                    {teamArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Full name" {...register(`team.${index}.name` as const)} />
                        <Input placeholder="Role (e.g. CTO)" {...register(`team.${index}.role` as const)} />
                        <Input placeholder="LinkedIn URL" className="sm:col-span-2" {...register(`team.${index}.linkedin` as const)} />
                        <Textarea placeholder="Short bio" className="min-h-[70px] sm:col-span-2" {...register(`team.${index}.bio` as const)} />
                        <Input placeholder="Skills / expertise (comma separated)" {...register(`team.${index}.skills` as const)} />
                        <Input type="date" {...register(`team.${index}.joinedDate` as const)} />
                        {teamArray.fields.length > 1 && <RemoveRowButton onClick={() => teamArray.remove(index)} />}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Open Roles (Looking for Team)</Label>
                        <Hint>Roles you're actively hiring or looking for volunteers/co-founders for.</Hint>
                      </div>
                      <Button
                        onClick={() =>
                          openRolesArray.append({
                            title: "",
                            type: "full_time",
                            workMode: "on_site",
                            description: "",
                            requiredSkills: "",
                            requiredExperience: "",
                            salary: "",
                            responsibilitiesText: "",
                          })
                        }
                      >
                        Add Role
                      </Button>
                    </div>
                    {openRolesArray.fields.length === 0 && <p className="text-[12.5px] text-[#94a3b8]">No open roles yet — add roles you're hiring for.</p>}
                    {openRolesArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Role title (e.g. Marketing Lead)" {...register(`openRoles.${index}.title` as const)} />
                        <div className="grid grid-cols-2 gap-3">
                          <Controller control={control} name={`openRoles.${index}.type` as const} render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>
                                {OPEN_ROLE_TYPES.map((t) => (<SelectItem key={t} value={t}>{t === "full_time" ? "Full Time" : "Part Time"}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          )} />
                          <Controller control={control} name={`openRoles.${index}.workMode` as const} render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger><SelectValue placeholder="Work mode" /></SelectTrigger>
                              <SelectContent>
                                {WORK_MODES.map((m) => (<SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          )} />
                        </div>
                        <Textarea placeholder="Role description" className="min-h-[60px] sm:col-span-2" {...register(`openRoles.${index}.description` as const)} />
                        <Input
                          placeholder="Required skills (comma separated, e.g. React, Figma, SEO)"
                          className="sm:col-span-2"
                          {...register(`openRoles.${index}.requiredSkills` as const)}
                        />
                        <Input placeholder="Required experience (e.g. 2+ years)" {...register(`openRoles.${index}.requiredExperience` as const)} />
                        <Input placeholder="Salary (e.g. ₹25,000 - ₹35,000/month, or Equity only)" {...register(`openRoles.${index}.salary` as const)} />
                        <Textarea
                          placeholder={"What work will need to be done? One per line, e.g.\nRun paid ad campaigns\nWrite weekly content calendar"}
                          className="min-h-[80px] sm:col-span-2"
                          {...register(`openRoles.${index}.responsibilitiesText` as const)}
                        />
                        <RemoveRowButton onClick={() => openRolesArray.remove(index)} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fundingNeeded">Funding Amount Needed (₹)</Label>
                      <Hint>Total capital you're raising in this round.</Hint>
                      <Input id="fundingNeeded" type="number" min={0} {...register("fundingNeeded")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fundingRaised">Funding Raised So Far (₹)</Label>
                      <Hint>Amount already committed or received.</Hint>
                      <Input id="fundingRaised" type="number" min={0} {...register("fundingRaised")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fundingTypeText">Funding Type (comma separated)</Label>
                      <Hint>e.g. Equity, Debt, Grant.</Hint>
                      <Input id="fundingTypeText" placeholder="e.g. Equity, Grant" {...register("fundingTypeText")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="investmentType">Investment Type</Label>
                      <Hint>The instrument you're offering investors.</Hint>
                      <Input id="investmentType" placeholder="e.g. Convertible Note" {...register("investmentType")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumInvestment">Minimum Investment (₹)</Label>
                      <Hint>Smallest amount an investor can contribute.</Hint>
                      <Input id="minimumInvestment" type="number" min={0} {...register("minimumInvestment")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fundingDurationMonths">Funding Duration (months)</Label>
                      <Hint>How long this funding round stays open.</Hint>
                      <Input id="fundingDurationMonths" type="number" min={0} {...register("fundingDurationMonths")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedClosingDate">Expected Closing Date</Label>
                      <Hint>When you plan to close this funding round.</Hint>
                      <Input id="expectedClosingDate" type="date" {...register("expectedClosingDate")} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Fund Usage Plan</Label>
                        <Hint>Break down exactly how the funds will be spent.</Hint>
                      </div>
                      <Button onClick={() => fundUsageArray.append({ category: "", description: "", estimatedCost: 0 })}>Add Item</Button>
                    </div>
                    {fundUsageArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Category (e.g. Equipment)" {...register(`fundUsagePlan.${index}.category` as const)} />
                        <Input type="number" min={0} placeholder="Estimated cost (₹)" {...register(`fundUsagePlan.${index}.estimatedCost` as const)} />
                        <Textarea placeholder="Description" className="min-h-[60px] sm:col-span-2" {...register(`fundUsagePlan.${index}.description` as const)} />
                        <RemoveRowButton onClick={() => fundUsageArray.remove(index)} />
                      </div>
                    ))}
                  </div>

                  <LabelValueArray
                    title="Expected Outcomes"
                    hint="What investors should expect once funded, e.g. break-even timeline."
                    placeholder1="Label (e.g. Break-even)"
                    placeholder2="Value (e.g. 18 months)"
                    arr={outcomesArray}
                    name="expectedOutcomes"
                    register={register}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="whyInvestText">Why Invest In This Startup? (one per line)</Label>
                    <Hint>Convince investors — one reason per line.</Hint>
                    <Textarea id="whyInvestText" className="min-h-[80px]" placeholder={"Proven demand from local farmers\nExperienced founding team"} {...register("whyInvestText")} />
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h4 className="text-[13px] font-bold text-[#0f172a]">Products</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Products</Label>
                        <Hint>The products or services you currently offer.</Hint>
                      </div>
                      <Button
                        onClick={() =>
                          productsArray.append({
                            name: "",
                            description: "",
                            images: [],
                            url: "",
                            price: "",
                            status: "live",
                            featuresText: "",
                            tagsText: "",
                          })
                        }
                      >
                        Add Product
                      </Button>
                    </div>
                    {productsArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Product name" {...register(`products.${index}.name` as const)} />
                        <Input placeholder="Tags (comma separated, e.g. SaaS, B2B)" {...register(`products.${index}.tagsText` as const)} />
                        <Textarea placeholder="Product description" className="min-h-[60px] sm:col-span-2" {...register(`products.${index}.description` as const)} />
                        <Input placeholder="Live demo / product link" {...register(`products.${index}.url` as const)} />
                        <Input placeholder="Price (e.g. Free, ₹499/mo, Custom)" {...register(`products.${index}.price` as const)} />
                        <Controller
                          control={control}
                          name={`products.${index}.status` as const}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                              <SelectContent>
                                {PRODUCT_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <Textarea
                          placeholder={"Key features, one per line\ne.g. Real-time sync\nOffline mode"}
                          className="min-h-[60px]"
                          {...register(`products.${index}.featuresText` as const)}
                        />
                        <div className="sm:col-span-2">
                          <ProductImagesField control={control} index={index} />
                        </div>
                        <RemoveRowButton onClick={() => productsArray.remove(index)} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productHighlightsText">Product Highlights (one per line)</Label>
                    <Hint>What makes your product stand out — one point per line.</Hint>
                    <Textarea id="productHighlightsText" className="min-h-[80px]" placeholder={"100% pure and hygienically packed\nDelivered fresh every morning"} {...register("productHighlightsText")} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>How It Works</Label>
                        <Hint>The step-by-step flow of how a customer uses your product.</Hint>
                      </div>
                      <Button onClick={() => howItWorksArray.append({ title: "", description: "" })}>Add Step</Button>
                    </div>
                    {howItWorksArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Step title" {...register(`howItWorks.${index}.title` as const)} />
                        <Input placeholder="Step description" {...register(`howItWorks.${index}.description` as const)} />
                        <RemoveRowButton onClick={() => howItWorksArray.remove(index)} />
                      </div>
                    ))}
                  </div>

                  <h4 className="border-t border-[#e2e8f0] pt-5 text-[13px] font-bold text-[#0f172a]">Our Plan</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Roadmap Phases</Label>
                        <Hint>Your execution plan broken into phases, with a checklist and cost for each.</Hint>
                      </div>
                      <Button onClick={() => planPhasesArray.append({ title: "", timeframe: "", checklistText: "", estimatedCost: 0 })}>Add Phase</Button>
                    </div>
                    {planPhasesArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Phase title (e.g. Launch)" {...register(`planPhases.${index}.title` as const)} />
                        <Input placeholder="Timeframe (e.g. Month 1-3)" {...register(`planPhases.${index}.timeframe` as const)} />
                        <Input type="number" min={0} placeholder="Estimated cost (₹)" {...register(`planPhases.${index}.estimatedCost` as const)} />
                        <Textarea placeholder="Checklist, one item per line" className="min-h-[70px] sm:col-span-2" {...register(`planPhases.${index}.checklistText` as const)} />
                        <RemoveRowButton onClick={() => planPhasesArray.remove(index)} />
                      </div>
                    ))}
                  </div>

                  <h4 className="border-t border-[#e2e8f0] pt-5 text-[13px] font-bold text-[#0f172a]">Market Opportunity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Market Stats</Label>
                        <Hint>Numbers that show the size of your opportunity, e.g. market size, growth rate.</Hint>
                      </div>
                      <Button onClick={() => marketStatsArray.append({ value: "", label: "" })}>Add Stat</Button>
                    </div>
                    {marketStatsArray.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                        <Input placeholder="Value (e.g. ₹500 Cr)" {...register(`marketStats.${index}.value` as const)} />
                        <Input placeholder="Label (e.g. Market Size)" {...register(`marketStats.${index}.label` as const)} />
                        <button type="button" onClick={() => marketStatsArray.remove(index)} className="text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="competitiveAdvantageText">Our Competitive Advantage (one per line)</Label>
                      <Hint>Why you'll win against competitors — one point per line.</Hint>
                      <Textarea id="competitiveAdvantageText" className="min-h-[100px]" placeholder={"Direct farmer partnerships\nNo middlemen, better pricing"} {...register("competitiveAdvantageText")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whyProductText">Why Our Product? (one per line)</Label>
                      <Hint>Reasons customers should choose your product — one point per line.</Hint>
                      <Textarea id="whyProductText" className="min-h-[100px]" placeholder={"Farm-fresh quality\nHygienic packaging"} {...register("whyProductText")} />
                    </div>
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (optional)</Label>
                    <Hint>Your startup's official website, if you have one.</Hint>
                    <Input id="website" placeholder="https://yourwebsite.com" {...register("website")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Social Links (optional)</Label>
                    <Hint>Links to your startup's social media profiles.</Hint>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="LinkedIn URL" {...register("socialLinkedin")} />
                      <Input placeholder="Twitter / X URL" {...register("socialTwitter")} />
                      <Input placeholder="Facebook URL" {...register("socialFacebook")} />
                      <Input placeholder="Instagram URL" {...register("socialInstagram")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pitch Deck (optional)</Label>
                    <Hint>Your investor presentation deck, if you have one ready.</Hint>
                    <Controller control={control} name="pitchDeckUrl" render={({ field }) => (
                      <FileUpload folder="pitch_deck" accept="application/pdf,.ppt,.pptx" value={field.value} onUploaded={(url) => field.onChange(url)} label="Upload pitch deck (PDF, PPT)" />
                    )} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Documents</Label>
                        <Hint>Supporting files — licenses, certificates, reports and more.</Hint>
                      </div>
                      <Button onClick={() => documentsArray.append({ name: "", description: "", url: "", category: "Other", fileSize: "" })}>Add Document</Button>
                    </div>
                    {documentsArray.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
                        <Input placeholder="Document name (e.g. FSSAI License)" {...register(`documents.${index}.name` as const)} />
                        <Controller control={control} name={`documents.${index}.category` as const} render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        )} />
                        <Input placeholder="Short description (optional)" className="sm:col-span-2" {...register(`documents.${index}.description` as const)} />
                        <div className="sm:col-span-2">
                          <Controller control={control} name={`documents.${index}.url` as const} render={({ field: f }) => (
                            <FileUpload folder="document" value={f.value} onUploaded={(url) => f.onChange(url)} label="Upload document (PDF, DOC, XLS...)" accept="*" />
                          )} />
                        </div>
                        {errors.documents?.[index]?.url && <p className="text-xs text-danger sm:col-span-2">{errors.documents[index]?.url?.message}</p>}
                        <RemoveRowButton onClick={() => documentsArray.remove(index)} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {mutation.isError && (
              <div className="mt-5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                Something went wrong while saving your startup. Please try again.
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-[#e2e8f0] pt-5">
              <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
                Cancel
              </button>
              {step < STEPS.length ? (
                <button type="button" onClick={goNext} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-5 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90">
                  Save &amp; Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting || mutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-5 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-60">
                  {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {existing ? "Save Changes" : "Submit for Review"}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT GUIDANCE */}
          <div className="space-y-5 lg:sticky lg:top-4">
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <h4 className="text-[14px] font-bold text-[#0f172a]">Steps to Create Startup</h4>
              <div className="mt-4 space-y-4">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          step >= s.id ? "bg-[#2563eb] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                        )}
                      >
                        {s.id}
                      </span>
                      {i < STEPS.length - 1 && <span className="mt-1 w-px flex-1 bg-[#e2e8f0]" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-[12.5px] font-bold text-[#0f172a]">{s.title}</p>
                      <p className="text-[11px] text-[#94a3b8]">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <h4 className="flex items-center gap-2 text-[14px] font-bold text-[#0f172a]">
                <Info className="h-4 w-4 text-[#2563eb]" /> Guidelines
              </h4>
              <ul className="mt-3 space-y-2">
                {["Be clear and concise", "Use simple and professional language", "Add accurate and honest information", "Proper details increase trust"].map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#334155]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16a34a]" /> {g}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <h4 className="flex items-center gap-2 text-[14px] font-bold text-[#0f172a]">
                <LifeBuoy className="h-4 w-4 text-[#2563eb]" /> Need Help?
              </h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748b]">Read our documentation or contact our support team.</p>
              <Link to="/contact" className="mt-3 block w-full rounded-lg border border-[#e2e8f0] py-2 text-center text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
                View Help Center
              </Link>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-10 border-t border-[#e2e8f0] bg-white py-8">
        <div className="container flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8effe] text-[#2563eb]">
              <Handshake className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-bold text-[#0f172a]">Why create your startup on MahaHub?</p>
              <p className="text-[12px] text-[#64748b]">Get discovered by investors, mentors, partners and grow your network.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              [TrendingUp, "Increase Visibility", "Showcase your idea"],
              [Users2, "Connect & Grow", "Build valuable connections"],
              [Wallet, "Get Investment", "Find the right investors"],
            ].map(([Icon, title, desc], i) => {
              const IconComp = Icon as typeof TrendingUp;
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#2563eb]">
                    <IconComp className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-[#0f172a]">{title as string}</p>
                    <p className="text-[11px] text-[#94a3b8]">{desc as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Req() {
  return <span className="text-danger">*</span>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-[#94a3b8]">{children}</p>;
}

function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">
      <Plus className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function ProductImagesField({ control, index }: { control: Control<FormValues>; index: number }) {
  const imagesArray = useFieldArray({ control, name: `products.${index}.images` as const });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Product Images</Label>
        <Button onClick={() => imagesArray.append({ url: "" })}>Add Image</Button>
      </div>
      {imagesArray.fields.length === 0 && <p className="text-[11.5px] text-[#94a3b8]">No images yet — add one or more photos of this product.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {imagesArray.fields.map((field, imgIndex) => (
          <div key={field.id} className="space-y-1.5">
            <Controller
              control={control}
              name={`products.${index}.images.${imgIndex}.url` as const}
              render={({ field: f }) => <FileUpload folder="startup_cover" value={f.value} onUploaded={(url) => f.onChange(url)} label="Upload image" />}
            />
            <button type="button" onClick={() => imagesArray.remove(imgIndex)} className="text-[11px] font-bold text-danger">
              Remove Image
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-[12px] font-bold text-danger sm:col-span-2 sm:w-fit">
      <Trash2 className="h-3.5 w-3.5" /> Remove
    </button>
  );
}

function LabelValueArray({
  title,
  hint,
  placeholder1,
  placeholder2,
  arr,
  name,
  register,
}: {
  title: string;
  hint?: string;
  placeholder1: string;
  placeholder2: string;
  arr: { fields: { id: string }[]; append: (v: { label: string; value: string }) => void; remove: (i: number) => void };
  name: "tractionStats" | "businessPlan" | "expectedOutcomes";
  register: ReturnType<typeof useForm<FormValues>>["register"];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>{title}</Label>
          {hint && <Hint>{hint}</Hint>}
        </div>
        <Button onClick={() => arr.append({ label: "", value: "" })}>Add</Button>
      </div>
      {arr.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
          <Input placeholder={placeholder1} {...register(`${name}.${index}.label` as const)} />
          <Input placeholder={placeholder2} {...register(`${name}.${index}.value` as const)} />
          <button type="button" onClick={() => arr.remove(index)} className="text-danger">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function IndustrySelect({ control, name }: { control: Control<FormValues>; name: "industry" }) {
  return <SelectController control={control} name={name} placeholder="Select industry / sector" options={INDUSTRIES} />;
}

function SubIndustrySelect({ control, industry }: { control: Control<FormValues>; industry?: string }) {
  const options = industry ? INDUSTRY_SUBCATEGORIES[industry] ?? [] : [];
  if (options.length === 0) {
    return <p className="flex h-9 items-center text-[12px] text-[#94a3b8]">Select an industry first.</p>;
  }
  return <SelectController control={control} name="subIndustry" placeholder="Select sub-category" options={options} />;
}

function StageSelect({ control, name }: { control: Control<FormValues>; name: "stage" }) {
  return (
    <SelectController
      control={control}
      name={name}
      placeholder="Select stage"
      options={STAGES.map((s) => ({ value: s, label: s.replace("_", " ") }))}
    />
  );
}

function SelectController({
  control,
  name,
  placeholder,
  options,
}: {
  control: Control<FormValues>;
  name: "industry" | "subIndustry" | "stage";
  placeholder: string;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => {
              const value = typeof opt === "string" ? opt : opt.value;
              const label = typeof opt === "string" ? opt : opt.label;
              return (
                <SelectItem key={value} value={value} className="capitalize">
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    />
  );
}

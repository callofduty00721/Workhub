import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
import { startupApi } from "@/api/startups";
import { cn } from "@/lib/utils";
import {
  STEPS,
  STAGE_TIPS,
  schema,
  STEP_FIELDS,
  joinLines,
  joinCommas,
  emptyDefaults,
  buildPayload,
  type FormValues,
} from "@/roles/founder/components/create/schema";
import { Step1Overview } from "@/roles/founder/components/create/Step1Overview";
import { Step2Team } from "@/roles/founder/components/create/Step2Team";
import { Step3Funding } from "@/roles/founder/components/create/Step3Funding";
import { Step4Product } from "@/roles/founder/components/create/Step4Product";
import { Step5Documents } from "@/roles/founder/components/create/Step5Documents";

const NEW_STARTUP_DRAFT_KEY = "growhive:createStartupDraft";

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

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });
  const {
    handleSubmit,
    reset,
    trigger,
    getValues,
    watch,
    formState: { isSubmitting },
  } = methods;

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

  const progressPct = Math.round(((step - 1) / STEPS.length) * 100);

  if (notFound) {
    return (
      <div className="bg-muted py-20 text-center">
        <p className="text-lg font-semibold text-foreground">Startup not found</p>
        <p className="mt-1 text-sm text-muted-foreground">This startup doesn&apos;t exist or doesn&apos;t belong to you.</p>
        <Link to="/dashboard/founder" className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-card">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-muted">
      <div className="container py-6">
        <Link to="/dashboard/founder" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold text-foreground">{existing ? "Manage Your Startup" : "Create Your Startup"}</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">Showcase your idea, team and vision to the right people.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-[12.5px] font-bold text-foreground hover:bg-muted"
            >
              <FileEdit className="h-4 w-4" /> Save as Draft
            </button>
            <button
              type="submit"
              form="create-startup-form"
              disabled={isSubmitting || mutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[12.5px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Preview &amp; Submit <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {restoredDraft && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-brand/20 bg-brand/10 px-4 py-3">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-brand">
              <History className="h-4 w-4" /> We restored your unsaved progress from last time.
            </p>
            <button type="button" onClick={discardLocalDraft} className="flex items-center gap-1 text-[11.5px] font-bold text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" /> Discard &amp; start fresh
            </button>
          </div>
        )}

        <FormProvider {...methods}>
          <form id="create-startup-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr_280px] lg:items-start" noValidate>
            {/* LEFT STEP NAV */}
            <div className="space-y-4 lg:sticky lg:top-4">
              <div className="space-y-1 rounded-2xl border border-border bg-card p-3">
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
                        step === s.id ? "bg-brand/10" : locked ? "cursor-not-allowed opacity-50" : "hover:bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                          step === s.id ? "bg-brand text-brand-foreground" : step > s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                      </span>
                      <span>
                        <p className={cn("text-[13px] font-bold", step === s.id ? "text-brand" : "text-foreground")}>{s.title}</p>
                        <p className="text-[11px] text-muted-foreground/70">{s.desc}</p>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[13px] font-bold text-foreground">{progressPct}% Completed</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground/70">Complete all steps to publish your startup</p>
              </div>
            </div>

            {/* CENTER FORM */}
            <div className="min-w-0 rounded-2xl border border-border bg-card p-6">
              <h3 className="text-[17px] font-extrabold text-foreground">
                {step}. {STEPS[step - 1].title}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{STEPS[step - 1].desc}.</p>

              {STAGE_TIPS[watch("stage")]?.[step as (typeof STEPS)[number]["id"]] && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-2.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <p className="text-[12px] leading-relaxed text-foreground/80">{STAGE_TIPS[watch("stage")][step as (typeof STEPS)[number]["id"]]}</p>
                </div>
              )}

              <div className="mt-5 space-y-5">
                {step === 1 && <Step1Overview />}
                {step === 2 && <Step2Team />}
                {step === 3 && <Step3Funding />}
                {step === 4 && <Step4Product />}
                {step === 5 && <Step5Documents />}
              </div>

              {mutation.isError && (
                <div className="mt-5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  Something went wrong while saving your startup. Please try again.
                </div>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-border px-4 py-2.5 text-[12.5px] font-bold text-foreground hover:bg-muted">
                  Cancel
                </button>
                {step < STEPS.length ? (
                  <button type="button" onClick={goNext} className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[12.5px] font-bold text-primary-foreground hover:opacity-90">
                    Save &amp; Next <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting || mutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[12.5px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                    {(isSubmitting || mutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                    {existing ? "Save Changes" : "Submit for Review"}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT GUIDANCE */}
            <div className="space-y-5 lg:sticky lg:top-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="text-[14px] font-bold text-foreground">Steps to Create Startup</h4>
                <div className="mt-4 space-y-4">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            step >= s.id ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {s.id}
                        </span>
                        {i < STEPS.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-[12.5px] font-bold text-foreground">{s.title}</p>
                        <p className="text-[11px] text-muted-foreground/70">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                  <Info className="h-4 w-4 text-brand" /> Guidelines
                </h4>
                <ul className="mt-3 space-y-2">
                  {["Be clear and concise", "Use simple and professional language", "Add accurate and honest information", "Proper details increase trust"].map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-foreground/80">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" /> {g}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                  <LifeBuoy className="h-4 w-4 text-brand" /> Need Help?
                </h4>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Read our documentation or contact our support team.</p>
                <Link to="/contact" className="mt-3 block w-full rounded-lg border border-border py-2 text-center text-[12.5px] font-bold text-foreground hover:bg-muted">
                  View Help Center
                </Link>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>

      <div className="mt-10 border-t border-border bg-card py-8">
        <div className="container flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Handshake className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-bold text-foreground">Why create your startup on GrowHive?</p>
              <p className="text-[12px] text-muted-foreground">Get discovered by investors, mentors, partners and grow your network.</p>
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-brand">
                    <IconComp className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-foreground">{title as string}</p>
                    <p className="text-[11px] text-muted-foreground/70">{desc as string}</p>
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

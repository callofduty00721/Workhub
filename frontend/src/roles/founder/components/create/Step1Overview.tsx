import { useFieldArray, useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/lib/geo";
import { INCORPORATION_TYPES, type FormValues } from "./schema";
import { Req, Hint, Button, RemoveRowButton, LabelValueArray } from "./formFields";
import { IndustrySelect, SubIndustrySelect, StageSelect } from "./formFields";

export function Step1Overview() {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<FormValues>();

  const businessPlanArray = useFieldArray({ control, name: "businessPlan" });
  const tractionArray = useFieldArray({ control, name: "tractionStats" });
  const milestonesArray = useFieldArray({ control, name: "milestones" });

  const nameLen = watch("name")?.length ?? 0;
  const taglineLen = watch("tagline")?.length ?? 0;
  const descLen = watch("description")?.length ?? 0;

  return (
    <>
      <h4 className="text-[13px] font-bold text-foreground">Basic Details</h4>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="name">Startup Name <Req /></Label>
            <span className="text-[10.5px] text-muted-foreground/70">{nameLen}/100</span>
          </div>
          <Hint>This is how your startup will appear across GrowHive.</Hint>
          <Input id="name" maxLength={100} placeholder="Enter startup name" {...register("name")} />
          {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tagline">Tagline <Req /></Label>
            <span className="text-[10.5px] text-muted-foreground/70">{taglineLen}/120</span>
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
          <span className="text-[10.5px] text-muted-foreground/70">{descLen}/500</span>
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
            <p className="text-[10.5px] text-muted-foreground/70">Recommended: 400 × 400px (square), max 10MB.</p>
          </div>
          <div className="space-y-1">
            <Controller control={control} name="coverImage" render={({ field }) => (
              <FileUpload folder="startup_cover" value={field.value} onUploaded={(url) => field.onChange(url)} label="Upload Cover Image — JPG, PNG" />
            )} />
            <p className="text-[10.5px] text-muted-foreground/70">Recommended: 1600 × 500px (16:5 ratio), max 10MB.</p>
          </div>
        </div>
      </div>

      <h4 className="border-t border-border pt-5 text-[13px] font-bold text-foreground">Problem &amp; Solution</h4>
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

      <h4 className="border-t border-border pt-5 text-[13px] font-bold text-foreground">Mission, Highlights &amp; Business Plan</h4>
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
        {milestonesArray.fields.length === 0 && <p className="text-[12.5px] text-muted-foreground/70">No milestones added yet — highlight key moments in your journey.</p>}
        {milestonesArray.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
            <Input placeholder="Milestone title (e.g. First 100 customers)" {...register(`milestones.${index}.title` as const)} />
            <Input type="date" {...register(`milestones.${index}.date` as const)} />
            <Textarea placeholder="Description (optional)" className="min-h-[60px] sm:col-span-2" {...register(`milestones.${index}.description` as const)} />
            <RemoveRowButton onClick={() => milestonesArray.remove(index)} />
          </div>
        ))}
      </div>
    </>
  );
}

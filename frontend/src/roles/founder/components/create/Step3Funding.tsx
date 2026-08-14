import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FormValues } from "./schema";
import { Hint, Button, RemoveRowButton, LabelValueArray } from "./formFields";

export function Step3Funding() {
  const { register, control } = useFormContext<FormValues>();
  const fundUsageArray = useFieldArray({ control, name: "fundUsagePlan" });
  const outcomesArray = useFieldArray({ control, name: "expectedOutcomes" });

  return (
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
          <div key={field.id} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
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
  );
}

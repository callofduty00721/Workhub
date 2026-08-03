import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS, type FormValues } from "./schema";
import { Hint, Button, RemoveRowButton, ProductImagesField } from "./formFields";

export function Step4Product() {
  const { register, control } = useFormContext<FormValues>();
  const productsArray = useFieldArray({ control, name: "products" });
  const howItWorksArray = useFieldArray({ control, name: "howItWorks" });
  const planPhasesArray = useFieldArray({ control, name: "planPhases" });
  const marketStatsArray = useFieldArray({ control, name: "marketStats" });

  return (
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
  );
}

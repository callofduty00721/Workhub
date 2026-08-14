import { Controller, useFieldArray, useForm, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { INDUSTRIES, INDUSTRY_SUBCATEGORIES } from "@/lib/mockData";
import { STAGES, type FormValues } from "./schema";

export function Req() {
  return <span className="text-danger">*</span>;
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground/70">{children}</p>;
}

export function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-bold text-foreground hover:bg-muted">
      <Plus className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

export function ProductImagesField({ control, index }: { control: Control<FormValues>; index: number }) {
  const imagesArray = useFieldArray({ control, name: `products.${index}.images` as const });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Product Images</Label>
        <Button onClick={() => imagesArray.append({ url: "" })}>Add Image</Button>
      </div>
      {imagesArray.fields.length === 0 && <p className="text-[11.5px] text-muted-foreground/70">No images yet — add one or more photos of this product.</p>}
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

export function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-[12px] font-bold text-danger sm:col-span-2 sm:w-fit">
      <Trash2 className="h-3.5 w-3.5" /> Remove
    </button>
  );
}

export function LabelValueArray({
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

export function IndustrySelect({ control, name }: { control: Control<FormValues>; name: "industry" }) {
  return <SelectController control={control} name={name} placeholder="Select industry / sector" options={INDUSTRIES} />;
}

export function SubIndustrySelect({ control, industry }: { control: Control<FormValues>; industry?: string }) {
  const options = industry ? INDUSTRY_SUBCATEGORIES[industry] ?? [] : [];
  if (options.length === 0) {
    return <p className="flex h-9 items-center text-[12px] text-muted-foreground/70">Select an industry first.</p>;
  }
  return <SelectController control={control} name="subIndustry" placeholder="Select sub-category" options={options} />;
}

export function StageSelect({ control, name }: { control: Control<FormValues>; name: "stage" }) {
  return (
    <SelectController
      control={control}
      name={name}
      placeholder="Select stage"
      options={STAGES.map((s) => ({ value: s, label: s.replace("_", " ") }))}
    />
  );
}

export function SelectController({
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

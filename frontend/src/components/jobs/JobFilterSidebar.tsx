import { SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { JOB_CATEGORIES, type JobCategory, type JobType } from "@/types";

const TYPES: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "internship", label: "Internship" },
];

export interface JobFilterState {
  types: JobType[];
  categories: JobCategory[];
  isRemote: boolean;
  maxSalary: number;
}

export const MAX_SALARY = 300000;

export const DEFAULT_JOB_FILTERS: JobFilterState = {
  types: [],
  categories: [],
  isRemote: false,
  maxSalary: MAX_SALARY,
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function JobFilterSidebar({
  value,
  onChange,
}: {
  value: JobFilterState;
  onChange: (next: JobFilterState) => void;
}) {
  return (
    <aside className="sticky top-6 h-fit space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <h3 className="text-lg font-bold">Filters</h3>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Job Type</h4>
          {TYPES.map((t) => (
            <FilterCheckboxRow
              key={t.value}
              label={t.label}
              checked={value.types.includes(t.value)}
              onCheckedChange={() => onChange({ ...value, types: toggle(value.types, t.value) })}
            />
          ))}
        </div>

        <div className="my-5 border-t border-border" />

        <FilterCheckboxRow
          label="Remote Only"
          checked={value.isRemote}
          onCheckedChange={(checked) => onChange({ ...value, isRemote: checked })}
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-bold">Category</h3>
        <div className="space-y-3">
          {JOB_CATEGORIES.map((c) => (
            <FilterCheckboxRow
              key={c}
              label={c}
              checked={value.categories.includes(c)}
              onCheckedChange={() => onChange({ ...value, categories: toggle(value.categories, c) })}
            />
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-bold">Max Salary</h3>
        <Slider
          value={[value.maxSalary]}
          max={MAX_SALARY}
          step={5000}
          onValueChange={([v]) => onChange({ ...value, maxSalary: v })}
        />
        <div className="mt-3 flex justify-between text-sm text-muted-foreground">
          <span>$0</span>
          <span>${value.maxSalary.toLocaleString()}{value.maxSalary >= MAX_SALARY ? "+" : ""}</span>
        </div>
      </div>
    </aside>
  );
}

function FilterCheckboxRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <Checkbox checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} />
    </label>
  );
}

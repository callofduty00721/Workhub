import { SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JOB_CATEGORIES, COMPANY_TYPES, INDUSTRY_TYPES, INDUSTRY_SUB_INDUSTRIES, type JobCategory, type JobType, type CompanyType } from "@/types";

const TYPES: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "internship", label: "Internship" },
];

export interface JobFilterState {
  types: JobType[];
  categories: JobCategory[];
  isRemote: boolean;
  minSalary: number;
  maxSalary: number;
  // Exact match against the fixed naukri.com-style industry list — see
  // INDUSTRY_TYPE_VALUES in job.model.js.
  industryType: string;
  subIndustry: string;
  qualification: string;
  companyTypes: CompanyType[];
}

// ₹15L ceiling matches the "Browse by Salary" cards' top bracket
// (getJobSalaryRangeCounts in job.controller.js) — both controls share the
// same real range instead of the old 3L-only slider.
export const MAX_SALARY = 1500000;

export const DEFAULT_JOB_FILTERS: JobFilterState = {
  types: [],
  categories: [],
  isRemote: false,
  minSalary: 0,
  maxSalary: MAX_SALARY,
  industryType: "",
  subIndustry: "",
  qualification: "",
  companyTypes: [],
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Same four brackets as the "Browse by Salary" cards / getJobSalaryRangeCounts
// in job.controller.js — kept as one fixed list here (rather than fetched)
// since the boundaries themselves don't change, only the live counts do.
const SALARY_RANGE_OPTIONS = [
  { min: 0, max: 300000, label: "₹ 0-3 Lakhs" },
  { min: 300000, max: 600000, label: "₹ 3-6 Lakhs" },
  { min: 600000, max: 1000000, label: "₹ 6-10 Lakhs" },
  { min: 1000000, max: 1500000, label: "₹ 10-15 Lakhs" },
];

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
        <h3 className="mb-4 font-bold">Salary Range</h3>
        <Select
          value={value.minSalary === 0 && value.maxSalary === MAX_SALARY ? "any" : `${value.minSalary}-${value.maxSalary}`}
          onValueChange={(v) => {
            if (v === "any") {
              onChange({ ...value, minSalary: DEFAULT_JOB_FILTERS.minSalary, maxSalary: DEFAULT_JOB_FILTERS.maxSalary });
              return;
            }
            const [min, max] = v.split("-").map(Number);
            onChange({ ...value, minSalary: min, maxSalary: max });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any Salary" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Salary</SelectItem>
            {SALARY_RANGE_OPTIONS.map((r) => (
              <SelectItem key={r.min} value={`${r.min}-${r.max}`}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-bold">Company Type</h3>
        <div className="space-y-3">
          {COMPANY_TYPES.map((ct) => (
            <FilterCheckboxRow
              key={ct}
              label={ct}
              checked={value.companyTypes.includes(ct)}
              onCheckedChange={() => onChange({ ...value, companyTypes: toggle(value.companyTypes, ct) })}
            />
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-bold">Industry</h3>
        <Select
          value={value.industryType || "any"}
          onValueChange={(v) => onChange({ ...value, industryType: v === "any" ? "" : v, subIndustry: "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Industry</SelectItem>
            {INDUSTRY_TYPES.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {value.industryType && (INDUSTRY_SUB_INDUSTRIES[value.industryType]?.length ?? 0) > 0 && (
          <div className="mt-3">
            <Select value={value.subIndustry || "any"} onValueChange={(v) => onChange({ ...value, subIndustry: v === "any" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Any Sub-Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Sub-Industry</SelectItem>
                {INDUSTRY_SUB_INDUSTRIES[value.industryType].map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-bold">Qualification</h3>
        <Input
          value={value.qualification}
          onChange={(e) => onChange({ ...value, qualification: e.target.value })}
          placeholder="e.g. B.Tech, MBA, Any Graduate..."
        />
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

import { ShieldCheck } from "lucide-react";
import { SelectItem } from "@/components/ui/select";
import type { FreelancerSort } from "@/api/freelancers";
import { SERVICE_CATEGORY_NAMES, SERVICE_SUBCATEGORIES } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { FilterSidebarShell, FilterBlock, FullSelect } from "@/components/shared/FilterPanel";

interface Props {
  category: string;
  setCategory: (v: string) => void;
  subCategory: string;
  setSubCategory: (v: string) => void;
  minExperience: string;
  setMinExperience: (v: string) => void;
  budget: string;
  setBudget: (v: string) => void;
  minRating: string;
  setMinRating: (v: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  availability: string;
  setAvailability: (v: string) => void;
  sort: FreelancerSort;
  setSort: (v: FreelancerSort) => void;
  resultCount: number;
}

const EXPERIENCE_OPTIONS = [
  { label: "Any Experience", value: "any" },
  { label: "1+ Years", value: "1" },
  { label: "3+ Years", value: "3" },
  { label: "5+ Years", value: "5" },
  { label: "10+ Years", value: "10" },
];

const BUDGET_OPTIONS = [
  { label: "Any Budget", value: "any" },
  { label: "Under ₹1,000/hr", value: "0-1000" },
  { label: "₹1,000 – ₹2,000/hr", value: "1000-2000" },
  { label: "₹2,000+/hr", value: "2000-" },
];

const RATING_OPTIONS = [
  { label: "Any Rating", value: "any" },
  { label: "4.5 & up", value: "4.5" },
  { label: "4.0 & up", value: "4" },
  { label: "3.0 & up", value: "3" },
];

const SORT_OPTIONS: { label: string; value: FreelancerSort }[] = [
  { label: "Best Match", value: "best_match" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Experienced", value: "experience" },
  { label: "Rate: Low to High", value: "rate_low" },
  { label: "Rate: High to Low", value: "rate_high" },
  { label: "Newest", value: "newest" },
];

// Left-column filter panel for the Freelancers tab.
export default function FilterSidebar({
  category,
  setCategory,
  subCategory,
  setSubCategory,
  minExperience,
  setMinExperience,
  budget,
  setBudget,
  minRating,
  setMinRating,
  verifiedOnly,
  setVerifiedOnly,
  availability,
  setAvailability,
  sort,
  setSort,
  resultCount,
}: Props) {
  return (
    <FilterSidebarShell title="Filters" subtitle={`${resultCount.toLocaleString()} freelancer${resultCount === 1 ? "" : "s"} found`}>
      <FilterBlock label="Category">
        <FullSelect
          value={category}
          onChange={(v) => {
            setCategory(v);
            setSubCategory("all");
          }}
          placeholder="Category"
        >
          <SelectItem value="all">All Categories</SelectItem>
          {SERVICE_CATEGORY_NAMES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      {category !== "all" && (SERVICE_SUBCATEGORIES[category]?.length ?? 0) > 0 && (
        <FilterBlock label="Sub-category">
          <FullSelect value={subCategory} onChange={setSubCategory} placeholder="Sub-category">
            <SelectItem value="all">All {category}</SelectItem>
            {SERVICE_SUBCATEGORIES[category].map((sub) => (
              <SelectItem key={sub} value={sub}>
                {sub}
              </SelectItem>
            ))}
          </FullSelect>
        </FilterBlock>
      )}

      <FilterBlock label="Experience">
        <FullSelect value={minExperience} onChange={setMinExperience} placeholder="Experience">
          {EXPERIENCE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Budget">
        <FullSelect value={budget} onChange={setBudget} placeholder="Budget">
          {BUDGET_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Rating">
        <FullSelect value={minRating} onChange={setMinRating} placeholder="Rating">
          {RATING_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Availability">
        <FullSelect value={availability} onChange={setAvailability} placeholder="Availability">
          <SelectItem value="any">Any Availability</SelectItem>
          <SelectItem value="available">Available Now</SelectItem>
          <SelectItem value="busy">Busy</SelectItem>
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Sort by">
        <FullSelect value={sort} onChange={(v) => setSort(v as FreelancerSort)} placeholder="Sort">
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <button
        type="button"
        onClick={() => setVerifiedOnly(!verifiedOnly)}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
          verifiedOnly ? "border-primary bg-primary/10 text-primary" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified Only
      </button>
    </FilterSidebarShell>
  );
}

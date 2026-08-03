import { SelectItem } from "@/components/ui/select";
import type { ServiceSort } from "@/api/freelancers";
import { SERVICE_CATEGORY_NAMES, SERVICE_SUBCATEGORIES } from "@/lib/mockData";
import { FilterSidebarShell, FilterBlock, FullSelect } from "@/components/shared/FilterPanel";

interface Props {
  category: string;
  setCategory: (v: string) => void;
  subCategory: string;
  setSubCategory: (v: string) => void;
  budget: string;
  setBudget: (v: string) => void;
  maxDeliveryDays: string;
  setMaxDeliveryDays: (v: string) => void;
  minRating: string;
  setMinRating: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  sort: ServiceSort;
  setSort: (v: ServiceSort) => void;
  resultCount: number;
}

const BUDGET_OPTIONS = [
  { label: "Any Budget", value: "any" },
  { label: "Under ₹5,000", value: "0-5000" },
  { label: "₹5,000 – ₹20,000", value: "5000-20000" },
  { label: "₹20,000+", value: "20000-" },
];

const DELIVERY_OPTIONS = [
  { label: "Any Delivery Time", value: "any" },
  { label: "Up to 1 day", value: "1" },
  { label: "Up to 3 days", value: "3" },
  { label: "Up to 7 days", value: "7" },
  { label: "Up to 30 days", value: "30" },
];

const RATING_OPTIONS = [
  { label: "Any Rating", value: "any" },
  { label: "4.0 & up", value: "4" },
  { label: "3.0 & up", value: "3" },
  { label: "2.0 & up", value: "2" },
];

const LEVEL_OPTIONS: { label: string; value: "top_rated" | "level_1" | "new" }[] = [
  { label: "Top Rated Seller", value: "top_rated" },
  { label: "Level 1 Seller", value: "level_1" },
  { label: "New Seller", value: "new" },
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Marathi"];

const SORT_OPTIONS: { label: string; value: ServiceSort }[] = [
  { label: "Best Match", value: "best_match" },
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
];

// Left-column filter panel for the Gigs tab.
export default function GigFilterSidebar({
  category,
  setCategory,
  subCategory,
  setSubCategory,
  budget,
  setBudget,
  maxDeliveryDays,
  setMaxDeliveryDays,
  minRating,
  setMinRating,
  level,
  setLevel,
  language,
  setLanguage,
  sort,
  setSort,
  resultCount,
}: Props) {
  const subCategoryOptions = category !== "all" ? SERVICE_SUBCATEGORIES[category] ?? [] : [];

  return (
    <FilterSidebarShell title="Filters" subtitle={`${resultCount.toLocaleString()} gig${resultCount === 1 ? "" : "s"} found`}>
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

      {subCategoryOptions.length > 0 && (
        <FilterBlock label="Sub-Category">
          <FullSelect value={subCategory} onChange={setSubCategory} placeholder="Sub-Category">
            <SelectItem value="all">All {category}</SelectItem>
            {subCategoryOptions.map((sub) => (
              <SelectItem key={sub} value={sub}>
                {sub}
              </SelectItem>
            ))}
          </FullSelect>
        </FilterBlock>
      )}

      <FilterBlock label="Budget">
        <FullSelect value={budget} onChange={setBudget} placeholder="Budget">
          {BUDGET_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Delivery Time">
        <FullSelect value={maxDeliveryDays} onChange={setMaxDeliveryDays} placeholder="Delivery Time">
          {DELIVERY_OPTIONS.map((o) => (
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

      <FilterBlock label="Seller Level">
        <FullSelect value={level} onChange={setLevel} placeholder="Seller Level">
          <SelectItem value="any">Any Seller Level</SelectItem>
          {LEVEL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Language">
        <FullSelect value={language} onChange={setLanguage} placeholder="Language">
          <SelectItem value="any">Any Language</SelectItem>
          {LANGUAGE_OPTIONS.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Sort by">
        <FullSelect value={sort} onChange={(v) => setSort(v as ServiceSort)} placeholder="Sort">
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>
    </FilterSidebarShell>
  );
}

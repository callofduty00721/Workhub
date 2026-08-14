import { ShieldCheck } from "lucide-react";
import { SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FilterSidebarShell, FilterBlock, FullSelect } from "@/components/shared/FilterPanel";
import { INFLUENCER_CATEGORY_NAMES, INFLUENCER_CATEGORIES } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import type { InfluencerSort } from "@/api/influencers";

interface Props {
  category: string;
  setCategory: (v: string) => void;
  niche: string;
  setNiche: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  minRating: string;
  setMinRating: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  followerRange: string;
  setFollowerRange: (v: string) => void;
  maxBudget: string;
  setMaxBudget: (v: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  sort: InfluencerSort;
  setSort: (v: InfluencerSort) => void;
  resultCount: number;
  variant?: "default" | "dark";
}

const RATING_OPTIONS = [
  { label: "Any Rating", value: "any" },
  { label: "4.0 & up", value: "4" },
  { label: "3.0 & up", value: "3" },
  { label: "2.0 & up", value: "2" },
];

// Same free-text platform field InfluencerCard.tsx's PLATFORM_META renders
// icons for — matched case-insensitively on the backend, so these are just
// the common canonical spellings, not an enum.
const PLATFORM_OPTIONS = ["Instagram", "YouTube", "LinkedIn", "Twitter", "TikTok", "Facebook"];

// Standard creator-tier brackets (nano/micro/mid/macro/mega) — "Mega" is
// open-ended, encoded as `${min}-inf` and sent to the API as minFollowers
// only (no maxFollowers), mirroring how JobFilterSidebar encodes its salary
// brackets as a single "min-max" select value.
export const FOLLOWER_RANGE_OPTIONS = [
  { min: 1_000, max: 10_000, label: "Nano · 1K–10K" },
  { min: 10_000, max: 100_000, label: "Micro · 10K–100K" },
  { min: 100_000, max: 500_000, label: "Mid · 100K–500K" },
  { min: 500_000, max: 1_000_000, label: "Macro · 500K–1M" },
  { min: 1_000_000, max: Infinity, label: "Mega · 1M+" },
];

// A ceiling, not a range — matches maxBudget's semantics on the backend
// (keep every influencer whose cheapest rate-card entry is at or under this).
const BUDGET_OPTIONS = [
  { label: "Under ₹5,000", value: "5000" },
  { label: "Under ₹20,000", value: "20000" },
  { label: "Under ₹50,000", value: "50000" },
  { label: "Under ₹1,00,000", value: "100000" },
];

const SORT_OPTIONS: { label: string; value: InfluencerSort }[] = [
  { label: "Best Match", value: "match" },
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Reviewed", value: "reviews" },
  { label: "Most Followers", value: "followers" },
  { label: "Most Campaigns Completed", value: "campaigns" },
];

// Left-column filter panel for the Influencer Directory — real, backend-
// supported filters only (see listInfluencers in influencer.controller.js).
export default function InfluencerFilterSidebar({
  category,
  setCategory,
  niche,
  setNiche,
  location,
  setLocation,
  minRating,
  setMinRating,
  platform,
  setPlatform,
  followerRange,
  setFollowerRange,
  maxBudget,
  setMaxBudget,
  verifiedOnly,
  setVerifiedOnly,
  sort,
  setSort,
  resultCount,
  variant = "default",
}: Props) {
  const nicheOptions = category !== "all" ? INFLUENCER_CATEGORIES[category] ?? [] : [];
  const dark = variant === "dark";

  return (
    <FilterSidebarShell title="Filters" subtitle={`${resultCount.toLocaleString()} influencer${resultCount === 1 ? "" : "s"} found`} variant={variant}>
      <FilterBlock label="Category" variant={variant}>
        <FullSelect
          value={category}
          onChange={(v) => {
            setCategory(v);
            setNiche("any");
          }}
          placeholder="Category"
          variant={variant}
        >
          <SelectItem value="all">All Categories</SelectItem>
          {INFLUENCER_CATEGORY_NAMES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
          <SelectItem value="other">Other</SelectItem>
        </FullSelect>
      </FilterBlock>

      {nicheOptions.length > 0 && (
        <FilterBlock label="Niche" variant={variant}>
          <FullSelect value={niche} onChange={setNiche} placeholder="Niche" variant={variant}>
            <SelectItem value="any">All {category}</SelectItem>
            {nicheOptions.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </FullSelect>
        </FilterBlock>
      )}

      <FilterBlock label="Location" variant={variant}>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state..."
          className={cn(
            "h-9 rounded-lg text-[13px]",
            dark ? "border-white/10 bg-white/5 text-white placeholder:text-white/40" : "border-neutral-200 text-neutral-700"
          )}
        />
      </FilterBlock>

      <FilterBlock label="Rating" variant={variant}>
        <FullSelect value={minRating} onChange={setMinRating} placeholder="Rating" variant={variant}>
          {RATING_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Platform" variant={variant}>
        <FullSelect value={platform} onChange={setPlatform} placeholder="Platform" variant={variant}>
          <SelectItem value="any">Any Platform</SelectItem>
          {PLATFORM_OPTIONS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Followers" variant={variant}>
        <FullSelect value={followerRange} onChange={setFollowerRange} placeholder="Followers" variant={variant}>
          <SelectItem value="any">Any Size</SelectItem>
          {FOLLOWER_RANGE_OPTIONS.map((r) => (
            <SelectItem key={r.label} value={r.label}>
              {r.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Budget (per post)" variant={variant}>
        <FullSelect value={maxBudget} onChange={setMaxBudget} placeholder="Budget" variant={variant}>
          <SelectItem value="any">Any Budget</SelectItem>
          {BUDGET_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </FullSelect>
      </FilterBlock>

      <FilterBlock label="Sort by" variant={variant}>
        <FullSelect value={sort} onChange={(v) => setSort(v as InfluencerSort)} placeholder="Sort" variant={variant}>
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
          dark
            ? verifiedOnly
              ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#65d838]"
              : "border-white/10 text-[#A1A1AA] hover:border-white/20"
            : verifiedOnly
              ? "border-[#171717] bg-[#F5F5F5] text-[#171717]"
              : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified Only
      </button>
    </FilterSidebarShell>
  );
}

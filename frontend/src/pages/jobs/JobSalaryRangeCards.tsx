import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { jobApi } from "@/api/jobs";

export interface SalaryRange {
  min: number;
  max: number;
}

// Real counts (see getJobSalaryRangeCounts in job.controller.js) — bucketed
// by each open job's posted salaryMin, not a fabricated/static list.
export function JobSalaryRangeCards({
  selected,
  onSelect,
}: {
  selected: SalaryRange | null;
  onSelect: (range: SalaryRange | null) => void;
}) {
  const { data, isLoading } = useQuery({ queryKey: ["jobs", "salary-range-counts"], queryFn: jobApi.salaryRangeCounts });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {data.map((range) => {
        const isSelected = selected?.min === range.min && selected?.max === range.max;
        return (
          <button
            key={range.min}
            type="button"
            onClick={() => onSelect(isSelected ? null : { min: range.min, max: range.max })}
            className={cn(
              "rounded-2xl border bg-card px-4 py-3.5 text-left transition-colors",
              isSelected ? "border-brand ring-1 ring-brand" : "border-border hover:border-muted-foreground/30"
            )}
          >
            <p className="text-[18px] font-bold text-foreground">{range.label}</p>
            <p className="mt-0.5 text-[15px] font-medium text-brand">{range.count.toLocaleString()} Jobs</p>
          </button>
        );
      })}
    </div>
  );
}

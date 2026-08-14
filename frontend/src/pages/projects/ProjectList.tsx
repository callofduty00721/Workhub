import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectItem } from "@/components/ui/select";
import { ProjectCard } from "@/pages/projects/ProjectCard";
import { Pagination } from "@/components/shared/Pagination";
import { CategoryBrowsePanel } from "@/roles/freelancer/components/CategoryBrowsePanel";
import { FilterSidebarShell, FilterBlock, FullSelect } from "@/components/shared/FilterPanel";
import { projectApi } from "@/api/projects";
import { SERVICE_CATEGORY_NAMES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { label: "Any Type", value: "any" },
  { label: "One-off Project", value: "freelance" },
  { label: "Ongoing Contract", value: "contract" },
];

// Self-contained Projects browsing tab — only loaded (code-split) once
// someone actually opens the "Projects" tab on the Freelance hub, instead of
// bundling project-search logic into FreelancerList.tsx itself.
export default function ProjectList({ search }: { search: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState("any");
  // URL-synced (not just local state) so the selection survives a back-nav
  // from a project's details page or a tab switch away and back — matching
  // how the Freelancers tab's own category filter already behaves.
  const initialCategory = searchParams.get("category");
  const [category, setCategoryState] = useState(
    initialCategory && SERVICE_CATEGORY_NAMES.includes(initialCategory) ? initialCategory : "all"
  );
  const [subCategory, setSubCategoryState] = useState(searchParams.get("subCategory") ?? "all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Both fields update together in one setSearchParams call — calling it
  // twice back-to-back (once for category, once for subCategory) would have
  // each read the same stale `prev`, so the second call would silently
  // clobber the first.
  const applyCategory = (cat: string, sub: string) => {
    setCategoryState(cat);
    setSubCategoryState(sub);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === "all") next.delete("category");
      else next.set("category", cat);
      if (sub === "all") next.delete("subCategory");
      else next.set("subCategory", sub);
      return next;
    });
  };

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", { search, type, category, subCategory, remoteOnly, page }],
    queryFn: () =>
      projectApi.list({
        search: search || undefined,
        type: type === "any" ? undefined : type,
        category: category === "all" ? undefined : category,
        subCategory: category !== "all" && subCategory !== "all" ? subCategory : undefined,
        isRemote: remoteOnly || undefined,
        page,
        limit: 12,
      }),
  });

  const total = projects?.pagination.total ?? 0;

  const selectCategory = (v: string) => {
    applyCategory(v, "all");
    setPage(1);
  };
  const selectSubCategory = (cat: string, sub: string) => {
    applyCategory(cat, sub);
    setPage(1);
  };

  return (
    <div>
      <div className="-mx-4 mb-6 border-b border-border bg-card px-4 sm:mx-0 sm:rounded-xl sm:border lg:sticky lg:top-[136px] lg:z-[25]">
        <CategoryBrowsePanel activeCategory={category} onSelectCategory={selectCategory} onSelectSubCategory={selectSubCategory} onViewAll={selectCategory} popup />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebarShell title="Filters" subtitle={`${total.toLocaleString()} project${total === 1 ? "" : "s"} found`}>
          <FilterBlock label="Type">
            <FullSelect
              value={type}
              onChange={(v) => {
                setType(v);
                setPage(1);
              }}
              placeholder="Type"
            >
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </FullSelect>
          </FilterBlock>

          <button
            type="button"
            onClick={() => {
              setRemoteOnly((v) => !v);
              setPage(1);
            }}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
              remoteOnly ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-muted-foreground/40"
            )}
          >
            Remote Only
          </button>
        </FilterSidebarShell>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-[22px]" />
              ))}
            </div>
          ) : !projects?.data.length ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
              <FolderKanban className="h-9 w-9 text-muted-foreground/50" />
              <p className="max-w-sm text-sm text-muted-foreground">No projects found. Try a different search or filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.data.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
              <Pagination page={page} pages={projects.pagination.pages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

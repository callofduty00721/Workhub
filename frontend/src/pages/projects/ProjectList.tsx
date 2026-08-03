import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectItem } from "@/components/ui/select";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Pagination } from "@/components/shared/Pagination";
import { CategoryBrowsePanel } from "@/roles/freelancer/components/CategoryBrowsePanel";
import { FilterSidebarShell, FilterBlock, FullSelect } from "@/components/shared/FilterPanel";
import { projectApi } from "@/api/projects";
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
  const [type, setType] = useState("any");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

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
    setCategory(v);
    setSubCategory("all");
    setPage(1);
  };
  const selectSubCategory = (cat: string, sub: string) => {
    setCategory(cat);
    setSubCategory(sub);
    setPage(1);
  };

  return (
    <div>
      <div className="-mx-4 mb-6 border-b border-neutral-200 bg-white px-4 sm:mx-0 sm:rounded-xl sm:border">
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
              remoteOnly ? "border-primary bg-primary/10 text-primary" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
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
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-white py-16 text-center">
              <FolderKanban className="h-9 w-9 text-neutral-300" />
              <p className="max-w-sm text-sm text-neutral-500">No projects found. Try a different search or filter.</p>
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

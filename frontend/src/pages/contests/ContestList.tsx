import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContestCard } from "@/pages/contests/ContestCard";
import { Pagination } from "@/components/shared/Pagination";
import { contestApi } from "@/api/contests";
import { useAuth } from "@/context/AuthContext";

export default function ContestList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({ queryKey: ["contests", "categories"], queryFn: contestApi.categories });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contests", { search, category, page }],
    queryFn: () => contestApi.list({ search: search || undefined, category: category === "all" ? undefined : category, page, limit: 12 }),
  });

  const canPost = user?.role === "employer" || user?.role === "client";
  const total = data?.pagination.total ?? 0;

  return (
    <div>
      {/* Header */}
      <section className="border-b bg-gradient-to-b from-primary/5 via-card to-card">
        <div className="container py-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              Win <span className="text-primary">contests</span>, showcase your skill
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Submit your best work and win prizes from clients on GrowHive.</p>

            <div className="mt-4 flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search contests, categories, skills..."
                  className="h-10 border-0 pl-9 text-[13px] shadow-none focus-visible:ring-0"
                />
              </div>
              {categories && categories.length > 0 && (
                <>
                  <div className="hidden h-6 w-px bg-border sm:block" />
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setPage(1);
                      setCategory(v);
                    }}
                  >
                    <SelectTrigger className="h-10 border-0 text-[13px] shadow-none focus:ring-0 sm:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {canPost && (
                <Link
                  to={user?.role === "client" ? "/dashboard/client/post-contest" : "/dashboard/employer/post-contest"}
                  className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Post a Contest
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-6">
        {!isLoading && (
          <p className="mb-4 text-[12.5px] font-medium text-muted-foreground">
            {total.toLocaleString()} contest{total === 1 ? "" : "s"}
          </p>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-[22px]" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-5 py-8 text-center text-sm text-danger">
            Couldn&apos;t load contests right now. Make sure the API server is running.
          </div>
        )}

        {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Trophy className="h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium text-foreground">No contests found</p>
            <p className="max-w-sm text-sm text-muted-foreground">Try a different search term, or check back later.</p>
          </div>
        )}

        {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data!.data.map((contest) => (
                <ContestCard key={contest._id} contest={contest} />
              ))}
            </div>
            <Pagination page={page} pages={data!.pagination.pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

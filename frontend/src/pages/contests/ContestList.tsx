import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContestCard } from "@/components/contests/ContestCard";
import { contestApi } from "@/api/contests";
import { useAuth } from "@/context/AuthContext";

export default function ContestList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contests", { search, page }],
    queryFn: () => contestApi.list({ search: search || undefined, page, limit: 12 }),
  });

  const canPost = user?.role === "employer" || user?.role === "client";

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Submit your best work and win prizes from clients on MahaHub.</p>
        </div>
        {canPost && (
          <Button variant="gradient" asChild>
            <Link to={user?.role === "client" ? "/dashboard/client/post-contest" : "/dashboard/employer/post-contest"}>
              <Plus className="h-4 w-4" /> Post a Contest
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6 relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search contests, categories, skills..."
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-5 py-8 text-center text-sm text-danger">
          Couldn&apos;t load contests right now. Make sure the API server is running.
        </div>
      )}

      {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Trophy className="h-9 w-9 text-muted-foreground" />
          <p className="font-medium">No contests found</p>
          <p className="max-w-sm text-sm text-muted-foreground">Try a different search term, or check back later.</p>
        </div>
      )}

      {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data!.data.map((contest) => (
              <ContestCard key={contest._id} contest={contest} />
            ))}
          </div>

          {data!.pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data!.pagination.page} of {data!.pagination.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data!.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

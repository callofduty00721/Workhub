import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Lock, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { formatCurrency } from "@/lib/utils";

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

export default function AdminContests() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "contests", { search, page }],
    queryFn: () => adminApi.contests({ search: search || undefined, page, limit: 20 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "contests"] });

  const closeMutation = useMutation({
    mutationFn: (contestId: string) => adminApi.closeContest(contestId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (contestId: string) => adminApi.removeContest(contestId),
    onSuccess: invalidate,
  });

  return (
    <DashboardLayout role="super_admin" title="Manage Contests" subtitle="Moderate client-posted contests on the marketplace.">
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by contest title..."
          className="pl-9"
        />
      </div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Contest</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Prize</th>
                <th className="px-5 py-3 font-medium">Entries</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((c) => {
                const client = typeof c.client === "object" ? c.client : null;
                return (
                  <tr key={c._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/contests/${c._id}`} className="font-medium hover:underline">
                        {c.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.category}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{client?.name ?? "—"}</td>
                    <td className="px-5 py-3">{formatCurrency(c.prizeAmount, c.currency as "INR" | "USD")}</td>
                    <td className="px-5 py-3">{c.entriesCount}</td>
                    <td className="px-5 py-3">
                      <Badge variant={c.status === "open" ? "success" : "outline"} className="capitalize">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {c.status !== "closed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={closeMutation.isPending}
                            onClick={() => closeMutation.mutate(c._id)}
                          >
                            <Lock className="h-3.5 w-3.5" /> Close
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          disabled={removeMutation.isPending}
                          onClick={() => confirm(`Remove "${c.title}"? This can't be undone.`) && removeMutation.mutate(c._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      </motion.div>

      {data && data.pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}

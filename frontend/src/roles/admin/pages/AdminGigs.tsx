import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Pause, Play, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { formatCurrency } from "@/lib/utils";

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

export default function AdminGigs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "services", { search, page }],
    queryFn: () => adminApi.services({ search: search || undefined, page, limit: 20 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "services"] });

  const toggleMutation = useMutation({
    mutationFn: (serviceId: string) => adminApi.toggleServiceStatus(serviceId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (serviceId: string) => adminApi.removeService(serviceId),
    onSuccess: invalidate,
  });

  return (
    <DashboardLayout role="super_admin" title="Manage Gigs" subtitle="Moderate freelancer services listed on the marketplace.">
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by gig title..."
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
                <th className="px-5 py-3 font-medium">Gig</th>
                <th className="px-5 py-3 font-medium">Freelancer</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((s) => {
                const freelancer = typeof s.freelancer === "object" ? s.freelancer : null;
                return (
                  <tr key={s._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/services/${s._id}`} className="font-medium hover:underline">
                        {s.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{s.category}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{freelancer?.name ?? "—"}</td>
                    <td className="px-5 py-3">{formatCurrency(s.price)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={s.status === "active" ? "success" : "outline"} className="capitalize">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(s._id)}
                        >
                          {s.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          {s.status === "active" ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          disabled={removeMutation.isPending}
                          onClick={() => confirm(`Remove "${s.title}"? This can't be undone.`) && removeMutation.mutate(s._id)}
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

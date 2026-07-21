import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Ban, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import { initialsFromName } from "@/lib/utils";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", { search, page }],
    queryFn: () => adminApi.users({ search: search || undefined, page, limit: 20 }),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => adminApi.toggleBan(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <DashboardLayout role="super_admin" title="Manage Users" subtitle="View, search and moderate all MahaHub users.">
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by name or email..."
          className="pl-9"
        />
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-[10px]">{initialsFromName(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    {u.isBanned ? (
                      <Badge variant="danger">Banned</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.role !== "super_admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={u.isBanned ? "" : "text-danger hover:bg-danger/10"}
                        onClick={() => banMutation.mutate(u.id)}
                        disabled={banMutation.isPending}
                      >
                        {u.isBanned ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Unban
                          </>
                        ) : (
                          <>
                            <Ban className="h-3.5 w-3.5" /> Ban
                          </>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

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

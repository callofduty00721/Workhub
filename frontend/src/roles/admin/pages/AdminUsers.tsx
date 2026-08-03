import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Search, Ban, ShieldCheck, Trash2, Loader2, RotateCcw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { adminApi, type AdminUserStatus } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import { initialsFromName } from "@/lib/utils";
import type { User } from "@/types";

const STATUS_FILTERS: { value: AdminUserStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
  { value: "banned", label: "Banned" },
];

function statusBadge(u: User) {
  if (u.isBanned) return <Badge variant="danger">Banned</Badge>;
  if (u.isDeactivated) return <Badge variant="warning">Deactivated</Badge>;
  return <Badge variant="success">Active</Badge>;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminUserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", { search, status, page }],
    queryFn: () => adminApi.users({ search: search || undefined, status: status === "all" ? undefined : status, page, limit: 20 }),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => adminApi.toggleBan(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.reactivateUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleting(null);
      setConfirmed(false);
    },
  });

  return (
    <DashboardLayout role="super_admin" title="Manage Users" subtitle="View, search and moderate all MahaHub users.">
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
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
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v as AdminUserStatus | "all");
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
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
                    <Badge variant="outline">{u.role ? ROLE_LABELS[u.role] : "No role yet"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">{statusBadge(u)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {u.role !== "super_admin" && (
                        <>
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
                          {u.isDeactivated && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reactivateMutation.mutate(u.id)}
                              disabled={reactivateMutation.isPending}
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-danger hover:bg-danger/10"
                            onClick={() => {
                              setDeleting(u);
                              setConfirmed(false);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </>
                      )}
                    </div>
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

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              This is a full hard delete, not a deactivation. It removes their account and every job, project,
              gig, application, payment, withdrawal, review, message, and startup they're attached to. This
              cannot be undone and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>I understand this permanently deletes their payments, reviews, and messages, and cannot be reversed.</span>
          </label>
          {deleteMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(deleteMutation.error) ? deleteMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            variant="destructive"
            className="w-full"
            disabled={!confirmed || deleteMutation.isPending}
            onClick={() => deleting && deleteMutation.mutate(deleting.id)}
          >
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Yes, permanently delete everything
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

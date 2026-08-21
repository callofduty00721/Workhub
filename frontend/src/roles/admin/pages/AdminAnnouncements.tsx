import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Megaphone, Send, Loader2, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/types";

// Same exclusion the backend applies to the "all users" recipient set —
// shown here too so the target dropdown doesn't offer something that would
// silently be excluded anyway.
const TARGET_ROLES = (Object.keys(ROLE_LABELS) as UserRole[]).filter((r) => r !== "super_admin" && r !== "staff");

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState<string>("all");
  const [confirming, setConfirming] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "announcements", page],
    queryFn: () => adminApi.announcements({ page, limit: 20 }),
  });

  const sendMutation = useMutation({
    mutationFn: () => adminApi.sendAnnouncement({ title, message, targetRole: targetRole === "all" ? undefined : targetRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      setTitle("");
      setMessage("");
      setTargetRole("all");
      setConfirming(false);
    },
  });

  const isValid = title.trim().length > 0 && message.trim().length > 0;

  return (
    <DashboardLayout
      role="super_admin"
      title="Announcements"
      subtitle="Send an in-app notification to every user, or to everyone holding a specific role."
    >
      <Card className="max-w-xl p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">New Announcement</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Delivered as an in-app notification + real-time push to anyone currently online. Not emailed, regardless of a recipient's email
          preferences — this is for in-app reach only.
        </p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance tonight" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-message">Message</Label>
            <Textarea
              id="ann-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want to tell them?"
              className="min-h-[100px]"
              maxLength={5000}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Send to</Label>
            <Select value={targetRole} onValueChange={setTargetRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {TARGET_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]} only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="gradient" className="mt-5 w-full" disabled={!isValid} onClick={() => setConfirming(true)}>
          <Send className="h-4 w-4" /> Send Announcement
        </Button>

        {sendMutation.isSuccess && !sendMutation.isPending && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Sent to {sendMutation.data.recipientCount} user
            {sendMutation.data.recipientCount === 1 ? "" : "s"}.
          </p>
        )}
        {sendMutation.isError && (
          <p className="mt-2 text-xs text-danger">
            {isAxiosError(sendMutation.error) ? sendMutation.error.response?.data?.message : "Something went wrong."}
          </p>
        )}
      </Card>

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-foreground">Send History</h3>
        <Card className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data?.data.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No announcements sent yet.</p>
          ) : (
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Message</th>
                  <th className="px-5 py-3 font-medium">Target</th>
                  <th className="px-5 py-3 font-medium">Recipients</th>
                  <th className="px-5 py-3 font-medium">Sent By</th>
                  <th className="px-5 py-3 font-medium text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((a) => (
                  <tr key={a._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{a.title}</p>
                      <p className="max-w-sm truncate text-xs text-muted-foreground">{a.message}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline">{a.targetRole ? ROLE_LABELS[a.targetRole as UserRole] ?? a.targetRole : "All users"}</Badge>
                    </td>
                    <td className="px-5 py-3">{a.recipientCount}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.sentBy?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</td>
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
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send this announcement?</DialogTitle>
            <DialogDescription>
              This goes out immediately to {targetRole === "all" ? "every user on GrowHive" : `everyone with the "${ROLE_LABELS[targetRole as UserRole]}" role`}
              . There's no way to unsend it once it's delivered.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-muted-foreground">{message}</p>
          </div>
          <Button variant="gradient" className="w-full" disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
            {sendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Yes, send it
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

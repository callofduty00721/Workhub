import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, type AdminRoleVerificationRequest } from "@/api/admin";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/types";

export default function AdminRoleVerifications() {
  const queryClient = useQueryClient();
  const [resolving, setResolving] = useState<{ request: AdminRoleVerificationRequest; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin", "role-verification-requests"],
    queryFn: adminApi.roleVerificationRequests,
  });

  const resolveMutation = useMutation({
    mutationFn: () => adminApi.reviewRoleVerification(resolving!.request._id, resolving!.action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "role-verification-requests"] });
      setResolving(null);
      setNote("");
    },
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Role Verification Requests"
      subtitle="Review employer, founder, and investor documents before their high-risk actions unlock."
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !requests?.length ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm font-medium">No pending role verification requests</p>
          <p className="text-sm text-muted-foreground">Submissions from employers, founders, and investors will show up here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium">{req.name}</p>
                    <Badge variant="outline">{ROLE_LABELS[req.role as UserRole] ?? req.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{req.email}</p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(req.verificationSubmittedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-success hover:bg-success/10"
                    onClick={() => setResolving({ request: req, action: "approve" })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => setResolving({ request: req, action: "reject" })}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {req.verificationDocuments.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-primary hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> {doc.name}
                  </a>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!resolving} onOpenChange={(open) => !open && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resolving?.action === "approve" ? "Approve this verification?" : "Reject this verification?"}</DialogTitle>
            <DialogDescription>
              {resolving?.action === "approve"
                ? `${resolving.request.name} will be able to use high-risk actions for the ${ROLE_LABELS[resolving.request.role as UserRole] ?? resolving.request.role} role.`
                : "The user will be notified and can resubmit with clearer documents."}
            </DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (shown to the user)..." className="min-h-[100px]" />
          {resolveMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              {isAxiosError(resolveMutation.error) ? resolveMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            className="mt-2 w-full"
            variant={resolving?.action === "approve" ? "gradient" : "destructive"}
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate()}
          >
            {resolveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm {resolving?.action === "approve" ? "Approval" : "Rejection"}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, FileText, Loader2, ScanFace, Home, Landmark, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminApi, type AdminProfileVerificationRequest, type ProfileVerificationType } from "@/api/admin";
import { initialsFromName } from "@/lib/utils";

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const TYPES: { value: ProfileVerificationType; label: string; icon: typeof ScanFace; submittedAtField: keyof AdminProfileVerificationRequest }[] = [
  { value: "face", label: "Face Verification", icon: ScanFace, submittedAtField: "faceVerificationSubmittedAt" },
  { value: "address", label: "Address Verification", icon: Home, submittedAtField: "addressVerificationSubmittedAt" },
  { value: "bank", label: "Bank Verification", icon: Landmark, submittedAtField: "bankVerificationSubmittedAt" },
];

function VerificationList({ type }: { type: ProfileVerificationType }) {
  const queryClient = useQueryClient();
  const [resolving, setResolving] = useState<{ request: AdminProfileVerificationRequest; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profile-verification-requests", type, page],
    queryFn: () => adminApi.profileVerificationRequests(type, { page, limit: 20 }),
  });
  const requests = data?.data;

  const resolveMutation = useMutation({
    mutationFn: () => adminApi.reviewProfileVerification(type, resolving!.request._id, resolving!.action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profile-verification-requests", type] });
      setResolving(null);
      setNote("");
    },
  });

  const submittedAtField = TYPES.find((t) => t.value === type)!.submittedAtField;

  const historyMutation = useMutation({
    mutationFn: ({ userId, name }: { userId: string; name: string }) => adminApi.downloadVerificationHistory(userId, name),
  });

  return (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !requests?.length ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm font-medium">No pending requests</p>
          <p className="text-sm text-muted-foreground">Submissions will show up here.</p>
        </Card>
      ) : (
        <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-3">
          {requests.map((req) => (
            <motion.div key={req._id} variants={cardVariants}>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={req.avatar} alt={req.name} />
                    <AvatarFallback>{initialsFromName(req.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{req.name}</p>
                    <p className="text-xs text-muted-foreground">{req.email}</p>
                    {req[submittedAtField] && (
                      <p className="text-xs text-muted-foreground">Submitted {new Date(req[submittedAtField] as string).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyMutation.isPending && historyMutation.variables?.userId === req._id}
                    onClick={() => historyMutation.mutate({ userId: req._id, name: req.name })}
                  >
                    {historyMutation.isPending && historyMutation.variables?.userId === req._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    History
                  </Button>
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
                {type === "face" && req.faceVerificationSelfie && (
                  <a href={req.faceVerificationSelfie} target="_blank" rel="noreferrer">
                    <img src={req.faceVerificationSelfie} alt="Selfie" className="h-24 w-24 rounded-lg border border-border object-cover" />
                  </a>
                )}
                {type === "address" &&
                  req.addressVerificationDocuments?.map((doc, i) => (
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
                {type === "bank" &&
                  req.bankVerificationDocuments?.map((doc, i) => (
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
            </motion.div>
          ))}
        </motion.div>
      )}

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

      <Dialog open={!!resolving} onOpenChange={(open) => !open && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resolving?.action === "approve" ? "Approve this verification?" : "Reject this verification?"}</DialogTitle>
            <DialogDescription>
              {resolving?.action === "approve"
                ? `${resolving.request.name} will be marked as verified.`
                : "The user will be notified and can resubmit."}
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
    </>
  );
}

export default function AdminProfileVerifications() {
  return (
    <DashboardLayout
      role="super_admin"
      title="Profile Verification Requests"
      subtitle="Review face, address, and bank verification submissions."
    >
      <Tabs defaultValue="face">
        <TabsList>
          {TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <t.icon className="mr-1.5 h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TYPES.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <VerificationList type={t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
}

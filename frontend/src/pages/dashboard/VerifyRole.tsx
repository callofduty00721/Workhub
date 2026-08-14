import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ShieldCheck, ShieldAlert, Clock, FileText, X, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/shared/FileUpload";
import { rolesApi } from "@/api/roles";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, VERIFICATION_REQUIRED_ROLES } from "@/lib/roles";

const ACTION_HINT: Record<string, string> = {
  employer: "Lets you post paid jobs.",
  founder: "Lets you post paid jobs and pitch your startup to investors.",
  investor: "Lets you contact startups and mark them as interesting.",
};

export default function VerifyRole() {
  const { user, refreshUser } = useAuth();
  const [documents, setDocuments] = useState<{ url: string; name: string }[]>([]);

  const mutation = useMutation({
    mutationFn: () => rolesApi.requestVerification(documents),
    onSuccess: () => {
      refreshUser();
      setDocuments([]);
    },
  });

  if (!user) return null;

  const verifiableRole = user.role && VERIFICATION_REQUIRED_ROLES.includes(user.role) ? user.role : "founder";
  const sidebarRole = verifiableRole as DashboardRole;
  const status = user.verificationStatus ?? "unverified";

  return (
    <DashboardLayout role={sidebarRole} title="Account Verification" subtitle="Verify your account to unlock high-risk actions on GrowHive.">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Verification for: {ROLE_LABELS[verifiableRole]}</h3>
              {ACTION_HINT[verifiableRole] && <p className="text-xs text-muted-foreground">{ACTION_HINT[verifiableRole]}</p>}
            </div>
            {status === "verified" && (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {status === "pending" && (
              <span className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                <Clock className="h-3.5 w-3.5" /> Under Review
              </span>
            )}
            {(status === "unverified" || !status) && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" /> Not Verified
              </span>
            )}
            {status === "rejected" && (
              <span className="flex items-center gap-1 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
                <ShieldAlert className="h-3.5 w-3.5" /> Rejected
              </span>
            )}
          </div>

          {status === "rejected" && user.verificationNote && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">Reason: {user.verificationNote}</p>
          )}

          {status === "verified" ? (
            <p className="text-sm text-muted-foreground">Your account is verified — high-risk actions for this role are unlocked.</p>
          ) : status === "pending" ? (
            <p className="text-sm text-muted-foreground">Your documents are being reviewed by our team. This usually takes 1-2 business days.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Upload a government-issued ID and, if applicable, a business registration document (image or PDF).
              </p>
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                    <button type="button" onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5 text-danger" />
                    </button>
                  </div>
                ))}
                <FileUpload
                  folder="document"
                  accept="image/png,image/jpeg,application/pdf"
                  label="Upload a document"
                  onUploaded={(url, fileName) => setDocuments((prev) => [...prev, { url, name: fileName }])}
                />
              </div>
              {mutation.isError && (
                <p className="text-xs text-danger">
                  {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}
                </p>
              )}
              <Button variant="gradient" size="sm" disabled={documents.length === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit for Verification
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

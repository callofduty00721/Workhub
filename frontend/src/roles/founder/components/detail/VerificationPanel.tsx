import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ShieldCheck, Clock, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { startupApi } from "@/api/startups";
import { FileUpload } from "@/components/shared/FileUpload";
import { cn } from "@/lib/utils";
import type { VerificationRequest, VerificationRequestType } from "@/types";

export function VerificationPanel({
  startupId,
  founderVerified,
  isVerified,
  verificationRequests,
}: {
  startupId: string;
  founderVerified: boolean;
  isVerified: boolean;
  verificationRequests: VerificationRequest[];
}) {
  const queryClient = useQueryClient();
  const [openType, setOpenType] = useState<VerificationRequestType | null>(null);
  const [pendingDocs, setPendingDocs] = useState<{ name: string; url: string }[]>([]);
  const [note, setNote] = useState("");

  const submitMutation = useMutation({
    mutationFn: (type: VerificationRequestType) =>
      startupApi.submitVerificationRequest(startupId, { type, documents: pendingDocs, note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId] });
      setOpenType(null);
      setPendingDocs([]);
      setNote("");
    },
  });

  const latestRequest = (type: VerificationRequestType) =>
    [...verificationRequests]
      .filter((r) => r.type === type)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  const renderSection = (type: VerificationRequestType, label: string, verified: boolean) => {
    const request = latestRequest(type);

    return (
      <div className="flex-1 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn("h-4.5 w-4.5", verified ? "text-success" : "text-muted-foreground/70")} />
          <p className="text-[13px] font-bold text-foreground">{label}</p>
        </div>

        {verified ? (
          <p className="mt-2 text-[11.5px] font-medium text-success">Verified by GrowHive.</p>
        ) : request?.status === "pending" ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground/70">
            <Clock className="h-3.5 w-3.5" /> Submitted {new Date(request.submittedAt).toLocaleDateString()} — awaiting review.
          </p>
        ) : openType === type ? (
          <div className="mt-3 space-y-2.5">
            <FileUpload
              folder="document"
              label="Upload ID proof / registration document"
              onUploaded={(url, name) => setPendingDocs((prev) => [...prev, { name, url }])}
            />
            {pendingDocs.length > 0 && (
              <div className="space-y-1">
                {pendingDocs.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-muted px-2.5 py-1.5 text-[11.5px]">
                    <span className="truncate">{d.name}</span>
                    <button onClick={() => setPendingDocs((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5 text-muted-foreground/70" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the reviewer" className="text-[12px]" />
            <div className="flex gap-2">
              <button
                onClick={() => submitMutation.mutate(type)}
                disabled={pendingDocs.length === 0 || submitMutation.isPending}
                className="rounded-lg bg-primary px-3 py-1.5 text-[11.5px] font-bold text-primary-foreground disabled:opacity-50"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
              </button>
              <button
                onClick={() => {
                  setOpenType(null);
                  setPendingDocs([]);
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-[11.5px] font-bold text-foreground"
              >
                Cancel
              </button>
            </div>
            {submitMutation.isError && (
              <p className="text-[11px] text-danger">
                {isAxiosError(submitMutation.error) ? submitMutation.error.response?.data?.message || "Submission failed." : "Submission failed."}
              </p>
            )}
          </div>
        ) : (
          <>
            {request?.status === "rejected" && (
              <p className="mt-2 text-[11.5px] text-danger">
                Rejected{request.reviewNote ? `: ${request.reviewNote}` : "."} You can submit a new request.
              </p>
            )}
            <button
              onClick={() => setOpenType(type)}
              className="mt-2 rounded-lg border border-border px-3 py-1.5 text-[11.5px] font-bold text-foreground hover:bg-muted"
            >
              Request {label}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-5">
      <p className="mb-1 text-[14px] font-bold text-foreground">Verification</p>
      <p className="mb-3 text-[11.5px] text-muted-foreground">
        Submit ID proof or a business registration document — GrowHive's team reviews it manually before granting a verified badge.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {renderSection("founder", "Founder Verification", founderVerified)}
        {renderSection("business", "Business Verification", isVerified)}
      </div>
    </div>
  );
}

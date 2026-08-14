import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Truck, CheckCircle2, RotateCcw, Clock, Loader2, Link as LinkIcon, Plus, X, CalendarClock, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { paymentApi } from "@/api/payments";
import { uploadApi } from "@/api/uploads";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Payment } from "@/types";

const STORAGE_QUOTA_BYTES = 500 * 1024 * 1024; // mirrors backend's USER_STORAGE_QUOTA_BYTES

function formatMB(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

const STATUS_META: Record<string, { label: string; variant: "outline" | "warning" | "success" | "danger" }> = {
  in_progress: { label: "In Progress", variant: "warning" },
  delivered: { label: "Delivered — Awaiting Review", variant: "outline" },
  revision_requested: { label: "Revision Requested", variant: "danger" },
  completed: { label: "Completed", variant: "success" },
};

function daysLeft(deadline?: string) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function OrderStatusPanel({ payment, viewerRole, invalidateKey }: { payment: Payment; viewerRole: "client" | "freelancer"; invalidateKey: unknown[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [deliverLinks, setDeliverLinks] = useState<{ url: string; name: string }[]>([{ url: "", name: "" }]);
  const [deliverNote, setDeliverNote] = useState("");
  const [uploadingRow, setUploadingRow] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRow = useRef<number | null>(null);

  const storageUsed = user?.storageUsedBytes ?? 0;
  const storageFull = storageUsed >= STORAGE_QUOTA_BYTES;

  const handleFileSelected = async (file: File | undefined) => {
    const row = uploadTargetRow.current;
    if (!file || row === null) return;
    setUploadError(null);
    setUploadingRow(row);
    try {
      const result = await uploadApi.upload(file, "deliverable");
      setDeliverLinks((prev) => prev.map((l, idx) => (idx === row ? { url: result.url, name: result.name } : l)));
    } catch (err) {
      setUploadError(isAxiosError(err) ? err.response?.data?.message || "Upload failed" : "Upload failed");
    } finally {
      setUploadingRow(null);
    }
  };
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [proposedDeadline, setProposedDeadline] = useState("");
  const [extensionReason, setExtensionReason] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: invalidateKey });

  const deliverMutation = useMutation({
    mutationFn: () =>
      paymentApi.deliverWork(payment._id, { deliverables: deliverLinks.filter((d) => d.url.trim()), note: deliverNote }),
    onSuccess: () => {
      invalidate();
      setDeliverOpen(false);
      setDeliverLinks([{ url: "", name: "" }]);
      setDeliverNote("");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => paymentApi.acceptDelivery(payment._id),
    onSuccess: invalidate,
  });

  const revisionMutation = useMutation({
    mutationFn: () => paymentApi.requestRevision(payment._id, revisionReason),
    onSuccess: () => {
      invalidate();
      setRevisionOpen(false);
      setRevisionReason("");
    },
  });

  const extensionMutation = useMutation({
    mutationFn: () => paymentApi.requestExtension(payment._id, { proposedDeadline, reason: extensionReason }),
    onSuccess: () => {
      invalidate();
      setExtensionOpen(false);
      setProposedDeadline("");
      setExtensionReason("");
    },
  });

  const respondExtensionMutation = useMutation({
    mutationFn: (action: "approve" | "reject") => paymentApi.respondExtension(payment._id, action),
    onSuccess: invalidate,
  });

  if (!payment.orderStatus || payment.orderStatus === "not_applicable" || payment.status !== "paid") return null;

  const meta = STATUS_META[payment.orderStatus];
  const remaining = daysLeft(payment.deadline);
  const isRevisionExhausted = payment.revisionsAllowed !== -1 && (payment.revisionsUsed ?? 0) >= (payment.revisionsAllowed ?? 1);
  const pendingExtension = payment.extensionRequest?.status === "pending" ? payment.extensionRequest : null;
  const canRespondToExtension = !!pendingExtension && pendingExtension.requestedBy !== user?.id;

  return (
    <div className="mt-3 space-y-2.5 rounded-lg border border-border bg-muted/30 p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={meta.variant} className="flex items-center gap-1">
          {payment.orderStatus === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {meta.label}
        </Badge>
        {payment.deadline && payment.orderStatus !== "completed" && (
          <span className={`flex items-center gap-1 ${remaining !== null && remaining < 0 ? "text-danger" : "text-muted-foreground"}`}>
            <CalendarClock className="h-3 w-3" />
            {remaining === null
              ? ""
              : remaining < 0
                ? `Overdue by ${Math.abs(remaining)}d`
                : remaining === 0
                  ? "Due today"
                  : `${remaining}d left`}{" "}
            (deadline {new Date(payment.deadline).toLocaleDateString()})
          </span>
        )}
        {typeof payment.revisionsAllowed === "number" && (
          <span className="text-muted-foreground">
            {payment.revisionsAllowed === -1 ? `${payment.revisionsUsed ?? 0} revisions used (Unlimited)` : `${payment.revisionsUsed ?? 0}/${payment.revisionsAllowed} revisions used`}
          </span>
        )}
      </div>

      {pendingExtension && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5">
          <p className="font-medium">
            Extension requested: {new Date(pendingExtension.proposedDeadline).toLocaleDateString()}
            {pendingExtension.reason && <span className="font-normal text-muted-foreground"> — {pendingExtension.reason}</span>}
          </p>
          {canRespondToExtension && (
            <div className="mt-1.5 flex gap-2">
              <Button size="sm" variant="gradient" disabled={respondExtensionMutation.isPending} onClick={() => respondExtensionMutation.mutate("approve")}>
                Approve
              </Button>
              <Button size="sm" variant="outline" disabled={respondExtensionMutation.isPending} onClick={() => respondExtensionMutation.mutate("reject")}>
                Reject
              </Button>
            </div>
          )}
        </div>
      )}

      {payment.deliverables && payment.deliverables.length > 0 && (
        <div className="rounded-md border border-border bg-background p-2.5">
          <p className="mb-1 font-medium">Delivered files</p>
          {payment.deliveryNote && <p className="mb-1.5 text-muted-foreground">{payment.deliveryNote}</p>}
          <div className="space-y-1">
            {payment.deliverables.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <LinkIcon className="h-3 w-3" /> {d.name || d.url}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {viewerRole === "freelancer" && ["in_progress", "revision_requested"].includes(payment.orderStatus) && (
          <Button size="sm" variant="gradient" onClick={() => setDeliverOpen(true)}>
            <Truck className="h-3.5 w-3.5" /> Deliver Work
          </Button>
        )}
        {viewerRole === "client" && payment.orderStatus === "delivered" && (
          <>
            <Button size="sm" variant="gradient" disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate()}>
              {acceptMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Accept Delivery
            </Button>
            <Button size="sm" variant="outline" disabled={isRevisionExhausted} onClick={() => setRevisionOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5" /> Request Revision
            </Button>
          </>
        )}
        {!pendingExtension && ["in_progress", "revision_requested"].includes(payment.orderStatus) && (
          <Button size="sm" variant="outline" onClick={() => setExtensionOpen(true)}>
            <CalendarClock className="h-3.5 w-3.5" /> Request Extension
          </Button>
        )}
      </div>

      <Dialog open={deliverOpen} onOpenChange={setDeliverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deliver Work</DialogTitle>
            <DialogDescription>Upload the final files directly, or paste links (Drive, GitHub, etc.), and add a note for the client.</DialogDescription>
          </DialogHeader>

          <p className={cn("text-[11px]", storageFull ? "text-danger" : "text-muted-foreground")}>
            Storage used: {formatMB(storageUsed)} / {formatMB(STORAGE_QUOTA_BYTES)}
            {storageFull && " — delete old files to upload or share more."}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="space-y-2">
            {deliverLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="File name (optional)"
                  value={link.name}
                  onChange={(e) => setDeliverLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, name: e.target.value } : l)))}
                  className="w-2/5"
                />
                <Input
                  placeholder="https://... or upload a file"
                  value={link.url}
                  onChange={(e) => setDeliverLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={storageFull || uploadingRow === i}
                  title={storageFull ? "Storage full" : "Upload a file"}
                  onClick={() => {
                    uploadTargetRow.current = i;
                    fileInputRef.current?.click();
                  }}
                >
                  {uploadingRow === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                </Button>
                {deliverLinks.length > 1 && (
                  <button type="button" onClick={() => setDeliverLinks((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X className="h-4 w-4 text-danger" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDeliverLinks((prev) => [...prev, { url: "", name: "" }])}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add another link
            </button>
          </div>
          <div className="space-y-1.5">
            <Label>Note to client</Label>
            <Textarea value={deliverNote} onChange={(e) => setDeliverNote(e.target.value)} className="min-h-[80px]" />
          </div>
          {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
          {deliverMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(deliverMutation.error) ? deliverMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            variant="gradient"
            disabled={!deliverLinks.some((l) => l.url.trim()) || deliverMutation.isPending}
            onClick={() => deliverMutation.mutate()}
          >
            {deliverMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Delivery
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Revision</DialogTitle>
            <DialogDescription>Tell the freelancer what needs to change.</DialogDescription>
          </DialogHeader>
          <Textarea value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} placeholder="What needs fixing?" className="min-h-[100px]" />
          {revisionMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(revisionMutation.error) ? revisionMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button variant="gradient" disabled={!revisionReason.trim() || revisionMutation.isPending} onClick={() => revisionMutation.mutate()}>
            {revisionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Revision Request
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={extensionOpen} onOpenChange={setExtensionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Deadline Extension</DialogTitle>
            <DialogDescription>The other party will need to approve this new deadline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>New deadline</Label>
            <Input type="date" value={proposedDeadline} onChange={(e) => setProposedDeadline(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Textarea value={extensionReason} onChange={(e) => setExtensionReason(e.target.value)} className="min-h-[70px]" />
          </div>
          {extensionMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(extensionMutation.error) ? extensionMutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button variant="gradient" disabled={!proposedDeadline || extensionMutation.isPending} onClick={() => extensionMutation.mutate()}>
            {extensionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { projectApi } from "@/api/projects";

// A lighter-weight version of ProjectDetails' full proposal form — lets a
// freelancer bid straight from a project card without leaving the browse
// grid, for the common case where they already know their rate and don't
// need to read the full brief first.
export function BidModal({
  projectId,
  projectTitle,
  open,
  onOpenChange,
  onSuccess,
}: {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [proposedRate, setProposedRate] = useState<number | "">("");
  const [deliveryDays, setDeliveryDays] = useState<number | "">("");
  const [coverLetter, setCoverLetter] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      projectApi.apply(projectId, {
        proposedRate: Number(proposedRate),
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
        coverLetter: coverLetter.trim(),
      }),
    onSuccess: () => {
      onOpenChange(false);
      setProposedRate("");
      setDeliveryDays("");
      setCoverLetter("");
      onSuccess?.();
    },
  });

  const canSubmit = Number(proposedRate) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Send a Proposal</DialogTitle>
          <DialogDescription className="line-clamp-1">For "{projectTitle}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bidRate">Your Bid (₹)</Label>
              <Input
                id="bidRate"
                type="number"
                min={1}
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 15000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bidDeliveryDays">Delivery (days)</Label>
              <Input
                id="bidDeliveryDays"
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 7"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bidCoverLetter">Cover Letter (optional)</Label>
            <Textarea
              id="bidCoverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Briefly explain why you're a good fit..."
              className="min-h-[90px]"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(mutation.error) ? mutation.error.response?.data?.message || "Failed to send proposal" : "Something went wrong"}
            </p>
          )}

          <Button variant="gradient" className="w-full" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Proposal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

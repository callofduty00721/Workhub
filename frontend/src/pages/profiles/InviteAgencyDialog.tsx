import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { agencyClientApi } from "@/api/agencyClients";

// A brand delegating its campaign work to an agency — creates an
// AgencyClient row (see agencyClient.controller.js's inviteAgency), pending
// until the agency accepts. Only once accepted can the agency post
// Campaigns with `onBehalfOf` set to this brand.
export function InviteAgencyDialog({
  agencyId,
  agencyName,
  open,
  onOpenChange,
}: {
  agencyId: string;
  agencyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () => agencyClientApi.invite(agencyId, budget ? Number(budget) : undefined, message.trim() || undefined),
    onSuccess: () => {
      setBudget("");
      setMessage("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite {agencyName} to Manage Your Campaigns</DialogTitle>
          <DialogDescription>
            They'll get a notification and can accept or decline. Once accepted, they can post campaigns on your behalf.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Budget (optional)</Label>
            <Input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 1000000" />
          </div>
          <div className="space-y-1.5">
            <Label>Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What are you looking to run..."
              className="min-h-[80px]"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}

          <div className="flex justify-end">
            <Button variant="gradient" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Invite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

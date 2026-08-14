import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { campaignApi } from "@/api/campaigns";

// The brand-initiated counterpart to an influencer applying — picks one of
// the poster's own open campaigns and creates an Application with
// origin:"invited" (see campaign.controller.js's inviteToCampaign), so it
// flows through the exact same edit/withdraw/hire/pay pipeline as a normal
// application from there on.
export function InviteToCampaignDialog({
  influencerId,
  influencerName,
  open,
  onOpenChange,
}: {
  influencerId: string;
  influencerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [campaignId, setCampaignId] = useState("");
  const [message, setMessage] = useState("");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", "mine"],
    queryFn: campaignApi.mine,
    enabled: open,
  });
  const openCampaigns = (campaigns ?? []).filter((c) => c.status === "open");

  const mutation = useMutation({
    mutationFn: () => campaignApi.invite(campaignId, { influencerId, message: message.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "applications"] });
      setCampaignId("");
      setMessage("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite {influencerName} to a Campaign</DialogTitle>
          <DialogDescription>They'll get a notification and can respond with their rate — you decide whether to hire from there.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Campaign</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading your campaigns...</p>
            ) : openCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">You don't have any open campaigns to invite them to.</p>
            ) : (
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {openCampaigns.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Message (optional)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell them why you'd like to work together..." className="min-h-[80px]" />
          </div>

          {mutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}

          <div className="flex justify-end">
            <Button variant="gradient" disabled={!campaignId || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Invite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

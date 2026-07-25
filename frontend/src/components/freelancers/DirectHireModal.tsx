import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { projectApi } from "@/api/projects";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";

export function DirectHireModal({
  freelancerId,
  freelancerName,
  open,
  onOpenChange,
}: {
  freelancerId: string;
  freelancerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scopeTitle, setScopeTitle] = useState("");
  const [scopeDescription, setScopeDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [deliveryDays, setDeliveryDays] = useState<number | "">("");

  const mutation = useMutation({
    mutationFn: () =>
      projectApi.directHire(freelancerId, {
        scopeTitle: scopeTitle.trim(),
        scopeDescription: scopeDescription.trim(),
        amount: Number(amount),
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
      }),
    onSuccess: (application) => {
      onOpenChange(false);
      const projectId = typeof application.job === "object" ? application.job._id : application.job;
      const base = user?.role === "client" ? dashboardPathForRole(user.role) : "/dashboard/client";
      navigate(`${base}/projects/${projectId}/applicants`);
    },
  });

  const canSubmit = scopeTitle.trim() && scopeDescription.trim() && Number(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hire {freelancerName}</DialogTitle>
          <DialogDescription>
            Skip posting a job — describe the work and agree on a price. You'll both sign a contract before payment starts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="scopeTitle">What's the work?</Label>
            <Input id="scopeTitle" value={scopeTitle} onChange={(e) => setScopeTitle(e.target.value)} placeholder="e.g. Landing page redesign" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scopeDescription">Scope</Label>
            <Textarea
              id="scopeDescription"
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
              placeholder="Describe what you need done..."
              className="min-h-[90px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Agreed Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                placeholder="15000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryDays">Delivery (days)</Label>
              <Input
                id="deliveryDays"
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value ? Number(e.target.value) : "")}
                placeholder="7"
              />
            </div>
          </div>
        </div>

        {mutation.isError && (
          <p className="mt-3 text-xs text-danger">
            {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong. Please try again."}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gradient" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Send Hire Offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

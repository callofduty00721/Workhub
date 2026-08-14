import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { FileSignature, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobApi } from "@/api/jobs";
import { useAuth } from "@/context/AuthContext";
import type { Application } from "@/types";

export function ContractPanel({ application, viewerRole }: { application: Application; viewerRole: "freelancer" | "employer" }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Pre-filled from the signer's own profile name — signing is still an
  // explicit click, but nobody has to type their name out to do it.
  const [signatureName, setSignatureName] = useState(user?.name ?? "");
  const contract = application.contract;

  const mutation = useMutation({
    mutationFn: () => jobApi.signContract(application._id, signatureName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setSignatureName("");
    },
  });

  if (!contract?.text) return null;

  const mySigned = viewerRole === "employer" ? !!contract.employerSignedAt : !!contract.freelancerSignedAt;
  const otherSigned = viewerRole === "employer" ? !!contract.freelancerSignedAt : !!contract.employerSignedAt;
  const bothSigned = !!contract.employerSignedAt && !!contract.freelancerSignedAt;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <FileSignature className="h-4 w-4" /> Contract
        </h4>
        <Badge variant={bothSigned ? "success" : "warning"}>{bothSigned ? "Fully Signed" : "Awaiting Signatures"}</Badge>
      </div>

      <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">{contract.text}</p>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-1.5">
          {contract.employerSignedAt ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <span className="h-3.5 w-3.5 rounded-full border border-border" />}
          <span>Client: {contract.employerSignedAt ? `Signed by ${contract.employerSignatureName}` : "Not signed yet"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {contract.freelancerSignedAt ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <span className="h-3.5 w-3.5 rounded-full border border-border" />}
          <span>Freelancer: {contract.freelancerSignedAt ? `Signed by ${contract.freelancerSignatureName}` : "Not signed yet"}</span>
        </div>
      </div>

      {!mySigned && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Type your full name to sign"
            className="max-w-xs"
          />
          <Button size="sm" variant="gradient" disabled={!signatureName.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Sign Contract
          </Button>
        </div>
      )}
      {mutation.isError && (
        <p className="text-xs text-danger">{isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}</p>
      )}
      {mySigned && !otherSigned && <p className="text-xs text-muted-foreground">You've signed — waiting for the other party.</p>}
      {!bothSigned && <p className="text-xs text-warning">Payment can't be made until both parties sign.</p>}
    </div>
  );
}

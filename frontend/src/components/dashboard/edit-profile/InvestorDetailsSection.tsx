import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { StartupStage } from "@/types";
import { STAGE_OPTIONS } from "./shared";

export function InvestorDetailsSection({
  focusInput,
  setFocusInput,
  fundName,
  setFundName,
  fundSize,
  setFundSize,
  ticketSizeMin,
  setTicketSizeMin,
  ticketSizeMax,
  setTicketSizeMax,
  portfolioCompanyCount,
  setPortfolioCompanyCount,
  preferredStages,
  setPreferredStages,
  linkedIn,
  setLinkedIn,
  website,
  setWebsite,
}: {
  focusInput: string;
  setFocusInput: (v: string) => void;
  fundName: string;
  setFundName: (v: string) => void;
  fundSize: number;
  setFundSize: (v: number) => void;
  ticketSizeMin: number;
  setTicketSizeMin: (v: number) => void;
  ticketSizeMax: number;
  setTicketSizeMax: (v: number) => void;
  portfolioCompanyCount: number;
  setPortfolioCompanyCount: (v: number) => void;
  preferredStages: StartupStage[];
  setPreferredStages: (updater: (prev: StartupStage[]) => StartupStage[]) => void;
  linkedIn: string;
  setLinkedIn: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Investor Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Fund Name (optional)</Label>
            <Input value={fundName} onChange={(e) => setFundName(e.target.value)} placeholder="e.g. Acme Ventures" />
          </div>
          <div className="space-y-2">
            <Label>Fund Size (₹, optional)</Label>
            <Input type="number" min={0} value={fundSize} onChange={(e) => setFundSize(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Investment Focus (comma separated)</Label>
          <Input value={focusInput} onChange={(e) => setFocusInput(e.target.value)} placeholder="SaaS, FinTech, AI" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Min Ticket Size (₹)</Label>
            <Input type="number" min={0} value={ticketSizeMin} onChange={(e) => setTicketSizeMin(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Max Ticket Size (₹)</Label>
            <Input type="number" min={0} value={ticketSizeMax} onChange={(e) => setTicketSizeMax(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Portfolio Companies</Label>
            <Input type="number" min={0} value={portfolioCompanyCount} onChange={(e) => setPortfolioCompanyCount(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Preferred Stages</Label>
          <div className="flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((stage) => (
              <button
                key={stage.value}
                type="button"
                onClick={() =>
                  setPreferredStages((prev) =>
                    prev.includes(stage.value) ? prev.filter((s) => s !== stage.value) : [...prev, stage.value]
                  )
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  preferredStages.includes(stage.value) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourfund.com" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

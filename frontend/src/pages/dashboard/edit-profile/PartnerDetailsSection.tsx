import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabel } from "@/components/shared/FieldInfo";
import type { PartnerType } from "@/types";
import { PARTNER_TYPES } from "./shared";

export function PartnerDetailsSection({
  organizationName,
  setOrganizationName,
  partnerType,
  setPartnerType,
  programDetails,
  setProgramDetails,
  startupsSupportedCount,
  setStartupsSupportedCount,
  website,
  setWebsite,
  applicationLink,
  setApplicationLink,
}: {
  organizationName: string;
  setOrganizationName: (v: string) => void;
  partnerType: PartnerType;
  setPartnerType: (v: PartnerType) => void;
  programDetails: string;
  setProgramDetails: (v: string) => void;
  startupsSupportedCount: number;
  setStartupsSupportedCount: (v: number) => void;
  website: string;
  setWebsite: (v: string) => void;
  applicationLink: string;
  setApplicationLink: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Partner Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your organization" />
          </div>
          <div className="space-y-2">
            <Label>Partner Type</Label>
            <Select value={partnerType} onValueChange={(v) => setPartnerType(v as PartnerType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel info="What you offer startups — batch details, incubation benefits, mentorship, funding, etc.">
            Program Details
          </FieldLabel>
          <Textarea
            value={programDetails}
            onChange={(e) => setProgramDetails(e.target.value)}
            placeholder="Describe your program, cohort structure, and what founders get from joining..."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Startups Supported</Label>
            <Input type="number" min={0} value={startupsSupportedCount} onChange={(e) => setStartupsSupportedCount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourorg.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Application Link (optional)</Label>
          <Input value={applicationLink} onChange={(e) => setApplicationLink(e.target.value)} placeholder="https://yourorg.com/apply" />
        </div>
      </CardContent>
    </Card>
  );
}

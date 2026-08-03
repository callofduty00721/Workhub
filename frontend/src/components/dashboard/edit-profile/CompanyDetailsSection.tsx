import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabel } from "@/components/shared/FieldInfo";
import type { CompanySize } from "@/types";
import { COMPANY_SIZES } from "./shared";

export function CompanyDetailsSection({
  companyName,
  setCompanyName,
  companySize,
  setCompanySize,
  industriesInput,
  setIndustriesInput,
  website,
  setWebsite,
  companyRegistrationNumber,
  setCompanyRegistrationNumber,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  companySize: CompanySize;
  setCompanySize: (v: CompanySize) => void;
  industriesInput: string;
  setIndustriesInput: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  companyRegistrationNumber: string;
  setCompanyRegistrationNumber: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Company Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
          </div>
          <div className="space-y-2">
            <Label>Company Size</Label>
            <Select value={companySize || undefined} onValueChange={(v) => setCompanySize(v as CompanySize)}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} employees
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Industries (comma separated)</Label>
          <Input value={industriesInput} onChange={(e) => setIndustriesInput(e.target.value)} placeholder="E-commerce, FinTech, Healthcare" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
          </div>
          <div className="space-y-2">
            <FieldLabel info="GST number, CIN, or equivalent business registration — self-reported, shown to build trust with freelancers.">
              Company Registration No. (optional)
            </FieldLabel>
            <Input value={companyRegistrationNumber} onChange={(e) => setCompanyRegistrationNumber(e.target.value)} placeholder="e.g. GSTIN / CIN" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

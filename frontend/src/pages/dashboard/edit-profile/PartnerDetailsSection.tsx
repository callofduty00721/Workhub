import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabel } from "@/components/shared/FieldInfo";
import type { CompanySize, PartnerType } from "@/types";
import { PARTNER_TYPES, COMPANY_SIZES } from "./shared";

export function PartnerDetailsSection({
  organizationName,
  setOrganizationName,
  partnerType,
  setPartnerType,
  servicesInput,
  setServicesInput,
  industriesInput,
  setIndustriesInput,
  companySize,
  setCompanySize,
  teamSize,
  setTeamSize,
  yearsInBusiness,
  setYearsInBusiness,
  projectsCompleted,
  setProjectsCompleted,
  clientsServed,
  setClientsServed,
  partnershipTypesInput,
  setPartnershipTypesInput,
  programDetails,
  setProgramDetails,
  startupsSupportedCount,
  setStartupsSupportedCount,
  website,
  setWebsite,
  linkedIn,
  setLinkedIn,
  applicationLink,
  setApplicationLink,
}: {
  organizationName: string;
  setOrganizationName: (v: string) => void;
  partnerType: PartnerType;
  setPartnerType: (v: PartnerType) => void;
  servicesInput: string;
  setServicesInput: (v: string) => void;
  industriesInput: string;
  setIndustriesInput: (v: string) => void;
  companySize: CompanySize;
  setCompanySize: (v: CompanySize) => void;
  teamSize: number;
  setTeamSize: (v: number) => void;
  yearsInBusiness: number;
  setYearsInBusiness: (v: number) => void;
  projectsCompleted: number;
  setProjectsCompleted: (v: number) => void;
  clientsServed: number;
  setClientsServed: (v: number) => void;
  partnershipTypesInput: string;
  setPartnershipTypesInput: (v: string) => void;
  programDetails: string;
  setProgramDetails: (v: string) => void;
  startupsSupportedCount: number;
  setStartupsSupportedCount: (v: number) => void;
  website: string;
  setWebsite: (v: string) => void;
  linkedIn: string;
  setLinkedIn: (v: string) => void;
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
            <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your agency or company" />
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
          <FieldLabel info="What you offer clients — services separated by commas, like Web Development, Branding, SEO.">Services</FieldLabel>
          <Input value={servicesInput} onChange={(e) => setServicesInput(e.target.value)} placeholder="Web Development, Branding, SEO" />
        </div>

        <div className="space-y-2">
          <FieldLabel info="Industries you typically work with, separated by commas.">Industries Served</FieldLabel>
          <Input value={industriesInput} onChange={(e) => setIndustriesInput(e.target.value)} placeholder="SaaS, FinTech, HealthTech" />
        </div>

        <div className="space-y-2">
          <FieldLabel info="Types of partnership you offer, separated by commas — service, referral, technology, strategic, distribution.">
            Partnership Types
          </FieldLabel>
          <Input value={partnershipTypesInput} onChange={(e) => setPartnershipTypesInput(e.target.value)} placeholder="service, technology, strategic" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Company Size</Label>
            <Select value={companySize} onValueChange={(v) => setCompanySize(v as CompanySize)}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s} employees
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team Size</Label>
            <Input type="number" min={0} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Years in Business</Label>
            <Input type="number" min={0} value={yearsInBusiness} onChange={(e) => setYearsInBusiness(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Projects Completed</Label>
            <Input type="number" min={0} value={projectsCompleted} onChange={(e) => setProjectsCompleted(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Clients Served</Label>
            <Input type="number" min={0} value={clientsServed} onChange={(e) => setClientsServed(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel info="Optional — batch details, incubation benefits, or program structure, if you run one alongside your services.">
            Program Details (optional)
          </FieldLabel>
          <Textarea
            value={programDetails}
            onChange={(e) => setProgramDetails(e.target.value)}
            placeholder="Describe any structured program, cohort, or engagement model..."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Startups Supported (optional)</Label>
            <Input type="number" min={0} value={startupsSupportedCount} onChange={(e) => setStartupsSupportedCount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourorg.com" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/company/yourorg" />
          </div>
          <div className="space-y-2">
            <Label>Application / Inquiry Link (optional)</Label>
            <Input value={applicationLink} onChange={(e) => setApplicationLink(e.target.value)} placeholder="https://yourorg.com/contact" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

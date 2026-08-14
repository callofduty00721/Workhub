import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SocialLinksEditor } from "./SocialLinksEditor";
import type { PartnerClient, ProfileSocialLink } from "@/types";

export function TalentPartnerDetailsSection({
  partnerType,
  setPartnerType,
  website,
  setWebsite,
  socialLinks,
  setSocialLinks,
  servicesInput,
  setServicesInput,
  brandPartnerships,
  addBrandPartnership,
  removeBrandPartnership,
  updateBrandPartnership,
}: {
  partnerType: string;
  setPartnerType: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  socialLinks: ProfileSocialLink[];
  setSocialLinks: (v: ProfileSocialLink[]) => void;
  servicesInput: string;
  setServicesInput: (v: string) => void;
  brandPartnerships: PartnerClient[];
  addBrandPartnership: () => void;
  removeBrandPartnership: (index: number) => void;
  updateBrandPartnership: (index: number, patch: Partial<PartnerClient>) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Talent Partner Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Partner Type</Label>
            <Input value={partnerType} onChange={(e) => setPartnerType(e.target.value)} placeholder="Talent Manager / Agency" />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Services (comma-separated)</Label>
          <Input value={servicesInput} onChange={(e) => setServicesInput(e.target.value)} placeholder="Talent Management, Brand Deals, PR" />
        </div>

        <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />

        {/* "Our Creators" isn't edited here — it's the consent-gated roster
            (invite an influencer, they accept), a separate flow from these
            free-text profile fields. */}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Brand Partnerships</Label>
            <Button variant="outline" size="sm" onClick={addBrandPartnership}>
              <Plus className="h-3.5 w-3.5" /> Add Partnership
            </Button>
          </div>
          {brandPartnerships.length === 0 && <p className="text-sm text-muted-foreground">No brand partnerships added yet.</p>}
          {brandPartnerships.map((c, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>Brand Name</Label>
                  <Input value={c.clientName} onChange={(e) => updateBrandPartnership(i, { clientName: e.target.value })} placeholder="Brand name" />
                </div>
                <button type="button" onClick={() => removeBrandPartnership(i)} className="mt-6 text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input value={c.logoUrl ?? ""} onChange={(e) => updateBrandPartnership(i, { logoUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={c.description ?? ""} onChange={(e) => updateBrandPartnership(i, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

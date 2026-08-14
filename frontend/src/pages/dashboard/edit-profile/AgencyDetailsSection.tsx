import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SocialLinksEditor } from "./SocialLinksEditor";
import type { AgencyService, PartnerClient, InfluencerCollaboration, ProfileSocialLink } from "@/types";

const SERVICE_OPTIONS: { value: AgencyService; label: string }[] = [
  { value: "influencer_marketing", label: "Influencer Marketing" },
  { value: "social_media_marketing", label: "Social Media Marketing" },
  { value: "performance_marketing", label: "Performance Marketing" },
  { value: "brand_campaigns", label: "Brand Campaigns" },
  { value: "ugc", label: "UGC" },
  { value: "content_production", label: "Content Production" },
  { value: "pr", label: "PR" },
];

export function AgencyDetailsSection({
  agencyType,
  setAgencyType,
  website,
  setWebsite,
  socialLinks,
  setSocialLinks,
  teamSize,
  setTeamSize,
  services,
  setServices,
  clients,
  addClient,
  removeClient,
  updateClient,
  pastCampaigns,
  addPastCampaign,
  removePastCampaign,
  updatePastCampaign,
}: {
  agencyType: string;
  setAgencyType: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  socialLinks: ProfileSocialLink[];
  setSocialLinks: (v: ProfileSocialLink[]) => void;
  teamSize: number;
  setTeamSize: (v: number) => void;
  services: AgencyService[];
  setServices: (v: AgencyService[]) => void;
  clients: PartnerClient[];
  addClient: () => void;
  removeClient: (index: number) => void;
  updateClient: (index: number, patch: Partial<PartnerClient>) => void;
  pastCampaigns: InfluencerCollaboration[];
  addPastCampaign: () => void;
  removePastCampaign: (index: number) => void;
  updatePastCampaign: (index: number, patch: Partial<InfluencerCollaboration>) => void;
}) {
  const toggleService = (value: AgencyService) => {
    setServices(services.includes(value) ? services.filter((s) => s !== value) : [...services, value]);
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Agency Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Agency Type</Label>
            <Input value={agencyType} onChange={(e) => setAgencyType(e.target.value)} placeholder="Full-service marketing agency" />
          </div>
          <div className="space-y-2">
            <Label>Team Size</Label>
            <Input type="number" min={0} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://youragency.com" />
        </div>

        <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />

        <div className="space-y-2">
          <Label>Services</Label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleService(s.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  services.includes(s.value) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Our Clients</Label>
            <Button variant="outline" size="sm" onClick={addClient}>
              <Plus className="h-3.5 w-3.5" /> Add Client
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">A showcase of who you've worked with — not linked to their account.</p>
          {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients added yet.</p>}
          {clients.map((c, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>Client Name</Label>
                  <Input value={c.clientName} onChange={(e) => updateClient(i, { clientName: e.target.value })} placeholder="Client / brand name" />
                </div>
                <button type="button" onClick={() => removeClient(i)} className="mt-6 text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input value={c.logoUrl ?? ""} onChange={(e) => updateClient(i, { logoUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={c.description ?? ""} onChange={(e) => updateClient(i, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Past Campaigns</Label>
            <Button variant="outline" size="sm" onClick={addPastCampaign}>
              <Plus className="h-3.5 w-3.5" /> Add Campaign
            </Button>
          </div>
          {pastCampaigns.length === 0 && <p className="text-sm text-muted-foreground">No past campaigns added yet.</p>}
          {pastCampaigns.map((c, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>Title</Label>
                  <Input value={c.brandName} onChange={(e) => updatePastCampaign(i, { brandName: e.target.value })} placeholder="Campaign name" />
                </div>
                <button type="button" onClick={() => removePastCampaign(i)} className="mt-6 text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={c.description ?? ""} onChange={(e) => updatePastCampaign(i, { description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Result</Label>
                <Input value={c.resultMetric ?? ""} onChange={(e) => updatePastCampaign(i, { resultMetric: e.target.value })} placeholder="e.g. 5M reach" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

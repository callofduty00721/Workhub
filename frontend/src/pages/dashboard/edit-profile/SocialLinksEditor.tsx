import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ProfileSocialLink } from "@/types";

// Shared by Brand/Agency/Talent Partner's edit-profile sections — a
// free-form list (platform name + URL) rather than fixed Instagram/YouTube/
// Facebook fields, so a new platform never needs a code change to add. Same
// idea as InfluencerDetailsSection's Platforms list.
export function SocialLinksEditor({
  value,
  onChange,
}: {
  value: ProfileSocialLink[];
  onChange: (v: ProfileSocialLink[]) => void;
}) {
  const addLink = () => onChange([...value, { platform: "", url: "" }]);
  const removeLink = (index: number) => onChange(value.filter((_, i) => i !== index));
  const updateLink = (index: number, patch: Partial<ProfileSocialLink>) =>
    onChange(value.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Social Links</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLink}>
          <Plus className="h-3.5 w-3.5" /> Add Social Link
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Instagram, YouTube, LinkedIn, or anything else — add as many as you like.</p>
      {value.length === 0 && <p className="text-sm text-muted-foreground">No social links added yet.</p>}
      {value.map((link, i) => (
        <div key={i} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_2fr_auto]">
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Input value={link.platform} onChange={(e) => updateLink(i, { platform: e.target.value })} placeholder="Instagram" />
          </div>
          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input value={link.url} onChange={(e) => updateLink(i, { url: e.target.value })} placeholder="https://instagram.com/yourhandle" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={() => removeLink(i)} className="text-danger hover:opacity-80" aria-label="Remove social link">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INFLUENCER_CATEGORY_NAMES, INFLUENCER_CATEGORIES } from "@/lib/mockData";
import type { InfluencerPlatform, InfluencerRate, InfluencerCollaboration, InfluencerContentSample } from "@/types";

export function InfluencerDetailsSection({
  category,
  setCategory,
  niche,
  setNiche,
  avgEngagementRate,
  setAvgEngagementRate,
  mediaKitUrl,
  setMediaKitUrl,
  platforms,
  addPlatform,
  removePlatform,
  updatePlatform,
  rateCard,
  addRateCardItem,
  removeRateCardItem,
  updateRateCardItem,
  pastCollaborations,
  addCollaboration,
  removeCollaboration,
  updateCollaboration,
  contentSamples,
  addContentSample,
  removeContentSample,
  updateContentSample,
}: {
  category: string;
  setCategory: (v: string) => void;
  niche: string;
  setNiche: (v: string) => void;
  avgEngagementRate: number;
  setAvgEngagementRate: (v: number) => void;
  mediaKitUrl: string;
  setMediaKitUrl: (v: string) => void;
  platforms: InfluencerPlatform[];
  addPlatform: () => void;
  removePlatform: (index: number) => void;
  updatePlatform: (index: number, patch: Partial<InfluencerPlatform>) => void;
  rateCard: InfluencerRate[];
  addRateCardItem: () => void;
  removeRateCardItem: (index: number) => void;
  updateRateCardItem: (index: number, patch: Partial<InfluencerRate>) => void;
  pastCollaborations: InfluencerCollaboration[];
  addCollaboration: () => void;
  removeCollaboration: (index: number) => void;
  updateCollaboration: (index: number, patch: Partial<InfluencerCollaboration>) => void;
  contentSamples: InfluencerContentSample[];
  addContentSample: () => void;
  removeContentSample: (index: number) => void;
  updateContentSample: (index: number, patch: Partial<InfluencerContentSample>) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Influencer Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setNiche("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {INFLUENCER_CATEGORY_NAMES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Niche</Label>
            {category && INFLUENCER_CATEGORIES[category]?.length ? (
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Select niche" />
                </SelectTrigger>
                <SelectContent>
                  {INFLUENCER_CATEGORIES[category].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="flex h-9 items-center text-xs text-muted-foreground">Select a category first.</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Avg. Engagement Rate (%)</Label>
          <Input type="number" min={0} step="0.1" value={avgEngagementRate} onChange={(e) => setAvgEngagementRate(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Media Kit URL</Label>
          <Input value={mediaKitUrl} onChange={(e) => setMediaKitUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Platforms</Label>
            <Button variant="outline" size="sm" onClick={addPlatform}>
              <Plus className="h-3.5 w-3.5" /> Add Platform
            </Button>
          </div>
          {platforms.length === 0 && <p className="text-sm text-muted-foreground">No platforms added yet.</p>}
          {platforms.map((p, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Input value={p.platform} onChange={(e) => updatePlatform(i, { platform: e.target.value })} placeholder="Instagram" />
                </div>
                <div className="space-y-1.5">
                  <Label>Handle</Label>
                  <Input value={p.handle ?? ""} onChange={(e) => updatePlatform(i, { handle: e.target.value })} placeholder="@yourhandle" />
                </div>
                <div className="space-y-1.5">
                  <Label>Followers</Label>
                  <Input type="number" min={0} value={p.followers ?? 0} onChange={(e) => updatePlatform(i, { followers: Number(e.target.value) })} />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removePlatform(i)} className="text-danger hover:opacity-80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Profile Link</Label>
                <Input value={p.url ?? ""} onChange={(e) => updatePlatform(i, { url: e.target.value })} placeholder="https://instagram.com/yourhandle" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Rate Card</Label>
            <Button variant="outline" size="sm" onClick={addRateCardItem}>
              <Plus className="h-3.5 w-3.5" /> Add Rate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Let brands see your pricing upfront — one row per platform + content type.</p>
          {rateCard.length === 0 && <p className="text-sm text-muted-foreground">No rates added yet.</p>}
          {rateCard.map((r, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Input value={r.platform} onChange={(e) => updateRateCardItem(i, { platform: e.target.value })} placeholder="Instagram" />
              </div>
              <div className="space-y-1.5">
                <Label>Content Type</Label>
                <Input value={r.contentType} onChange={(e) => updateRateCardItem(i, { contentType: e.target.value })} placeholder="Reel, Post, Story..." />
              </div>
              <div className="space-y-1.5">
                <Label>Price (₹)</Label>
                <Input type="number" min={0} value={r.priceInInr} onChange={(e) => updateRateCardItem(i, { priceInInr: Number(e.target.value) })} />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => removeRateCardItem(i)} className="text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Past Collaborations</Label>
            <Button variant="outline" size="sm" onClick={addCollaboration}>
              <Plus className="h-3.5 w-3.5" /> Add Collaboration
            </Button>
          </div>
          {pastCollaborations.length === 0 && <p className="text-sm text-muted-foreground">No collaborations added yet.</p>}
          {pastCollaborations.map((c, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>Brand Name</Label>
                  <Input value={c.brandName} onChange={(e) => updateCollaboration(i, { brandName: e.target.value })} placeholder="Brand name" />
                </div>
                <button type="button" onClick={() => removeCollaboration(i)} className="mt-6 text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={c.description ?? ""}
                  onChange={(e) => updateCollaboration(i, { description: e.target.value })}
                  placeholder="What you did for this campaign"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Result</Label>
                <Input
                  value={c.resultMetric ?? ""}
                  onChange={(e) => updateCollaboration(i, { resultMetric: e.target.value })}
                  placeholder="e.g. 250K views, 12% engagement"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Content Samples</Label>
            <Button variant="outline" size="sm" onClick={addContentSample}>
              <Plus className="h-3.5 w-3.5" /> Add Sample
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Links to your best posts/reels — shown as a gallery on your public profile.</p>
          {contentSamples.length === 0 && <p className="text-sm text-muted-foreground">No content samples added yet.</p>}
          {contentSamples.map((s, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[2fr_2fr_auto]">
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input value={s.url} onChange={(e) => updateContentSample(i, { url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Caption</Label>
                <Input value={s.caption ?? ""} onChange={(e) => updateContentSample(i, { caption: e.target.value })} placeholder="Optional caption" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => removeContentSample(i)} className="text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

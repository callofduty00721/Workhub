import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { INFLUENCER_CATEGORY_NAMES, INFLUENCER_CATEGORIES } from "@/lib/mockData";
import {
  LANGUAGE_LEVELS,
  type InfluencerPlatform,
  type InfluencerRate,
  type InfluencerCollaboration,
  type InfluencerContentSample,
  type InfluencerLanguage,
  type AchievementEntry,
  type AvailabilityStatus,
} from "@/types";

const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  conversational: "Conversational",
  fluent: "Fluent",
  native: "Native",
};

export function InfluencerDetailsSection({
  availabilityStatus,
  setAvailabilityStatus,
  category,
  setCategory,
  niche,
  setNiche,
  mediaKitUrl,
  setMediaKitUrl,
  website,
  setWebsite,
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
  languages,
  addLanguage,
  removeLanguage,
  updateLanguage,
  achievements,
  addAchievement,
  removeAchievement,
  updateAchievement,
}: {
  availabilityStatus: AvailabilityStatus;
  setAvailabilityStatus: (v: AvailabilityStatus) => void;
  category: string;
  setCategory: (v: string) => void;
  niche: string;
  setNiche: (v: string) => void;
  mediaKitUrl: string;
  setMediaKitUrl: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
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
  languages: InfluencerLanguage[];
  addLanguage: () => void;
  removeLanguage: (index: number) => void;
  updateLanguage: (index: number, patch: Partial<InfluencerLanguage>) => void;
  achievements: AchievementEntry[];
  addAchievement: () => void;
  removeAchievement: (index: number) => void;
  updateAchievement: (index: number, patch: Partial<AchievementEntry>) => void;
}) {
  // Influencer categories are otherwise a closed taxonomy (no enum on the
  // backend, but the frontend Select only ever offers INFLUENCER_CATEGORY_NAMES)
  // — this is the escape hatch, same idea as Brand's custom-category input.
  const [customCategoryMode, setCustomCategoryMode] = useState(!!category && !INFLUENCER_CATEGORY_NAMES.includes(category));

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Influencer Details</h3>
          <div className="flex items-center gap-2 rounded-full border border-border p-1">
            <button
              type="button"
              onClick={() => setAvailabilityStatus("available")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                availabilityStatus === "available" ? "bg-success text-success-foreground" : "text-muted-foreground"
              }`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityStatus("busy")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                availabilityStatus === "busy" ? "bg-warning text-warning-foreground" : "text-muted-foreground"
              }`}
            >
              Busy
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            {customCategoryMode ? (
              <div className="flex gap-2">
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Type your category"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomCategoryMode(false);
                    setCategory("");
                    setNiche("");
                  }}
                >
                  Back to list
                </Button>
              </div>
            ) : (
              <Select
                value={category}
                onValueChange={(value) => {
                  if (value === "__other__") {
                    setCustomCategoryMode(true);
                    setCategory("");
                  } else {
                    setCategory(value);
                  }
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
                  <SelectItem value="__other__">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Niche</Label>
            {customCategoryMode ? (
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Type your niche" />
            ) : category && INFLUENCER_CATEGORIES[category]?.length ? (
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
          <Label>Media Kit URL</Label>
          <Input value={mediaKitUrl} onChange={(e) => setMediaKitUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" />
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
              <div className="flex items-start gap-3">
                {c.logoUrl ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border">
                    <img src={c.logoUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateCollaboration(i, { logoUrl: "" })}
                      className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remove logo"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    folder="collab_logo"
                    onUploaded={(url) => updateCollaboration(i, { logoUrl: url })}
                    label="Logo"
                    className="h-20 w-20 shrink-0"
                  />
                )}
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
          <p className="text-xs text-muted-foreground">Links to your best posts/reels, with your own thumbnail — shown as a gallery on your public profile.</p>
          {contentSamples.length === 0 && <p className="text-sm text-muted-foreground">No content samples added yet.</p>}
          {contentSamples.map((s, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[96px_1fr_auto]">
              <div className="space-y-1.5">
                <Label>Thumbnail</Label>
                {s.thumbnailUrl ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                    <img src={s.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateContentSample(i, { thumbnailUrl: "" })}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remove thumbnail"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    folder="content_thumbnail"
                    onUploaded={(url) => updateContentSample(i, { thumbnailUrl: url })}
                    label="Upload"
                    className="h-24 w-24"
                  />
                )}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>URL</Label>
                  <Input value={s.url} onChange={(e) => updateContentSample(i, { url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Caption</Label>
                  <Input value={s.caption ?? ""} onChange={(e) => updateContentSample(i, { caption: e.target.value })} placeholder="Optional caption" />
                </div>
              </div>
              <div className="flex items-start">
                <button type="button" onClick={() => removeContentSample(i)} className="text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Languages</Label>
            <Button variant="outline" size="sm" onClick={addLanguage}>
              <Plus className="h-3.5 w-3.5" /> Add Language
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Languages you can create content in, and how comfortably.</p>
          {languages.length === 0 && <p className="text-sm text-muted-foreground">No languages added yet.</p>}
          {languages.map((l, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Input value={l.name} onChange={(e) => updateLanguage(i, { name: e.target.value })} placeholder="Hindi, English, Marathi..." />
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={l.level} onValueChange={(value) => updateLanguage(i, { level: value as InfluencerLanguage["level"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {LANGUAGE_LEVEL_LABELS[lvl]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => removeLanguage(i)} className="text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Achievements</Label>
            <Button variant="outline" size="sm" onClick={addAchievement}>
              <Plus className="h-3.5 w-3.5" /> Add Achievement
            </Button>
          </div>
          {achievements.length === 0 && <p className="text-sm text-muted-foreground">No achievements added yet.</p>}
          {achievements.map((a, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={a.title} onChange={(e) => updateAchievement(i, { title: e.target.value })} placeholder="Instagram Verified Badge" />
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Input value={a.dateLabel} onChange={(e) => updateAchievement(i, { dateLabel: e.target.value })} placeholder="2025" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Input value={a.description} onChange={(e) => updateAchievement(i, { description: e.target.value })} />
                </div>
                <button type="button" onClick={() => removeAchievement(i)} className="mt-6 text-danger hover:opacity-80">
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

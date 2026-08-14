import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/shared/FileUpload";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { BRAND_CATEGORIES } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import type { BrandProduct, InfluencerRequirement, InfluencerCollaboration, ProfileSocialLink } from "@/types";

export function BrandDetailsSection({
  industry,
  setIndustry,
  categories,
  setCategories,
  website,
  setWebsite,
  socialLinks,
  setSocialLinks,
  followerCount,
  setFollowerCount,
  products,
  addProduct,
  removeProduct,
  updateProduct,
  requirements,
  addRequirement,
  removeRequirement,
  updateRequirement,
  pastCollaborations,
  addCollaboration,
  removeCollaboration,
  updateCollaboration,
}: {
  industry: string;
  setIndustry: (v: string) => void;
  categories: string[];
  setCategories: (v: string[]) => void;
  website: string;
  setWebsite: (v: string) => void;
  socialLinks: ProfileSocialLink[];
  setSocialLinks: (v: ProfileSocialLink[]) => void;
  followerCount: number;
  setFollowerCount: (v: number) => void;
  products: BrandProduct[];
  addProduct: () => void;
  removeProduct: (index: number) => void;
  updateProduct: (index: number, patch: Partial<BrandProduct>) => void;
  requirements: InfluencerRequirement[];
  addRequirement: () => void;
  removeRequirement: (index: number) => void;
  updateRequirement: (index: number, patch: Partial<InfluencerRequirement>) => void;
  pastCollaborations: InfluencerCollaboration[];
  addCollaboration: () => void;
  removeCollaboration: (index: number) => void;
  updateCollaboration: (index: number, patch: Partial<InfluencerCollaboration>) => void;
}) {
  const [customCategory, setCustomCategory] = useState("");
  const customCategories = categories.filter((c) => !BRAND_CATEGORIES.includes(c));

  const toggleCategory = (value: string) => {
    setCategories(categories.includes(value) ? categories.filter((c) => c !== value) : [...categories, value]);
  };
  const addCustomCategory = () => {
    const value = customCategory.trim();
    if (value && !categories.includes(value)) setCategories([...categories, value]);
    setCustomCategory("");
  };
  const removeCustomCategory = (value: string) => setCategories(categories.filter((c) => c !== value));

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">Brand Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Fashion & Lifestyle" />
          </div>
          <div className="space-y-2">
            <Label>Follower Count</Label>
            <Input type="number" min={0} value={followerCount} onChange={(e) => setFollowerCount(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Categories</Label>
          <p className="text-xs text-muted-foreground">Pick everything that applies — shown on your public card, and used for the Category filter.</p>
          <div className="flex flex-wrap gap-2">
            {BRAND_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  categories.includes(c) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {customCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {customCategories.map((c) => (
                <span key={c} className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  {c}
                  <button type="button" onClick={() => removeCustomCategory(c)} aria-label={`Remove ${c}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomCategory();
                }
              }}
              placeholder="Don't see yours? Add your own category"
              className="max-w-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={addCustomCategory}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbrand.com" />
        </div>

        <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Products & Services</Label>
            <Button variant="outline" size="sm" onClick={addProduct}>
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </div>
          {products.length === 0 && <p className="text-sm text-muted-foreground">No products added yet.</p>}
          {products.map((p, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-border p-4">
              <div className="shrink-0">
                {p.imageUrl ? (
                  <div className="relative h-20 w-28 overflow-hidden rounded-md border border-border">
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateProduct(i, { imageUrl: "" })}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    folder="brand_product"
                    onUploaded={(url) => updateProduct(i, { imageUrl: url })}
                    label="Photo"
                    className="h-20 w-28"
                  />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label>Name</Label>
                    <Input value={p.name} onChange={(e) => updateProduct(i, { name: e.target.value })} placeholder="Summer Collection" />
                  </div>
                  <button type="button" onClick={() => removeProduct(i)} className="mt-6 text-danger hover:opacity-80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={p.description ?? ""} onChange={(e) => updateProduct(i, { description: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Influencer Requirements</Label>
            <Button variant="outline" size="sm" onClick={addRequirement}>
              <Plus className="h-3.5 w-3.5" /> Add Requirement
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Your standing ask — shown on your public profile, separate from any specific Campaign.</p>
          {requirements.length === 0 && <p className="text-sm text-muted-foreground">No requirements added yet.</p>}
          {requirements.map((r, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input value={r.category ?? ""} onChange={(e) => updateRequirement(i, { category: e.target.value })} placeholder="Fashion" />
                </div>
                <div className="space-y-1.5">
                  <Label>Min Followers</Label>
                  <Input
                    type="number"
                    min={0}
                    value={r.minFollowers ?? 0}
                    onChange={(e) => updateRequirement(i, { minFollowers: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removeRequirement(i)} className="text-danger hover:opacity-80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Platforms (comma-separated)</Label>
                  <Input
                    value={(r.platforms ?? []).join(", ")}
                    onChange={(e) => updateRequirement(i, { platforms: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    placeholder="Instagram, YouTube"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={r.location ?? ""} onChange={(e) => updateRequirement(i, { location: e.target.value })} placeholder="Mumbai" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={r.notes ?? ""} onChange={(e) => updateRequirement(i, { notes: e.target.value })} placeholder="Reels only, no static posts" />
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
                  <Label>Title</Label>
                  <Input value={c.brandName} onChange={(e) => updateCollaboration(i, { brandName: e.target.value })} placeholder="Launch campaign" />
                </div>
                <button type="button" onClick={() => removeCollaboration(i)} className="mt-6 text-danger hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={c.description ?? ""} onChange={(e) => updateCollaboration(i, { description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Result</Label>
                <Input
                  value={c.resultMetric ?? ""}
                  onChange={(e) => updateCollaboration(i, { resultMetric: e.target.value })}
                  placeholder="e.g. 2M reach"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

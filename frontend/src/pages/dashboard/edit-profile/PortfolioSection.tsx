import { BadgeCheck, Plus, Trash2, FileText, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { formatCurrency } from "@/lib/utils";
import type { PortfolioItem, Payment } from "@/types";
import { TYPE_LABELS, splitList } from "./shared";

export function PortfolioSection({
  portfolioItems,
  addPortfolioItem,
  removePortfolioItem,
  updatePortfolioItem,
  portfolioItemTags,
  portfolioItemVerifiedPaymentId,
  suggestedPayments,
  addPortfolioItemFromPayment,
  verifiablePayments,
}: {
  portfolioItems: PortfolioItem[];
  addPortfolioItem: () => void;
  removePortfolioItem: (index: number) => void;
  updatePortfolioItem: (index: number, patch: Partial<PortfolioItem>) => void;
  portfolioItemTags: (index: number) => string;
  portfolioItemVerifiedPaymentId: (item: PortfolioItem) => string;
  suggestedPayments: Payment[];
  addPortfolioItemFromPayment: (payment: Payment) => void;
  verifiablePayments: Payment[];
}) {
  return (
    <Card id="portfolio">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Portfolio</h3>
            <p className="text-xs text-muted-foreground">Showcase past work so clients can see proof before they hire you.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addPortfolioItem}>
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        </div>

        {suggestedPayments.length > 0 && (
          <div className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Add from your completed work
            </p>
            <div className="space-y-2">
              {suggestedPayments.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.note || TYPE_LABELS[p.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(p.netAmount || p.amount)} · {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPortfolioItemFromPayment(p)}>
                    <Plus className="h-3.5 w-3.5" /> Add to Portfolio
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {portfolioItems.length === 0 && <p className="text-sm text-muted-foreground">No portfolio items added yet.</p>}

        {portfolioItems.map((item, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Item {i + 1}</span>
              <button type="button" onClick={() => removePortfolioItem(i)} className="text-danger hover:opacity-80">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <Label>Images</Label>
              {!!item.images?.length && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {item.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="group relative">
                      <img src={img} alt="" className="h-20 w-full rounded-lg border border-border object-cover" />
                      <button
                        type="button"
                        onClick={() => updatePortfolioItem(i, { images: item.images!.filter((_, idx) => idx !== imgIdx) })}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-danger opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FileUpload
                folder="service_cover"
                label="Add image"
                onUploaded={(url) => updatePortfolioItem(i, { images: [...(item.images ?? []), url] })}
                className="max-w-[180px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={item.title} onChange={(e) => updatePortfolioItem(i, { title: e.target.value })} placeholder="E-commerce Website Redesign" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={item.description}
                onChange={(e) => updatePortfolioItem(i, { description: e.target.value })}
                placeholder="What did you build, and what was the outcome?"
                className="min-h-[70px]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Client (optional)</Label>
                <Input value={item.clientName ?? ""} onChange={(e) => updatePortfolioItem(i, { clientName: e.target.value })} placeholder="Acme Pvt Ltd" />
              </div>
              <div className="space-y-1.5">
                <Label>Your Role (optional)</Label>
                <Input value={item.projectRole ?? ""} onChange={(e) => updatePortfolioItem(i, { projectRole: e.target.value })} placeholder="Lead Frontend Developer" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input
                value={portfolioItemTags(i)}
                onChange={(e) => updatePortfolioItem(i, { tags: splitList(e.target.value) })}
                placeholder="React, Shopify, UI Design"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Video (optional)</Label>
                {item.video ? (
                  <div className="space-y-1">
                    <video src={item.video} controls className="max-h-32 w-full rounded-lg border border-border" />
                    <button type="button" onClick={() => updatePortfolioItem(i, { video: "" })} className="text-xs text-danger hover:underline">
                      Remove video
                    </button>
                  </div>
                ) : (
                  <FileUpload folder="service_cover" accept="video/*" label="Upload video" onUploaded={(url) => updatePortfolioItem(i, { video: url })} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>PDF (optional)</Label>
                {item.pdf ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <a href={item.pdf} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-primary hover:underline">
                      View PDF
                    </a>
                    <button type="button" onClick={() => updatePortfolioItem(i, { pdf: "" })}>
                      <X className="h-3.5 w-3.5 text-danger" />
                    </button>
                  </div>
                ) : (
                  <FileUpload folder="document" accept="application/pdf" label="Upload PDF" onUploaded={(url) => updatePortfolioItem(i, { pdf: url })} />
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Website Link (optional)</Label>
                <Input
                  value={item.websiteLink ?? ""}
                  onChange={(e) => updatePortfolioItem(i, { websiteLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>GitHub (optional)</Label>
                <Input
                  value={item.githubLink ?? ""}
                  onChange={(e) => updatePortfolioItem(i, { githubLink: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Live Demo (optional)</Label>
                <Input
                  value={item.liveDemoLink ?? ""}
                  onChange={(e) => updatePortfolioItem(i, { liveDemoLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            {verifiablePayments.length > 0 && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-success" /> Link to a completed payment (shows a Verified badge)
                </Label>
                <Select
                  value={portfolioItemVerifiedPaymentId(item) || "none"}
                  onValueChange={(v) => updatePortfolioItem(i, { verifiedPayment: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Not linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not linked</SelectItem>
                    {verifiablePayments.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {TYPE_LABELS[p.type]} · {formatCurrency(p.netAmount || p.amount)} · {new Date(p.createdAt).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

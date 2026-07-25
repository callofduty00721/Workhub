import { useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Link as LinkIcon, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HorizontalSlider } from "@/components/shared/HorizontalSlider";
import type { PortfolioItem } from "@/types";

// Shared between FreelancerProfile (a freelancer's full portfolio) and
// GigProfile (the portfolio of whoever posted that gig) so past-work proof
// looks and behaves identically wherever it's shown.
export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const imageIndexes = items.map((item, i) => (item.image ? i : -1)).filter((i) => i >= 0);

  return (
    <>
      <HorizontalSlider itemClassName="w-72">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border">
            {item.image && (
              <button
                type="button"
                onClick={() => setZoomIndex(i)}
                className="group relative block h-36 w-full overflow-hidden"
                aria-label={`Zoom ${item.title}`}
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                  <ZoomIn className="h-6 w-6 text-white" />
                </span>
              </button>
            )}
            <div className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.verifiedPayment && typeof item.verifiedPayment === "object" && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              {(item.clientName || item.projectRole) && (
                <p className="mt-0.5 text-xs text-muted-foreground">{[item.projectRole, item.clientName].filter(Boolean).join(" · ")}</p>
              )}
              {item.description && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{item.description}</p>}
              {!!item.tags?.length && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <LinkIcon className="h-3 w-3" /> View
                </a>
              )}
            </div>
          </div>
        ))}
      </HorizontalSlider>

      <Dialog open={zoomIndex !== null} onOpenChange={(open) => !open && setZoomIndex(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          {zoomIndex !== null && items[zoomIndex]?.image && (
            <div className="relative">
              <img src={items[zoomIndex].image} alt={items[zoomIndex].title} className="max-h-[80vh] w-full rounded-lg object-contain" />
              <p className="mt-2 text-center text-sm font-medium text-white">{items[zoomIndex].title}</p>
              {imageIndexes.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const pos = imageIndexes.indexOf(zoomIndex);
                      setZoomIndex(imageIndexes[(pos - 1 + imageIndexes.length) % imageIndexes.length]);
                    }}
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pos = imageIndexes.indexOf(zoomIndex);
                      setZoomIndex(imageIndexes[(pos + 1) % imageIndexes.length]);
                    }}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

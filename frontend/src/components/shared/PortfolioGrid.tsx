import { useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, ExternalLink, FileText, Github, ImageIcon, PlayCircle, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HorizontalSlider } from "@/components/shared/HorizontalSlider";
import type { PortfolioItem } from "@/types";

interface ZoomState {
  itemIndex: number;
  imageIndex: number;
}

// Shared between FreelancerProfile (a freelancer's full portfolio) and
// GigProfile (the portfolio of whoever posted that gig) so past-work proof
// looks and behaves identically wherever it's shown.
export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const zoomItem = zoom ? items[zoom.itemIndex] : null;
  const zoomImages = zoomItem?.images ?? [];

  return (
    <>
      <HorizontalSlider itemClassName="w-72">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border">
            {!!item.images?.length && (
              <button
                type="button"
                onClick={() => setZoom({ itemIndex: i, imageIndex: 0 })}
                className="group relative block h-36 w-full overflow-hidden"
                aria-label={`Zoom ${item.title}`}
              >
                <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                  <ZoomIn className="h-6 w-6 text-white" />
                </span>
                {item.images.length > 1 && (
                  <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    <ImageIcon className="h-2.5 w-2.5" /> {item.images.length}
                  </span>
                )}
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
              {(item.video || item.pdf || item.websiteLink || item.githubLink || item.liveDemoLink) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.video && (
                    <a href={item.video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <PlayCircle className="h-3 w-3" /> Video
                    </a>
                  )}
                  {item.pdf && (
                    <a href={item.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <FileText className="h-3 w-3" /> PDF
                    </a>
                  )}
                  {item.websiteLink && (
                    <a href={item.websiteLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Website
                    </a>
                  )}
                  {item.githubLink && (
                    <a href={item.githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Github className="h-3 w-3" /> GitHub
                    </a>
                  )}
                  {item.liveDemoLink && (
                    <a href={item.liveDemoLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Live Demo
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </HorizontalSlider>

      <Dialog open={zoom !== null} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          {zoom && zoomImages[zoom.imageIndex] && (
            <div className="relative">
              <img src={zoomImages[zoom.imageIndex]} alt={zoomItem?.title} className="max-h-[80vh] w-full rounded-lg object-contain" />
              <p className="mt-2 text-center text-sm font-medium text-white">
                {zoomItem?.title}
                {zoomImages.length > 1 && (
                  <span className="ml-1.5 text-white/70">
                    ({zoom.imageIndex + 1}/{zoomImages.length})
                  </span>
                )}
              </p>
              {zoomImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setZoom({ ...zoom, imageIndex: (zoom.imageIndex - 1 + zoomImages.length) % zoomImages.length })}
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom({ ...zoom, imageIndex: (zoom.imageIndex + 1) % zoomImages.length })}
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

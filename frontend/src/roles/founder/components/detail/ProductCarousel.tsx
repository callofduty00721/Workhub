import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Package, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { StartupProduct } from "@/types";

const PRODUCT_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  live: { label: "Live", bg: "#F5F5F5", fg: "#171717" },
  beta: { label: "Beta", bg: "#fdf1de", fg: "#d97706" },
  coming_soon: { label: "Coming Soon", bg: "#f1f5f9", fg: "#64748b" },
};

function productTags(p: StartupProduct): string[] {
  if (p.tags?.length) return p.tags;
  return p.tag ? [p.tag] : [];
}

export function ProductCarousel({ products, onSelect }: { products: StartupProduct[]; onSelect: (p: StartupProduct) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {products.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="absolute -left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted sm:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted sm:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      <div ref={scrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1">
        {products.map((p, i) => {
          const cover = p.images?.[0] || p.image;
          const statusMeta = p.status ? PRODUCT_STATUS_META[p.status] : null;
          const tags = productTags(p);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(p)}
              className="w-44 shrink-0 snap-start overflow-hidden rounded-xl border border-border text-left transition-shadow hover:shadow-md sm:w-52"
            >
              <div className="relative">
                {cover ? (
                  <img src={cover} alt={p.name} loading="lazy" className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-muted text-muted-foreground">
                    <Package className="h-7 w-7" />
                  </div>
                )}
                {statusMeta && (
                  <span
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                    style={{ background: statusMeta.bg, color: statusMeta.fg }}
                  >
                    {statusMeta.label}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold">{p.name}</p>
                {p.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{p.description}</p>}
                {p.price && <p className="mt-1 text-[11.5px] font-bold text-foreground">{p.price}</p>}
                {tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tags.map((t, ti) => (
                      <span key={ti} className="inline-block rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-bold text-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductDetailModal({ product, onOpenChange }: { product: StartupProduct | null; onOpenChange: (open: boolean) => void }) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [product]);

  const images = product ? (product.images?.length ? product.images : product.image ? [product.image] : []) : [];

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
            </DialogHeader>

            {images.length > 0 ? (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl bg-muted">
                  <img src={images[activeImage]} alt={product.name} className="h-64 w-full object-cover" />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={cn(
                          "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                          activeImage === i ? "border-brand" : "border-transparent"
                        )}
                      >
                        <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Package className="h-8 w-8" />
              </div>
            )}

            <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {product.status && PRODUCT_STATUS_META[product.status] && (
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: PRODUCT_STATUS_META[product.status].bg, color: PRODUCT_STATUS_META[product.status].fg }}
                >
                  {PRODUCT_STATUS_META[product.status].label}
                </span>
              )}
              {productTags(product).map((t, i) => (
                <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-foreground">
                  {t}
                </span>
              ))}
              {product.price && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-foreground">{product.price}</span>}
            </div>

            {product.description && <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">{product.description}</p>}

            {(product.features?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-[12px] font-bold text-foreground">Key Features</p>
                <ul className="space-y-1.5">
                  {product.features!.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] text-foreground/80">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground hover:opacity-90"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Visit Product
              </a>
            )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

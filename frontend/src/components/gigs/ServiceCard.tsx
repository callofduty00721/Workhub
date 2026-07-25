import { Link } from "react-router-dom";
import { Star, PlayCircle, Clock, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { Service } from "@/types";

export function ServiceCard({ service }: { service: Service }) {
  const freelancer = typeof service.freelancer === "object" ? service.freelancer : null;
  const companyName = typeof service.company === "object" ? service.company?.name : undefined;
  const cheapestPackage = service.packages?.length ? service.packages.reduce((min, p) => (p.price < min.price ? p : min)) : null;
  const displayPrice = cheapestPackage?.price ?? service.price;
  const displayDeliveryDays = cheapestPackage?.deliveryDays ?? service.deliveryDays;
  const displayRevisions = cheapestPackage?.revisions ?? service.revisions;

  return (
    <Link to={`/services/${service._id}`}>
      <Card className="flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="relative">
          {service.images?.[0] ? (
            <img src={service.images[0]} alt={service.title} className="h-32 w-full object-cover" />
          ) : (
            <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5">
              <span className="text-3xl font-bold text-primary/40">{service.title[0]}</span>
            </div>
          )}
          {service.video && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
              <PlayCircle className="h-3 w-3" /> Video
            </span>
          )}
          <SaveButton type="service" id={service._id} className="absolute left-2 top-2" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          {freelancer && (
            <div className="mb-2 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-[10px] font-semibold text-white">
                  {initialsFromName(freelancer.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{freelancer.name}</span>
              {companyName && (
                <Badge variant="outline" className="text-[9px]">
                  {companyName}
                </Badge>
              )}
            </div>
          )}
          <p className="mb-2 line-clamp-2 flex-1 text-sm font-medium">{service.title}</p>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" /> {service.rating || "New"}
            {service.reviewCount > 0 && ` (${service.reviewCount})`}
            <Badge variant="outline" className="ml-auto text-[10px]">
              {service.category}
            </Badge>
          </div>
          <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {displayDeliveryDays}-day delivery
            </span>
            {!!displayRevisions && (
              <span className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                {displayRevisions === -1 ? "Unlimited revisions" : `${displayRevisions} revision${displayRevisions === 1 ? "" : "s"}`}
              </span>
            )}
          </div>
          <div className="border-t border-border pt-3 text-sm">
            <span className="text-xs text-muted-foreground">Starting at</span>{" "}
            <span className="font-semibold">{formatCurrency(displayPrice)}</span>
            {!cheapestPackage && service.priceType === "hourly" && <span className="text-xs text-muted-foreground">/hr</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}

import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Service } from "@/types";

export function ServiceCard({ service }: { service: Service }) {
  const freelancer = typeof service.freelancer === "object" ? service.freelancer : null;

  return (
    <Link to={`/services/${service._id}`}>
      <Card className="flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card">
        {service.images?.[0] ? (
          <img src={service.images[0]} alt={service.title} className="h-32 w-full object-cover" />
        ) : (
          <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5">
            <span className="text-3xl font-bold text-primary/40">{service.title[0]}</span>
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          {freelancer && (
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[10px] font-semibold text-white">
                {freelancer.name[0]}
              </div>
              <span className="text-xs text-muted-foreground">{freelancer.name}</span>
            </div>
          )}
          <p className="mb-2 line-clamp-2 flex-1 text-sm font-medium">{service.title}</p>
          <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" /> {service.rating || "New"}
            {service.reviewCount > 0 && ` (${service.reviewCount})`}
            <Badge variant="outline" className="ml-auto text-[10px]">
              {service.category}
            </Badge>
          </div>
          <div className="border-t border-border pt-3 text-sm">
            <span className="text-xs text-muted-foreground">Starting at</span>{" "}
            <span className="font-semibold">{formatCurrency(service.price)}</span>
            {service.priceType === "hourly" && <span className="text-xs text-muted-foreground">/hr</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}

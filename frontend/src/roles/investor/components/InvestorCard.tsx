import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import type { InvestorSummary } from "@/types";

export function InvestorCard({ investor }: { investor: InvestorSummary }) {
  return (
    <Link to={`/investors/${investor._id}`} className="min-w-0">
      <Card className="flex h-full min-w-0 flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={investor.avatar} alt={investor.name} />
            <AvatarFallback>{initialsFromName(investor.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{investor.name}</p>
            <p className="truncate text-xs text-muted-foreground">{investor.headline || "Investor"}</p>
          </div>
        </div>
        {investor.location && (
          <span className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {investor.location}
          </span>
        )}
        <div className="mb-4 flex flex-1 flex-wrap gap-1.5">
          {investor.investmentFocus.slice(0, 4).map((focus) => (
            <Badge key={focus} variant="outline" className="text-[10px]">
              {focus}
            </Badge>
          ))}
        </div>
        <div className="border-t border-border pt-3 text-xs">
          {investor.ticketSizeMin > 0 ? (
            <span className="font-semibold text-success">
              {formatCurrency(investor.ticketSizeMin)} - {formatCurrency(investor.ticketSizeMax)}
            </span>
          ) : (
            <span className="text-muted-foreground">Ticket size on request</span>
          )}
        </div>
      </Card>
    </Link>
  );
}

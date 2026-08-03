import { Link } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCompactNumber, initialsFromName } from "@/lib/utils";
import type { InfluencerSummary } from "@/types";

export function InfluencerCard({ influencer }: { influencer: InfluencerSummary }) {
  const totalFollowers = (influencer.influencerProfile?.platforms ?? []).reduce((sum, p) => sum + (p.followers ?? 0), 0);

  return (
    <Link to={`/influencers/${influencer._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={influencer.avatar} alt={influencer.name} />
            <AvatarFallback>{initialsFromName(influencer.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{influencer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{influencer.influencerProfile?.niche || influencer.headline || "Influencer"}</p>
          </div>
        </div>
        {influencer.influencerProfile?.category && (
          <Badge variant="secondary" className="mb-3 w-fit text-[10px]">
            {influencer.influencerProfile.category}
          </Badge>
        )}
        {influencer.location && (
          <span className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {influencer.location}
          </span>
        )}
        <div className="mb-4 flex flex-1 flex-wrap gap-1.5">
          {(influencer.influencerProfile?.platforms ?? []).slice(0, 4).map((p, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {p.platform}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {totalFollowers > 0 ? `${formatCompactNumber(totalFollowers)} followers` : "New creator"}
          </span>
          {!!influencer.influencerProfile?.avgEngagementRate && (
            <span className="font-medium text-primary">{influencer.influencerProfile.avgEngagementRate}% eng.</span>
          )}
        </div>
      </Card>
    </Link>
  );
}

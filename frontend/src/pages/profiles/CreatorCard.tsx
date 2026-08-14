import { Link } from "react-router-dom";
import { MapPin, Star, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, initialsFromName } from "@/lib/utils";
import type { RosterInfluencer } from "@/types";

// Shared by Agency's "Creators/Influencers" tab and Talent Partner's "Our
// Creators" tab — both read from the same consent-gated roster
// (talentRosterApi.publicRoster), just a different tab label per role.
export function CreatorCard({ creator }: { creator: RosterInfluencer }) {
  const totalFollowers = (creator.influencerProfile?.platforms ?? []).reduce((sum, p) => sum + (p.followers ?? 0), 0);
  const tagline = creator.influencerProfile?.niche || creator.influencerProfile?.category;

  return (
    <Link
      to={`/influencers/${creator._id}`}
      className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/40"
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={creator.avatar} alt={creator.name} />
        <AvatarFallback className="bg-neutral-900 text-sm text-white">{initialsFromName(creator.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{creator.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {tagline && (
            <Badge variant="secondary" className="text-[10px]">
              {tagline}
            </Badge>
          )}
          {creator.location && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {creator.location}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 space-y-1 text-right">
        {totalFollowers > 0 && (
          <p className="flex items-center justify-end gap-1 text-[12px] font-semibold">
            <Users className="h-3 w-3 text-muted-foreground" /> {formatCompactNumber(totalFollowers)}
          </p>
        )}
        {!!creator.reviewCount && (
          <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 text-[#F59E0B]" /> {creator.rating?.toFixed(1)}
          </p>
        )}
      </div>
    </Link>
  );
}

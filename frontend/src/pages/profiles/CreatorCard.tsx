import { Link } from "react-router-dom";
import { MapPin, Star, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] px-4 py-3 transition-colors hover:border-[#B6FF00]"
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={creator.avatar} alt={creator.name} />
        <AvatarFallback className="bg-[#111111] text-sm text-white">{initialsFromName(creator.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#111111]">{creator.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {tagline && <span className="rounded-full bg-[#F3F5F1] px-2 py-0.5 text-[10px] font-medium text-[#4B5563]">{tagline}</span>}
          {creator.location && (
            <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3" /> {creator.location}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 space-y-1 text-right">
        {totalFollowers > 0 && (
          <p className="flex items-center justify-end gap-1 text-[12px] font-semibold text-[#111111]">
            <Users className="h-3 w-3 text-[#9CA3AF]" /> {formatCompactNumber(totalFollowers)}
          </p>
        )}
        {!!creator.reviewCount && (
          <p className="flex items-center justify-end gap-1 text-[11px] text-[#9CA3AF]">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {creator.rating?.toFixed(1)}
          </p>
        )}
      </div>
    </Link>
  );
}

import { type ReactNode } from "react";
import { MapPin, Globe, CalendarDays, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFromName } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";

// Shared left-column sidebar card for the Brand/Agency/Talent Partner public
// profile pages — same visual language as InfluencerProfile.tsx's sidebar
// (avatar/name/verified badge/tagline/location/bio/website/joined date),
// generalized with a `tagline` and `extra` slot for role-specific bits
// (industry, agency type, team size...) instead of duplicating the card
// three times.
export function ProfileHeader({
  name,
  avatar,
  isVerified,
  tagline,
  location,
  bio,
  website,
  createdAt,
  extra,
  cta,
}: {
  name: string;
  avatar?: string;
  isVerified?: boolean;
  tagline?: string;
  location?: string;
  bio?: string;
  website?: string;
  createdAt: string;
  extra?: ReactNode;
  cta?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white lg:sticky lg:top-24">
      <div className="h-24 bg-gradient-to-br from-[#F1FFD6] to-[#F7F8F5]" />
      <div className="px-6 pb-6 text-center">
        <div className="relative -mt-12 inline-block">
          <Avatar className="h-24 w-24 border-4 border-white">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-[#111111] text-2xl text-white">{initialsFromName(name)}</AvatarFallback>
          </Avatar>
          {isVerified && (
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] ring-2 ring-white">
              <BadgeCheck className="h-3.5 w-3.5 text-white" />
            </span>
          )}
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[19px] font-extrabold text-[#111111]">
          {name}
          {isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#2563EB]" />}
        </p>
        {tagline && <p className="text-[13px] font-medium text-[#6B7280]">{tagline}</p>}
        {location && (
          <span className="mt-1 flex items-center justify-center gap-1 text-[12px] text-[#9CA3AF]">
            <MapPin className="h-3.5 w-3.5" /> {location}
          </span>
        )}

        {bio && <p className="mt-3 text-left text-[12.5px] leading-relaxed text-[#6B7280]" dangerouslySetInnerHTML={{ __html: renderBioHtml(bio) }} />}

        <div className="my-4 border-t border-[#F1F3EF]" />
        <div className="space-y-2.5 text-left">
          {website && (
            <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12.5px] text-[#6B7280] hover:text-[#111111]">
              <Globe className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{website}</span>
            </a>
          )}
          <p className="flex items-center gap-2 text-[12.5px] text-[#6B7280]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            Joined {new Date(createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>

        {extra && (
          <>
            <div className="my-4 border-t border-[#F1F3EF]" />
            <div className="text-left">{extra}</div>
          </>
        )}

        {cta && <div className="mt-4">{cta}</div>}
      </div>
    </div>
  );
}

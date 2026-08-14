import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Megaphone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Campaign } from "@/types";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  facebook: "Facebook",
  other: "Other",
};

// Shared by Brand and Agency profile pages' "Campaigns" tab — links into the
// real CampaignDetails page (/campaigns/:id), which already handles the
// influencer apply flow, so this card is just a summary tile, not a form.
export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const onBehalfOfName = typeof campaign.onBehalfOf === "object" ? campaign.onBehalfOf?.name : undefined;

  return (
    <Link
      to={`/campaigns/${campaign._id}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-neutral-900">{campaign.title}</p>
          {onBehalfOfName && <p className="truncate text-[11px] text-neutral-400">on behalf of {onBehalfOfName}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-500">
            {campaign.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {campaign.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Megaphone className="h-3 w-3" /> {campaign.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(", ")}
            </span>
            {!!campaign.minFollowers && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {campaign.minFollowers.toLocaleString("en-IN")}+ followers
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-[13px] font-bold text-neutral-900">
          ₹{campaign.budgetMin.toLocaleString("en-IN")}–{campaign.budgetMax.toLocaleString("en-IN")}
        </span>
      </div>

      {(campaign.influencerCategory || campaign.niche) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {campaign.influencerCategory && (
            <Badge variant="secondary" className="text-[10px]">
              {campaign.influencerCategory}
            </Badge>
          )}
          {campaign.niche && (
            <Badge variant="outline" className="text-[10px]">
              {campaign.niche}
            </Badge>
          )}
        </div>
      )}

      {campaign.deliverables && <p className="mt-2.5 line-clamp-2 text-[12.5px] text-neutral-500">{campaign.deliverables}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-[12px] text-neutral-400">
        <span>{campaign.applicationsCount} applicant{campaign.applicationsCount === 1 ? "" : "s"}</span>
        <span className="flex items-center gap-1 font-semibold text-neutral-900">
          View & Apply <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

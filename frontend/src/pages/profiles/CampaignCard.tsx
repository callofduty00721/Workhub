import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Megaphone, Users } from "lucide-react";
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
      className="block rounded-[18px] border border-[#E5E7EB] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B6FF00] hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-[#111111]">{campaign.title}</p>
          {onBehalfOfName && <p className="truncate text-[11px] text-[#9CA3AF]">on behalf of {onBehalfOfName}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6B7280]">
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
        <span className="shrink-0 text-[13px] font-bold text-[#111111]">
          ₹{campaign.budgetMin.toLocaleString("en-IN")}–{campaign.budgetMax.toLocaleString("en-IN")}
        </span>
      </div>

      {(campaign.influencerCategory || campaign.niche) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {campaign.influencerCategory && <span className="rounded-full bg-[#F3F5F1] px-2 py-0.5 text-[10px] font-medium text-[#4B5563]">{campaign.influencerCategory}</span>}
          {campaign.niche && <span className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-medium text-[#4B5563]">{campaign.niche}</span>}
        </div>
      )}

      {campaign.deliverables && <p className="mt-2.5 line-clamp-2 text-[12.5px] text-[#6B7280]">{campaign.deliverables}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-[#F1F3EF] pt-3 text-[12px] text-[#9CA3AF]">
        <span>
          {campaign.applicationsCount} applicant{campaign.applicationsCount === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1 font-semibold text-[#111111]">
          View & Apply <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

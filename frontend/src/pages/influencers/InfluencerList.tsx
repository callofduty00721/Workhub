import { Users2 } from "lucide-react";
import { DirectoryList } from "@/components/shared/DirectoryList";
import { InfluencerCard } from "@/components/influencers/InfluencerCard";
import { influencerApi } from "@/api/influencers";
import { INFLUENCER_CATEGORY_NAMES } from "@/lib/mockData";

export default function InfluencerList() {
  return (
    <DirectoryList
      title="Influencer Directory"
      subtitle="Discover creators to collaborate with or hire for a campaign."
      searchPlaceholder="Search influencers..."
      emptyIcon={Users2}
      emptyMessage="No influencers found."
      queryKey="influencers"
      queryFn={influencerApi.list}
      categoryOptions={INFLUENCER_CATEGORY_NAMES}
      getItemKey={(influencer) => influencer._id}
      renderCard={(influencer) => <InfluencerCard influencer={influencer} />}
    />
  );
}

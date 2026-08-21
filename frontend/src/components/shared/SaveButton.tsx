import { useMutation } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { userApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { CAMPAIGN_HIRER_ROLES } from "@/lib/roles";

export function SaveButton({
  type,
  id,
  className,
}: {
  type: "job" | "project" | "service" | "freelancer" | "contest" | "influencer" | "campaign" | "investor" | "mentor" | "partner";
  id: string;
  className?: string;
}) {
  const { user, refreshUser } = useAuth();
  const isSaved =
    type === "job"
      ? user?.savedJobs?.includes(id)
      : type === "project"
        ? user?.savedProjects?.includes(id)
        : type === "service"
          ? user?.savedServices?.includes(id)
          : type === "contest"
            ? user?.savedContests?.includes(id)
            : type === "influencer"
              ? user?.savedInfluencers?.includes(id)
              : type === "campaign"
                ? user?.savedCampaigns?.includes(id)
                : type === "investor"
                  ? user?.savedInvestors?.includes(id)
                  : type === "mentor"
                    ? user?.savedMentors?.includes(id)
                    : type === "partner"
                      ? user?.savedPartners?.includes(id)
                      : user?.savedFreelancers?.includes(id);

  const mutation = useMutation({
    mutationFn: () =>
      type === "job"
        ? userApi.toggleSavedJob(id)
        : type === "project"
          ? userApi.toggleSavedProject(id)
          : type === "service"
            ? userApi.toggleSavedService(id)
            : type === "contest"
              ? userApi.toggleSavedContest(id)
              : type === "influencer"
                ? userApi.toggleSavedInfluencer(id)
                : type === "campaign"
                  ? userApi.toggleSavedCampaign(id)
                  : type === "investor"
                    ? userApi.toggleSavedInvestor(id)
                    : type === "mentor"
                      ? userApi.toggleSavedMentor(id)
                      : type === "partner"
                        ? userApi.toggleSavedPartner(id)
                        : userApi.toggleSavedFreelancer(id),
    onSuccess: () => refreshUser(),
  });

  // Saving jobs/projects/gigs is a freelancer-only action (they're the ones
  // browsing work to do later); saving a freelancer profile is the opposite
  // direction — relevant to whoever might hire them — so it's open to any
  // logged-in non-freelancer... except a freelancer's own profile, which
  // simply never renders this button (see FreelancerCard/FreelancerProfile).
  // Saving an influencer is narrower still — only roles that can actually
  // hire one via a Campaign (see CAMPAIGN_HIRER_ROLES) ever see this button.
  // Saving a campaign is the influencer's own equivalent of that — bookmark
  // one to apply to later. Saving an investor/mentor/partner is open to any
  // logged-in user not of that same role (a founder bookmarking one to reach
  // out to later is the primary case, but nothing else in the app restricts
  // who can browse /investors, /mentors, or /partners).
  if (!user) return null;
  if (type === "influencer") {
    if (!user.role || !CAMPAIGN_HIRER_ROLES.includes(user.role)) return null;
  } else if (type === "campaign") {
    if (user.role !== "influencer") return null;
  } else if (type === "investor") {
    if (user.role === "investor") return null;
  } else if (type === "mentor") {
    if (user.role === "mentor") return null;
  } else if (type === "partner") {
    if (user.role === "partner") return null;
  } else if (type !== "freelancer" && user.role !== "freelancer") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mutation.mutate();
      }}
      disabled={mutation.isPending}
      title={isSaved ? "Remove from saved" : "Save for later"}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80",
        className
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
    </button>
  );
}

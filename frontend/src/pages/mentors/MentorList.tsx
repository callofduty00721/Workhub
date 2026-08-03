import { GraduationCap } from "lucide-react";
import { DirectoryList } from "@/components/shared/DirectoryList";
import { MentorCard } from "@/components/mentors/MentorCard";
import { mentorApi } from "@/api/mentors";

export default function MentorList() {
  return (
    <DirectoryList
      title="Mentor Network"
      subtitle="Get guidance from experienced mentors across every domain."
      searchPlaceholder="Search mentors by name or expertise..."
      emptyIcon={GraduationCap}
      emptyMessage="No mentors found."
      queryKey="mentors"
      queryFn={mentorApi.list}
      getItemKey={(mentor) => mentor._id}
      renderCard={(mentor) => <MentorCard mentor={mentor} />}
    />
  );
}

import { GraduationCap, ShieldCheck, MessageSquare, Tag } from "lucide-react";
import { DirectoryList } from "@/components/shared/DirectoryList";
import { MentorCard } from "@/pages/mentors/MentorCard";
import { mentorApi } from "@/api/mentors";

// Real platform capabilities — no fabricated numbers.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified profiles", color: "text-green-500" },
  { icon: MessageSquare, label: "Direct messaging", color: "text-blue-500" },
  { icon: Tag, label: "Transparent rates", color: "text-purple-500" },
];

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
      hero={{
        badgeIcon: GraduationCap,
        badgeText: (total) => (total > 0 ? `${total.toLocaleString()} mentor${total === 1 ? "" : "s"} available` : "Browse mentors"),
        heroTitle: "Learn from experienced",
        accent: "mentors",
        trustPoints: TRUST_POINTS,
      }}
    />
  );
}

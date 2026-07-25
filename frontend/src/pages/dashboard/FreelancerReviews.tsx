import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { useAuth } from "@/context/AuthContext";

export default function FreelancerReviews() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <DashboardLayout role="freelancer" title="Reviews" subtitle="Feedback clients have left on your completed work.">
      <ReviewsSection targetType="user" targetId={user.id} />
    </DashboardLayout>
  );
}

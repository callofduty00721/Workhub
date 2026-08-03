import type { User } from "@/types";

// 10 equally-weighted checks — deliberately simple (presence, not quality) so
// it's predictable to the freelancer filling the form, not a black box.
export function freelancerProfileCompletion(user: User): number {
  const checks = [
    !!user.avatar,
    !!user.headline,
    !!user.bio,
    !!user.location,
    (user.skills?.length ?? 0) > 0,
    (user.hourlyRate ?? 0) > 0,
    (user.portfolioItems?.length ?? 0) > 0,
    !!user.resumeUrl,
    user.kycStatus === "verified",
    !!(user.payoutDetails?.upiId || (user.payoutDetails?.bankAccountNumber && user.payoutDetails?.bankIfsc)),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

// Same idea as freelancerProfileCompletion above, but scoped to the fields a
// job seeker actually fills in — no hourlyRate/portfolio/payout checks.
export function jobSeekerProfileCompletion(user: User): number {
  const checks = [
    !!user.avatar,
    !!user.headline,
    !!user.bio,
    !!user.location,
    !!user.phone,
    (user.skills?.length ?? 0) > 0,
    !!user.resumeUrl,
    !!user.jobSeekerProfile?.desiredRole,
    (user.experience?.length ?? 0) > 0,
    (user.education?.length ?? 0) > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

// Same idea again, scoped to what actually matters for a brand evaluating an
// influencer: niche, platforms with real follower counts, media kit, and a
// portfolio of past work — not resume/hourlyRate fields that don't apply here.
export function influencerProfileCompletion(user: User): number {
  const checks = [
    !!user.avatar,
    !!user.headline,
    !!user.bio,
    !!user.location,
    !!user.influencerProfile?.niche,
    (user.influencerProfile?.platforms?.length ?? 0) > 0,
    (user.influencerProfile?.platforms ?? []).some((p) => (p.followers ?? 0) > 0),
    (user.influencerProfile?.avgEngagementRate ?? 0) > 0,
    !!user.influencerProfile?.mediaKitUrl,
    (user.portfolioItems?.length ?? 0) > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

// A narrower, resume-specific score — only signals that make a resume itself
// stronger (not the whole profile): presence, skills breadth, and a work
// history to back it up. Weighted, not just a presence count, since a
// resume with zero skills/experience listed is meaningfully weaker.
export function resumeScore(user: User): number {
  if (!user.resumeUrl) return 0;
  const skillsPoints = Math.min(user.skills?.length ?? 0, 6) * 5; // up to 30
  const experiencePoints = Math.min(user.experience?.length ?? 0, 2) * 10; // up to 20
  const headlinePoints = user.headline ? 10 : 0;
  return Math.min(100, 40 + skillsPoints + experiencePoints + headlinePoints);
}

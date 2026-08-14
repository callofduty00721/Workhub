import type { User } from "@/types";

interface FieldCheck {
  label: string;
  done: boolean;
}

// 10 equally-weighted checks — deliberately simple (presence, not quality) so
// it's predictable to the freelancer filling the form, not a black box.
// Labeled so a caller (DashboardLayout's top banner) can name exactly what's
// missing instead of just showing a percentage.
function freelancerChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "skills", done: (user.skills?.length ?? 0) > 0 },
    { label: "hourly rate", done: (user.hourlyRate ?? 0) > 0 },
    { label: "portfolio", done: (user.portfolioItems?.length ?? 0) > 0 },
    { label: "KYC verification", done: user.kycStatus === "verified" },
    {
      label: "payout details",
      done: !!(user.payoutDetails?.upiId || (user.payoutDetails?.bankAccountNumber && user.payoutDetails?.bankIfsc)),
    },
  ];
}

// Same idea as freelancerChecks above, but scoped to the fields a job seeker
// actually fills in — no hourlyRate/portfolio/payout checks.
function jobSeekerChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "phone number", done: !!user.phone },
    { label: "skills", done: (user.skills?.length ?? 0) > 0 },
    { label: "resume", done: !!user.resumeUrl },
    { label: "desired role", done: !!user.jobSeekerProfile?.desiredRole },
    { label: "experience", done: (user.experience?.length ?? 0) > 0 },
    { label: "education", done: (user.education?.length ?? 0) > 0 },
  ];
}

// Same idea again, scoped to what actually matters for a brand evaluating an
// influencer: niche, platforms with real follower counts, media kit, and a
// portfolio of past work — not resume/hourlyRate fields that don't apply here.
function influencerChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "niche", done: !!user.influencerProfile?.niche },
    { label: "platforms", done: (user.influencerProfile?.platforms?.length ?? 0) > 0 },
    { label: "follower counts", done: (user.influencerProfile?.platforms ?? []).some((p) => (p.followers ?? 0) > 0) },
    { label: "media kit", done: !!user.influencerProfile?.mediaKitUrl },
    { label: "portfolio", done: (user.portfolioItems?.length ?? 0) > 0 },
  ];
}

// Founder — real fields from FounderDetailsSection/ExperienceEducationSection
// (see EditProfile.tsx): stage, industries, skills, work/education history,
// LinkedIn, achievements.
function founderChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "industries", done: (user.industries?.length ?? 0) > 0 },
    { label: "skills & expertise", done: (user.skills?.length ?? 0) > 0 },
    { label: "experience", done: (user.experience?.length ?? 0) > 0 },
    { label: "education", done: (user.education?.length ?? 0) > 0 },
    { label: "LinkedIn", done: !!user.linkedIn },
    { label: "achievements", done: (user.achievements?.length ?? 0) > 0 },
  ];
}

// Investor — real fields from InvestorDetailsSection: focus, ticket size,
// portfolio, fund, preferred stages, LinkedIn.
function investorChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "investment focus", done: (user.investmentFocus?.length ?? 0) > 0 },
    { label: "ticket size", done: (user.ticketSizeMin ?? 0) > 0 || (user.ticketSizeMax ?? 0) > 0 },
    { label: "portfolio companies", done: (user.portfolioCompanyCount ?? 0) > 0 },
    { label: "preferred stages", done: (user.preferredStages?.length ?? 0) > 0 },
    { label: "LinkedIn", done: !!user.linkedIn },
  ];
}

// Mentor — real fields from MentorDetailsSection. sessionRate is
// deliberately excluded: 0 is a real, intentional "free" value there, not
// "unset", so it can't be used as a presence check.
function mentorChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "areas of expertise", done: (user.expertise?.length ?? 0) > 0 },
    { label: "session format", done: !!user.sessionFormat },
    { label: "weekly availability", done: (user.hoursPerWeekAvailable ?? 0) > 0 },
    { label: "working days", done: (user.workingDays?.length ?? 0) > 0 },
    { label: "LinkedIn", done: !!user.linkedIn },
  ];
}

// Partner — real fields from PartnerDetailsSection.
function partnerChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "organization name", done: !!user.organizationName },
    { label: "partner type", done: !!user.partnerType },
    { label: "program details", done: !!user.programDetails },
    { label: "website", done: !!user.socialLinks?.website },
    { label: "application link", done: !!user.applicationLink },
  ];
}

// Client & Employer — same fields (CompanyDetailsSection), both are
// "hiring" category roles that post to the marketplace/job board.
function companyChecks(user: User): FieldCheck[] {
  return [
    { label: "profile photo", done: !!user.avatar },
    { label: "headline", done: !!user.headline },
    { label: "bio", done: !!user.bio },
    { label: "location", done: !!user.location },
    { label: "company name", done: !!user.companyName },
    { label: "company size", done: !!user.companySize },
    { label: "industries", done: (user.industries?.length ?? 0) > 0 },
    { label: "website", done: !!user.socialLinks?.website },
    { label: "company registration number", done: !!user.companyRegistrationNumber },
  ];
}

const CHECKS_BY_ROLE: Partial<Record<User["role"] & string, (user: User) => FieldCheck[]>> = {
  freelancer: freelancerChecks,
  job_seeker: jobSeekerChecks,
  influencer: influencerChecks,
  founder: founderChecks,
  investor: investorChecks,
  mentor: mentorChecks,
  partner: partnerChecks,
  client: companyChecks,
  employer: companyChecks,
};

function scoreFrom(checks: FieldCheck[]): number {
  return Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
}

export function freelancerProfileCompletion(user: User): number {
  return scoreFrom(freelancerChecks(user));
}

export function jobSeekerProfileCompletion(user: User): number {
  return scoreFrom(jobSeekerChecks(user));
}

export function influencerProfileCompletion(user: User): number {
  return scoreFrom(influencerChecks(user));
}

// Labeled gaps for whichever role has a real completion scorer — every role
// except super_admin has one (admin accounts have no public-facing profile
// to complete), so the DashboardLayout banner covers all of them.
export function missingProfileFields(user: User): FieldCheck[] {
  const checksFn = user.role ? CHECKS_BY_ROLE[user.role] : undefined;
  if (!checksFn) return [];
  return checksFn(user).filter((c) => !c.done);
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

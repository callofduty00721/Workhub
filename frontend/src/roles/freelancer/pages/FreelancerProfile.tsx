import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Star,
  Briefcase,
  MessageSquare,
  BadgeCheck,
  Share2,
  Clock,
  Wallet,
  CheckCircle2,
  Users,
  Timer,
  GraduationCap,
  Award,
  Building2,
  FileText,
  Download,
  ShieldCheck,
  Mail,
  Linkedin,
  Github,
  Twitter,
  Globe,
  Crown,
  Heart,
  Pencil,
  Phone,
  ScanFace,
  Home as HomeIcon,
  Landmark,
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { GigListCard } from "@/pages/gigs/GigListCard";
import { DirectHireModal } from "@/roles/freelancer/components/DirectHireModal";
import { PortfolioGrid } from "@/components/shared/PortfolioGrid";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { freelancerApi } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName, cn } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";
import { usePageMeta } from "@/lib/usePageMeta";
import { getSkillIcon } from "@/lib/skillIcons";

function relativeTime(iso?: string) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 5) return "Online now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const BIO_PREVIEW_LENGTH = 240;

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
      <h2 className="mb-3 text-base font-bold text-[#111111]">
        {title}
        {count !== undefined && <span className="ml-1 font-medium text-[#9CA3AF]">({count})</span>}
      </h2>
      {children}
    </section>
  );
}

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const toneClass =
    tone === "success"
      ? "bg-[#ECFDF3] text-[#16A34A]"
      : tone === "warning"
        ? "bg-[#FFF7ED] text-[#B45309]"
        : "bg-[#F1F3EF] text-[#4B5563]";
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", toneClass)}>{children}</span>;
}

export default function FreelancerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [bioExpanded, setBioExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["freelancers", id],
    queryFn: () => freelancerApi.getProfile(id),
    enabled: !!id,
  });

  usePageMeta(
    data ? `${data.freelancer.name} — ${data.freelancer.headline || "Freelancer"}` : "Freelancer Profile",
    data ? `Hire ${data.freelancer.name} on GrowHive. ${data.freelancer.headline || ""}`.trim() : undefined
  );

  const followMutation = useMutation({
    mutationFn: () => freelancerApi.toggleFollow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["freelancers", id] }),
  });

  const [hireModalOpen, setHireModalOpen] = useState(false);

  const messageMutation = useMutation({
    mutationFn: (prefill?: string) => chatApi.getOrCreateConversation(id).then((conversation) => ({ conversation, prefill })),
    onSuccess: ({ conversation, prefill }) => {
      const params = new URLSearchParams({ c: conversation._id });
      if (prefill) params.set("text", prefill);
      navigate(`/dashboard/messages?${params.toString()}`);
    },
  });

  if (isLoading) {
    return (
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-56 w-full rounded-[20px] bg-[#EDEFEA]" />
          <Skeleton className="h-24 w-full rounded-[20px] bg-[#EDEFEA]" />
          <Skeleton className="h-64 w-full rounded-[20px] bg-[#EDEFEA]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Freelancer not found</p>
        <Link
          to="/freelancers"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const { freelancer, services, stats, verifiedSkills } = data;
  const isOwnProfile = user?.id === freelancer._id;
  const idVerified = freelancer.kycStatus === "verified";
  const country = freelancer.location?.split(",").map((s) => s.trim()).filter(Boolean).pop();

  const completionChecklist: { label: string; done: boolean }[] = [
    { label: "Basic Information", done: !!(freelancer.headline && freelancer.location) },
    { label: "About Me", done: !!freelancer.bio },
    { label: "Skills", done: (freelancer.skills?.length ?? 0) > 0 },
    { label: "Experience", done: (freelancer.experience?.length ?? 0) > 0 },
    { label: "Education", done: (freelancer.education?.length ?? 0) > 0 },
    { label: "Certificates", done: (freelancer.achievements?.length ?? 0) > 0 },
    { label: "Portfolio", done: (freelancer.portfolioItems?.length ?? 0) > 0 },
    { label: "Identity Verification", done: idVerified },
  ];
  const completionPercent = Math.round((completionChecklist.filter((c) => c.done).length / completionChecklist.length) * 100);

  const availableFor = [
    freelancer.hourlyRate > 0 && "Hourly Projects",
    services.length > 0 && "Gig Orders",
    (freelancer.portfolioItems?.length ?? 0) > 0 && "Fixed Projects",
  ].filter(Boolean) as string[];

  const socialEntries = [
    freelancer.linkedIn && { icon: Linkedin, href: freelancer.linkedIn, label: "LinkedIn" },
    freelancer.socialLinks?.github && { icon: Github, href: freelancer.socialLinks.github, label: "GitHub" },
    freelancer.socialLinks?.twitter && { icon: Twitter, href: freelancer.socialLinks.twitter, label: "Twitter" },
    freelancer.socialLinks?.website && { icon: Globe, href: freelancer.socialLinks.website, label: "Website" },
  ].filter(Boolean) as { icon: typeof Linkedin; href: string; label: string }[];

  const canSeeEarnings = isOwnProfile || user?.role === "super_admin";

  const statCards = [
    ...(canSeeEarnings ? [{ icon: Wallet, label: "Total Earnings", value: formatCurrency(stats.totalEarnings) }] : []),
    { icon: CheckCircle2, label: "Jobs Completed", value: String(stats.jobsCompleted) },
    { icon: Timer, label: "Total Hours", value: `${freelancer.totalHoursWorked ?? 0}+` },
    { icon: Users, label: "Repeat Clients", value: `${stats.repeatClientsPercent}%` },
    { icon: Briefcase, label: "On-Time Delivery", value: `${freelancer.onTimeDeliveryPercent ?? 0}%` },
    { icon: Clock, label: "Response Time", value: freelancer.responseTimeLabel || "—" },
  ];

  const verifications = [
    { icon: Mail, label: "Email Verified", done: freelancer.isEmailVerified },
    { icon: ShieldCheck, label: "ID Verified", done: idVerified },
    { icon: Phone, label: "Mobile Verified", done: freelancer.isPhoneVerified },
    { icon: ScanFace, label: "Face Verified", done: freelancer.faceVerificationStatus === "verified" },
    { icon: HomeIcon, label: "Address Verified", done: freelancer.addressVerificationStatus === "verified" },
    { icon: Landmark, label: "Bank Verified", done: freelancer.bankVerificationStatus === "verified" },
    { icon: CheckCircle2, label: "Profile Complete", done: completionPercent === 100 },
  ];

  return (
    <div className="bg-[#F7F8F5] pb-10">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/freelancers" className="hover:text-[#111111]">
            Freelancers
          </Link>{" "}
          / <span className="text-[#6B7280]">{freelancer.name}</span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back
        </button>

        {/* Header */}
        <div className="mt-4 overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white">
          <div className="relative h-24 overflow-hidden sm:h-32">
            {freelancer.coverImage ? (
              <img src={freelancer.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#F1FFD6] to-[#F7F8F5]" />
            )}
          </div>
          <div className="relative px-6 pb-6 pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="-mt-10 h-24 w-24 shrink-0 border-4 border-white sm:-mt-12">
                  <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                  <AvatarFallback className="bg-[#111111] text-xl font-bold text-white">{initialsFromName(freelancer.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h1 className="text-xl font-extrabold text-[#111111]">{freelancer.name}</h1>
                    {idVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-[#16A34A]" />}
                    {stats.level === "top_rated" && (
                      <Chip tone="warning">
                        <Crown className="h-3 w-3" /> Top Rated
                      </Chip>
                    )}
                    {stats.level === "level_1" && (
                      <Chip>
                        <Award className="h-3 w-3" /> Level 1
                      </Chip>
                    )}
                    {freelancer.company && (
                      <Chip>
                        <Users className="h-3 w-3" /> {freelancer.company.name}
                      </Chip>
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280]">{freelancer.headline || "Freelancer"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                    {freelancer.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {freelancer.location}
                      </span>
                    )}
                    {country && (
                      <span className="flex items-center gap-1 rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10.5px]">
                        <Globe className="h-3 w-3" /> {country}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {freelancer.rating || "0.0"}{" "}
                      {freelancer.reviewCount > 0 && `(${freelancer.reviewCount} reviews)`}
                    </span>
                    <span className="flex items-center gap-1 text-[#16A34A]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {stats.jobSuccessPercent}% Job Success
                    </span>
                    {!!freelancer.followersCount && (
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> {freelancer.followersCount} Followers
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!isOwnProfile && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (user ? setHireModalOpen(true) : navigate("/login"))}
                    className="rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
                  >
                    Hire Me
                  </button>
                  <button
                    type="button"
                    onClick={() => (user ? messageMutation.mutate(undefined) : navigate("/login"))}
                    disabled={messageMutation.isPending}
                    className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4" /> Message
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      user
                        ? messageMutation.mutate(`Hi ${freelancer.name}, I have a project I think you'd be a great fit for. Would you be interested?`)
                        : navigate("/login")
                    }
                    disabled={messageMutation.isPending}
                    className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-50"
                  >
                    Invite to Project
                  </button>
                  <button
                    type="button"
                    disabled={followMutation.isPending}
                    onClick={() => (user ? followMutation.mutate() : navigate("/login"))}
                    title={freelancer.isFollowing ? "Unfollow" : "Follow"}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111111] transition-colors hover:bg-[#F1F3EF]"
                  >
                    <Heart className={cn("h-4 w-4", freelancer.isFollowing && "fill-[#EF4444] text-[#EF4444]")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F1F3EF] hover:text-[#111111]"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              {isOwnProfile && (
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-1.5 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
                  >
                    <Pencil className="h-4 w-4" /> Edit Profile
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {freelancer.category && <Chip>{freelancer.category}</Chip>}
              {freelancer.subCategory && (
                <span className="inline-flex items-center rounded-full border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
                  {freelancer.subCategory}
                </span>
              )}
              <Chip tone={freelancer.availabilityStatus === "busy" ? "warning" : "success"}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {freelancer.availabilityStatus === "busy" ? "Busy" : "Available"}
              </Chip>
              {freelancer.skills.map((skill) => {
                const verified = verifiedSkills.some((v) => v.skill.toLowerCase() === skill.toLowerCase());
                const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
                return (
                  <span
                    key={skill}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      verified ? "bg-[#ECFDF3] text-[#16A34A]" : "border border-[#E5E7EB] text-[#4B5563]"
                    )}
                  >
                    {brand && <SkillIcon className="h-3.5 w-3.5 shrink-0" style={{ color }} />}
                    {verified && <BadgeCheck className="h-3 w-3" />}
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats bar — exact column count (5 or 6, matching the actual card
        count) with no wrapping from sm upward. flex-wrap was tried here but
        at some window widths / browser zoom levels the last card wraps onto
        its own row alone, leaving dead space beside or below it — a fixed
        column grid can't do that at any width. */}
        <div className={`mt-6 grid grid-cols-2 gap-4 ${statCards.length === 6 ? "sm:grid-cols-6" : "sm:grid-cols-5"}`}>
          {statCards.map((s) => (
            <div key={s.label} className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 transition-colors hover:border-[#B6FF00]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F3EF] text-[#111111]">
                <s.icon className="h-4 w-4" />
              </div>
              <p className="mt-2.5 text-base font-bold text-[#111111]">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            {freelancer.videoIntro && (
              <Section title="Video Introduction">
                <video src={freelancer.videoIntro} controls className="max-h-96 w-full rounded-xl border border-[#E5E7EB]" />
              </Section>
            )}

            {freelancer.bio && (() => {
              const bioIsLong = freelancer.bio.length > BIO_PREVIEW_LENGTH;
              const bioText = !bioIsLong || bioExpanded ? freelancer.bio : `${freelancer.bio.slice(0, BIO_PREVIEW_LENGTH).trimEnd()}…`;
              return (
                <Section title="About Me">
                  <p className="text-[13.5px] leading-[1.7] text-[#4B5563]" dangerouslySetInnerHTML={{ __html: renderBioHtml(bioText) }} />
                  {bioIsLong && (
                    <button type="button" onClick={() => setBioExpanded((v) => !v)} className="mt-1.5 text-xs font-semibold text-[#111111] hover:underline">
                      {bioExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                  <div className="mt-4 grid gap-3 border-t border-[#F1F3EF] pt-4 text-xs text-[#6B7280] sm:grid-cols-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {freelancer.location || "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Member since{" "}
                      {freelancer.createdAt ? new Date(freelancer.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5" /> Avg Response {freelancer.responseTimeLabel || "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {freelancer.languages?.length ? freelancer.languages.join(", ") : "—"}
                    </span>
                  </div>
                </Section>
              );
            })()}

            <Section title="Skills">
              {freelancer.skills.length === 0 ? (
                <EmptyState text="No skills added yet." />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {freelancer.skills.map((skill) => {
                    const verified = verifiedSkills.some((v) => v.skill.toLowerCase() === skill.toLowerCase());
                    const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
                    return (
                      <span
                        key={skill}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                          verified ? "bg-[#ECFDF3] text-[#16A34A]" : "border border-[#E5E7EB] text-[#4B5563]"
                        )}
                      >
                        {brand ? (
                          <SkillIcon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                        ) : (
                          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#111111]">
                            <SkillIcon className="h-2.5 w-2.5" style={{ color }} />
                          </span>
                        )}
                        {verified && <BadgeCheck className="h-3 w-3" />}
                        {skill}
                      </span>
                    );
                  })}
                </div>
              )}
            </Section>

            <Section title="Portfolio" count={freelancer.portfolioItems?.length ?? 0}>
              {(freelancer.portfolioItems?.length ?? 0) === 0 ? <EmptyState text="No portfolio items added yet." /> : <PortfolioGrid items={freelancer.portfolioItems ?? []} />}
            </Section>

            <Section title="My Gigs" count={services.length}>
              {services.length === 0 ? (
                <EmptyState text="No active services listed yet." />
              ) : (
                <div className="flex flex-col gap-4">
                  {services.map((s) => (
                    <GigListCard key={s._id} service={s} />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Recent Reviews" count={freelancer.reviewCount}>
              <ReviewsSection targetType="user" targetId={freelancer._id} />
            </Section>

            <Section title="Experience">
              {(freelancer.experience?.length ?? 0) === 0 ? (
                <EmptyState text="No work experience added yet." />
              ) : (
                <div className="space-y-5">
                  {freelancer.experience!.map((exp, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F3EF] text-[#111111]">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#111111]">{exp.title}</p>
                        <p className="text-xs text-[#6B7280]">
                          {exp.company}
                          {exp.location && ` · ${exp.location}`}
                        </p>
                        {(exp.startLabel || exp.endLabel) && (
                          <p className="text-[11px] text-[#9CA3AF]">
                            {exp.startLabel} {exp.startLabel && exp.endLabel && "–"} {exp.endLabel}
                          </p>
                        )}
                        {exp.description && <p className="mt-1 text-xs text-[#4B5563]">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Education">
              {(freelancer.education?.length ?? 0) === 0 ? (
                <EmptyState text="No education added yet." />
              ) : (
                <div className="space-y-5">
                  {freelancer.education!.map((edu, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F3EF] text-[#111111]">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#111111]">{edu.degree}</p>
                        <p className="text-xs text-[#6B7280]">{edu.institution}</p>
                        {(edu.startLabel || edu.endLabel) && (
                          <p className="text-[11px] text-[#9CA3AF]">
                            {edu.startLabel} {edu.startLabel && edu.endLabel && "–"} {edu.endLabel}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Certifications">
              {(freelancer.achievements?.length ?? 0) === 0 ? (
                <EmptyState text="No certifications added yet." />
              ) : (
                <div className="space-y-4">
                  {freelancer.achievements!.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-[#111111]">
                          {a.title}
                          {a.dateLabel && <span className="text-xs text-[#9CA3AF]"> — {a.dateLabel}</span>}
                        </p>
                        {a.description && <p className="text-xs text-[#6B7280]">{a.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {freelancer.hourlyRate > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
                <p className="text-xs text-[#9CA3AF]">Hourly Rate</p>
                <p className="text-lg font-extrabold text-[#111111]">{formatCurrency(freelancer.hourlyRate)}/hr</p>
              </div>
            )}

            <div className="space-y-3 rounded-[20px] border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111111]">Availability</h3>
                <Chip tone={freelancer.availabilityStatus === "busy" ? "warning" : "success"}>
                  {freelancer.availabilityStatus === "busy" ? "Busy" : "Available"}
                </Chip>
              </div>
              {!!freelancer.hoursPerWeekAvailable && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA3AF]">Hours / week</span>
                  <span className="font-semibold text-[#111111]">{freelancer.hoursPerWeekAvailable} hrs/week</span>
                </div>
              )}
              {!!freelancer.workingHours && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA3AF]">Working hours</span>
                  <span className="font-semibold text-[#111111]">{freelancer.workingHours}</span>
                </div>
              )}
              {(freelancer.workingDays?.length ?? 0) > 0 && (
                <div className="text-xs">
                  <p className="text-[#9CA3AF]">Working days</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {freelancer.workingDays!.map((day) => (
                      <span key={day} className="rounded-full bg-[#F1F3EF] px-2 py-0.5 text-[10.5px] font-semibold text-[#4B5563]">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {availableFor.length > 0 && (
                <div>
                  <p className="text-xs text-[#9CA3AF]">Available for</p>
                  <ul className="mt-1 space-y-0.5">
                    {availableFor.map((label) => (
                      <li key={label} className="text-xs text-[#4B5563]">
                        · {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[#F1F3EF] pt-3 text-xs">
                <span className="text-[#9CA3AF]">Response Time</span>
                <span className="font-semibold text-[#111111]">{freelancer.responseTimeLabel || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9CA3AF]">Last Active</span>
                <span className="font-semibold text-[#16A34A]">{relativeTime(freelancer.lastActiveAt)}</span>
              </div>
            </div>

            {isOwnProfile && (
              <div className="space-y-3 rounded-[20px] border border-[#E5E7EB] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111111]">Profile Completion</h3>
                  <span className="text-sm font-extrabold text-[#111111]">{completionPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F3EF]">
                  <div className="h-full rounded-full bg-[#B6FF00]" style={{ width: `${completionPercent}%` }} />
                </div>
                <ul className="space-y-1.5">
                  {completionChecklist.map((c) => (
                    <li key={c.label} className="flex items-center justify-between text-xs">
                      <span className={c.done ? "text-[#111111]" : "text-[#9CA3AF]"}>{c.label}</span>
                      <CheckCircle2 className={cn("h-3.5 w-3.5", c.done ? "text-[#16A34A]" : "text-[#E5E7EB]")} />
                    </li>
                  ))}
                </ul>
                {completionPercent < 100 && (
                  <Link
                    to="/dashboard/profile"
                    className="block rounded-full border border-[#E5E7EB] bg-white py-2 text-center text-xs font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
                  >
                    Complete Your Profile
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-2.5 rounded-[20px] border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-bold text-[#111111]">Verified</h3>
              {verifications.map((v) => (
                <div key={v.label} className="flex items-center gap-2 text-xs">
                  <v.icon className={cn("h-3.5 w-3.5", v.done ? "text-[#16A34A]" : "text-[#D1D5DB]")} />
                  <span className={v.done ? "text-[#111111]" : "text-[#9CA3AF]"}>{v.label}</span>
                </div>
              ))}
            </div>

            {socialEntries.length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
                <h3 className="mb-3 text-sm font-bold text-[#111111]">Social Links</h3>
                <div className="flex gap-2">
                  {socialEntries.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      title={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F3EF] text-[#4B5563] transition-colors hover:bg-[#E5E7EB]"
                    >
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {freelancer.resumeUrl && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
                <h3 className="mb-3 text-sm font-bold text-[#111111]">Resume</h3>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#111111]">{freelancer.name.replace(/\s+/g, "_")}_Resume.pdf</p>
                      {freelancer.resumeUpdatedAt && <p className="text-[10px] text-[#9CA3AF]">Updated {new Date(freelancer.resumeUpdatedAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <a href={freelancer.resumeUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[#6B7280] hover:text-[#111111]">
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DirectHireModal freelancerId={freelancer._id} freelancerName={freelancer.name} open={hireModalOpen} onOpenChange={setHireModalOpen} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#E5E7EB] py-12 text-center">
      <p className="text-sm text-[#9CA3AF]">{text}</p>
    </div>
  );
}

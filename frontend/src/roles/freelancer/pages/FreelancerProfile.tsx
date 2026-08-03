import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
  Home,
  Landmark,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard } from "@/components/gigs/ServiceCard";
import { DirectHireModal } from "@/roles/freelancer/components/DirectHireModal";
import { HorizontalSlider } from "@/components/shared/HorizontalSlider";
import { PortfolioGrid } from "@/components/shared/PortfolioGrid";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { freelancerApi } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName, cn } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// Every section card below shares this treatment — fades/slides in once
// scrolled into view, rather than one big animation firing all at once.
function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-[22px] border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <h3 className="mb-3 text-base font-bold text-neutral-900">
        {title}
        {count !== undefined && <span className="ml-1 font-medium text-neutral-400">({count})</span>}
      </h3>
      {children}
    </motion.div>
  );
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
      <div className="container space-y-4 py-10">
        <Skeleton className="h-56 w-full rounded-[22px]" />
        <Skeleton className="h-24 w-full rounded-[22px]" />
        <Skeleton className="h-64 w-full rounded-[22px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Freelancer not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/freelancers">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const { freelancer, services, stats, verifiedSkills } = data;
  const isOwnProfile = user?.id === freelancer._id;
  const idVerified = freelancer.kycStatus === "verified";
  // `location` is saved as "City, State, Country" (EditProfile.tsx) — country
  // is always the last comma-separated segment, so no separate DB field needed.
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

  // Earnings are private financial data — only the freelancer viewing their
  // own profile, or an admin, sees this card; other visitors get the rest of
  // the stats. The backend also strips `stats.totalEarnings` for everyone
  // else, so this isn't just a frontend-only hide.
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
    { icon: Home, label: "Address Verified", done: freelancer.addressVerificationStatus === "verified" },
    { icon: Landmark, label: "Bank Verified", done: freelancer.bankVerificationStatus === "verified" },
    { icon: CheckCircle2, label: "Profile Complete", done: completionPercent === 100 },
  ];

  return (
    <div className="container py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      >
        <div className="relative h-28 overflow-hidden sm:h-36">
          {freelancer.coverImage ? (
            <img src={freelancer.coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary via-secondary to-primary" />
          )}
        </div>
        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
              >
                <Avatar className="-mt-12 h-24 w-24 border-4 border-white shadow-lg sm:-mt-14">
                  <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                  <AvatarFallback className="bg-primary text-xl font-bold text-white">{initialsFromName(freelancer.name)}</AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-bold text-neutral-900">{freelancer.name}</h1>
                  {idVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />}
                  {stats.level === "top_rated" && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Top Rated
                    </Badge>
                  )}
                  {stats.level === "level_1" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Award className="h-3 w-3" /> Level 1
                    </Badge>
                  )}
                  {freelancer.company && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {freelancer.company.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-500">{freelancer.headline || "Freelancer"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  {freelancer.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {freelancer.location}
                    </span>
                  )}
                  {country && (
                    <Badge variant="outline" className="flex items-center gap-1 text-[10.5px]">
                      <Globe className="h-3 w-3" /> {country}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {freelancer.rating || "0.0"}{" "}
                    {freelancer.reviewCount > 0 && `(${freelancer.reviewCount} reviews)`}
                  </span>
                  <span className="flex items-center gap-1 text-success">
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
                <Button variant="gradient" onClick={() => (user ? setHireModalOpen(true) : navigate("/login"))}>
                  Hire Me
                </Button>
                <Button variant="outline" onClick={() => (user ? messageMutation.mutate(undefined) : navigate("/login"))} disabled={messageMutation.isPending}>
                  <MessageSquare className="h-4 w-4" /> Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    user
                      ? messageMutation.mutate(`Hi ${freelancer.name}, I have a project I think you'd be a great fit for. Would you be interested?`)
                      : navigate("/login")
                  }
                  disabled={messageMutation.isPending}
                >
                  Invite to Project
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={followMutation.isPending}
                  onClick={() => (user ? followMutation.mutate() : navigate("/login"))}
                  title={freelancer.isFollowing ? "Unfollow" : "Follow"}
                >
                  <Heart className={cn("h-4 w-4", freelancer.isFollowing && "fill-danger text-danger")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            {isOwnProfile && (
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="gradient" asChild>
                  <Link to="/dashboard/profile">
                    <Pencil className="h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {freelancer.category && <Badge variant="secondary">{freelancer.category}</Badge>}
            {freelancer.subCategory && <Badge variant="outline">{freelancer.subCategory}</Badge>}
            <Badge variant={freelancer.availabilityStatus === "busy" ? "warning" : "success"} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {freelancer.availabilityStatus === "busy" ? "Busy" : "Available"}
            </Badge>
            {freelancer.skills.map((skill) => {
              const verified = verifiedSkills.some((v) => v.skill.toLowerCase() === skill.toLowerCase());
              const { icon: SkillIcon, color, brand } = getSkillIcon(skill);
              return (
                <Badge key={skill} variant={verified ? "success" : "outline"} className="flex items-center gap-1">
                  {brand && <SkillIcon className="h-4 w-4 shrink-0" style={{ color }} />}
                  {verified && <BadgeCheck className="h-3 w-3" />}
                  {skill}
                </Badge>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={stagger}
        className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-[0_16px_32px_-20px_rgba(250,131,46,0.3)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-2.5 text-base font-bold text-neutral-900">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-400">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {freelancer.videoIntro && (
            <Section title="Video Introduction">
              <video src={freelancer.videoIntro} controls className="max-h-96 w-full rounded-xl border border-neutral-200" />
            </Section>
          )}

          {freelancer.bio && (() => {
            const bioIsLong = freelancer.bio.length > BIO_PREVIEW_LENGTH;
            const bioText = !bioIsLong || bioExpanded ? freelancer.bio : `${freelancer.bio.slice(0, BIO_PREVIEW_LENGTH).trimEnd()}…`;
            return (
              <Section title="About Me">
                <p className="text-sm leading-relaxed text-neutral-700" dangerouslySetInnerHTML={{ __html: renderBioHtml(bioText) }} />
                {bioIsLong && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded((v) => !v)}
                    className="mt-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    {bioExpanded ? "Show less" : "Read more"}
                  </button>
                )}
                <div className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 text-xs text-neutral-500 sm:grid-cols-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {freelancer.location || "—"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Member since {freelancer.createdAt ? new Date(freelancer.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}
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
                    <Badge key={skill} variant={verified ? "success" : "outline"} className="flex items-center gap-1">
                      {brand ? (
                        <SkillIcon className="h-4 w-4 shrink-0" style={{ color }} />
                      ) : (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-900">
                          <SkillIcon className="h-2.5 w-2.5" style={{ color }} />
                        </span>
                      )}
                      {verified && <BadgeCheck className="h-3 w-3" />}
                      {skill}
                    </Badge>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="Portfolio" count={freelancer.portfolioItems?.length ?? 0}>
            {(freelancer.portfolioItems?.length ?? 0) === 0 ? (
              <EmptyState text="No portfolio items added yet." />
            ) : (
              <PortfolioGrid items={freelancer.portfolioItems ?? []} />
            )}
          </Section>

          <Section title="My Gigs" count={services.length}>
            {services.length === 0 ? (
              <EmptyState text="No active services listed yet." />
            ) : (
              <HorizontalSlider itemClassName="w-72">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </HorizontalSlider>
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
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{exp.title}</p>
                      <p className="text-xs text-neutral-500">
                        {exp.company}
                        {exp.location && ` · ${exp.location}`}
                      </p>
                      {(exp.startLabel || exp.endLabel) && (
                        <p className="text-[11px] text-neutral-400">
                          {exp.startLabel} {exp.startLabel && exp.endLabel && "–"} {exp.endLabel}
                        </p>
                      )}
                      {exp.description && <p className="mt-1 text-xs text-neutral-600">{exp.description}</p>}
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
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{edu.degree}</p>
                      <p className="text-xs text-neutral-500">{edu.institution}</p>
                      {(edu.startLabel || edu.endLabel) && (
                        <p className="text-[11px] text-neutral-400">
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
                      <p className="text-sm font-medium text-neutral-900">
                        {a.title}
                        {a.dateLabel && <span className="text-xs text-neutral-400"> — {a.dateLabel}</span>}
                      </p>
                      {a.description && <p className="text-xs text-neutral-500">{a.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="space-y-6"
        >
          {freelancer.hourlyRate > 0 && (
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-primary/10 to-secondary/5 p-5"
            >
              <p className="text-xs text-neutral-500">Hourly Rate</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(freelancer.hourlyRate)}/hr</p>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Availability</h3>
              <Badge variant={freelancer.availabilityStatus === "busy" ? "warning" : "success"}>
                {freelancer.availabilityStatus === "busy" ? "Busy" : "Available"}
              </Badge>
            </div>
            {!!freelancer.hoursPerWeekAvailable && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Hours / week</span>
                <span className="font-medium text-neutral-900">{freelancer.hoursPerWeekAvailable} hrs/week</span>
              </div>
            )}
            {!!freelancer.workingHours && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Working hours</span>
                <span className="font-medium text-neutral-900">{freelancer.workingHours}</span>
              </div>
            )}
            {(freelancer.workingDays?.length ?? 0) > 0 && (
              <div className="text-xs">
                <p className="text-neutral-500">Working days</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {freelancer.workingDays!.map((day) => (
                    <span key={day} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] font-semibold text-neutral-700">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {availableFor.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500">Available for</p>
                <ul className="mt-1 space-y-0.5">
                  {availableFor.map((label) => (
                    <li key={label} className="text-xs text-neutral-700">
                      · {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
              <span className="text-neutral-500">Response Time</span>
              <span className="font-medium text-neutral-900">{freelancer.responseTimeLabel || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Last Active</span>
              <span className="font-medium text-success">{relativeTime(freelancer.lastActiveAt)}</span>
            </div>
          </motion.div>

          {isOwnProfile && (
            <motion.div variants={fadeUp} className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Profile Completion</h3>
                <span className="text-sm font-bold text-primary">{completionPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: completionPercent / 100 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
              <ul className="space-y-1.5">
                {completionChecklist.map((c) => (
                  <li key={c.label} className="flex items-center justify-between text-xs">
                    <span className={c.done ? "text-neutral-900" : "text-neutral-400"}>{c.label}</span>
                    <CheckCircle2 className={cn("h-3.5 w-3.5", c.done ? "text-success" : "text-neutral-200")} />
                  </li>
                ))}
              </ul>
              {completionPercent < 100 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/dashboard/profile">Complete Your Profile</Link>
                </Button>
              )}
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="space-y-2.5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h3 className="text-sm font-semibold text-neutral-900">Verified</h3>
            {verifications.map((v) => (
              <div key={v.label} className="flex items-center gap-2 text-xs">
                <v.icon className={cn("h-3.5 w-3.5", v.done ? "text-primary" : "text-neutral-300")} />
                <span className={v.done ? "text-neutral-900" : "text-neutral-400"}>{v.label}</span>
              </div>
            ))}
          </motion.div>

          {socialEntries.length > 0 && (
            <motion.div variants={fadeUp} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Social Links</h3>
              <div className="flex gap-2">
                {socialEntries.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                    title={s.label}
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {freelancer.resumeUrl && (
            <motion.div variants={fadeUp} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Resume</h3>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-neutral-900">{freelancer.name.replace(/\s+/g, "_")}_Resume.pdf</p>
                    {freelancer.resumeUpdatedAt && (
                      <p className="text-[10px] text-neutral-400">Updated {new Date(freelancer.resumeUpdatedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <a href={freelancer.resumeUrl} target="_blank" rel="noreferrer" className="shrink-0 text-primary">
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <DirectHireModal
        freelancerId={freelancer._id}
        freelancerName={freelancer.name}
        open={hireModalOpen}
        onOpenChange={setHireModalOpen}
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-200 py-12 text-center">
      <p className="text-sm text-neutral-500">{text}</p>
    </div>
  );
}

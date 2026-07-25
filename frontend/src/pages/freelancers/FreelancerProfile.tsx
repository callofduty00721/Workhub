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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard } from "@/components/gigs/ServiceCard";
import { DirectHireModal } from "@/components/freelancers/DirectHireModal";
import { HorizontalSlider } from "@/components/shared/HorizontalSlider";
import { PortfolioGrid } from "@/components/shared/PortfolioGrid";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { freelancerApi } from "@/api/freelancers";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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

export default function FreelancerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
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

  return (
    <div className="container py-10">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary via-secondary to-primary sm:h-36" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="-mt-12 h-24 w-24 border-4 border-background shadow-md sm:-mt-14">
                <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                <AvatarFallback className="text-xl">{initialsFromName(freelancer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-bold">{freelancer.name}</h1>
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
                <p className="text-sm text-muted-foreground">{freelancer.headline || "Freelancer"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {freelancer.rating || "New"}{" "}
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
              <div className="flex shrink-0 items-center gap-2">
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
              return (
                <Badge key={skill} variant={verified ? "success" : "outline"} className="flex items-center gap-1">
                  {verified && <BadgeCheck className="h-3 w-3" />}
                  {skill}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: Wallet, label: "Total Earnings", value: formatCurrency(stats.totalEarnings), color: "text-success" },
          { icon: CheckCircle2, label: "Jobs Completed", value: String(stats.jobsCompleted), color: "text-primary" },
          { icon: Timer, label: "Total Hours", value: `${freelancer.totalHoursWorked ?? 0}+`, color: "text-primary" },
          { icon: Users, label: "Repeat Clients", value: `${stats.repeatClientsPercent}%`, color: "text-primary" },
          { icon: Briefcase, label: "On-Time Delivery", value: `${freelancer.onTimeDeliveryPercent ?? 0}%`, color: "text-primary" },
          { icon: Clock, label: "Response Time", value: freelancer.responseTimeLabel || "—", color: "text-primary" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <s.icon className={cn("h-4 w-4", s.color)} />
              <p className="mt-2 text-base font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {freelancer.videoIntro && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-base font-semibold">Video Introduction</h3>
                <video src={freelancer.videoIntro} controls className="max-h-96 w-full rounded-lg border border-border" />
              </CardContent>
            </Card>
          )}

          {freelancer.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About Me</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{freelancer.bio}</p>
                <div className="mt-4 grid gap-3 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-4">
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
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="mb-3 text-base font-semibold">My Services ({services.length})</h3>
            {services.length === 0 ? (
              <EmptyState text="No active services listed yet." />
            ) : (
              <HorizontalSlider itemClassName="w-72">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </HorizontalSlider>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-base font-semibold">Portfolio ({freelancer.portfolioItems?.length ?? 0})</h3>
            {(freelancer.portfolioItems?.length ?? 0) === 0 ? (
              <EmptyState text="No portfolio items added yet." />
            ) : (
              <PortfolioGrid items={freelancer.portfolioItems ?? []} />
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Experience</h3>
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
                        <p className="text-sm font-semibold">{exp.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.company}
                          {exp.location && ` · ${exp.location}`}
                        </p>
                        {(exp.startLabel || exp.endLabel) && (
                          <p className="text-[11px] text-muted-foreground">
                            {exp.startLabel} {exp.startLabel && exp.endLabel && "–"} {exp.endLabel}
                          </p>
                        )}
                        {exp.description && <p className="mt-1 text-xs text-foreground/80">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Education</h3>
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
                        <p className="text-sm font-semibold">{edu.degree}</p>
                        <p className="text-xs text-muted-foreground">{edu.institution}</p>
                        {(edu.startLabel || edu.endLabel) && (
                          <p className="text-[11px] text-muted-foreground">
                            {edu.startLabel} {edu.startLabel && edu.endLabel && "–"} {edu.endLabel}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Certifications</h3>
              {(freelancer.achievements?.length ?? 0) === 0 ? (
                <EmptyState text="No certifications added yet." />
              ) : (
                <div className="space-y-4">
                  {freelancer.achievements!.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Award className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <div>
                        <p className="text-sm font-medium">
                          {a.title}
                          {a.dateLabel && <span className="text-xs text-muted-foreground"> — {a.dateLabel}</span>}
                        </p>
                        {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 text-base font-semibold">Reviews ({freelancer.reviewCount})</h3>
            <ReviewsSection targetType="user" targetId={freelancer._id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {freelancer.hourlyRate > 0 && (
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Hourly Rate</p>
                <p className="text-lg font-bold text-success">{formatCurrency(freelancer.hourlyRate)}/hr</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Availability</h3>
                <Badge variant={freelancer.availabilityStatus === "busy" ? "warning" : "success"}>
                  {freelancer.availabilityStatus === "busy" ? "Busy" : "Available"}
                </Badge>
              </div>
              {!!freelancer.hoursPerWeekAvailable && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Hours / week</span>
                  <span className="font-medium">{freelancer.hoursPerWeekAvailable} hrs/week</span>
                </div>
              )}
              {!!freelancer.workingHours && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Working hours</span>
                  <span className="font-medium">{freelancer.workingHours}</span>
                </div>
              )}
              {(freelancer.workingDays?.length ?? 0) > 0 && (
                <div className="text-xs">
                  <p className="text-muted-foreground">Working days</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {freelancer.workingDays!.map((day) => (
                      <span key={day} className="rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-semibold">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {availableFor.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Available for</p>
                  <ul className="mt-1 space-y-0.5">
                    {availableFor.map((label) => (
                      <li key={label} className="text-xs">
                        · {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-medium">{freelancer.responseTimeLabel || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last Active</span>
                <span className="font-medium text-success">{relativeTime(freelancer.lastActiveAt)}</span>
              </div>
            </CardContent>
          </Card>

          {isOwnProfile && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Profile Completion</h3>
                  <span className="text-sm font-bold text-primary">{completionPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${completionPercent}%` }} />
                </div>
                <ul className="space-y-1.5">
                  {completionChecklist.map((c) => (
                    <li key={c.label} className="flex items-center justify-between text-xs">
                      <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                      <CheckCircle2 className={cn("h-3.5 w-3.5", c.done ? "text-success" : "text-muted-foreground/30")} />
                    </li>
                  ))}
                </ul>
                {completionPercent < 100 && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/dashboard/profile">Complete Your Profile</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-2.5 p-5">
              <h3 className="text-sm font-semibold">Verified</h3>
              <div className="flex items-center gap-2 text-xs">
                <Mail className={cn("h-3.5 w-3.5", freelancer.isEmailVerified ? "text-primary" : "text-muted-foreground/40")} />
                <span className={freelancer.isEmailVerified ? "" : "text-muted-foreground"}>Email Verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className={cn("h-3.5 w-3.5", idVerified ? "text-primary" : "text-muted-foreground/40")} />
                <span className={idVerified ? "" : "text-muted-foreground"}>ID Verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <BadgeCheck className={cn("h-3.5 w-3.5", freelancer.phone ? "text-primary" : "text-muted-foreground/40")} />
                <span className={freelancer.phone ? "" : "text-muted-foreground"}>Phone Added</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className={cn("h-3.5 w-3.5", completionPercent === 100 ? "text-primary" : "text-muted-foreground/40")} />
                <span className={completionPercent === 100 ? "" : "text-muted-foreground"}>Profile Complete</span>
              </div>
            </CardContent>
          </Card>

          {socialEntries.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 text-sm font-semibold">Social Links</h3>
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
              </CardContent>
            </Card>
          )}

          {freelancer.resumeUrl && (
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 text-sm font-semibold">Resume</h3>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{freelancer.name.replace(/\s+/g, "_")}_Resume.pdf</p>
                      {freelancer.resumeUpdatedAt && (
                        <p className="text-[10px] text-muted-foreground">Updated {new Date(freelancer.resumeUpdatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <a href={freelancer.resumeUrl} target="_blank" rel="noreferrer" className="shrink-0 text-primary">
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

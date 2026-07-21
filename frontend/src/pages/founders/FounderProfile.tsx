import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  MessageSquare,
  Loader2,
  ShieldCheck,
  BadgeCheck,
  Rocket,
  UserPlus,
  UserMinus,
  Eye,
  Users,
  Mail,
  CheckCircle2,
  Circle,
  Briefcase,
  MoreHorizontal,
  Link2,
  Check,
  Globe,
  Calendar,
  Clock,
  GraduationCap,
  Trophy,
  Target,
  Github,
  Twitter,
  Linkedin,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { founderApi } from "@/api/founders";
import { chatApi } from "@/api/chat";
import { initialsFromName, formatFundingCompact, formatCompactNumber } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { FounderSummary } from "@/types";

function timeAgo(dateStr?: string) {
  if (!dateStr) return "a while ago";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr!).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function FounderProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: founder, isLoading } = useQuery({
    queryKey: ["founders", id],
    queryFn: () => founderApi.getProfile(id),
    enabled: !!id,
  });

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(id),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const followMutation = useMutation({
    mutationFn: () => founderApi.toggleFollow(id),
    onSuccess: (data) => {
      queryClient.setQueryData<FounderSummary>(["founders", id], (prev) =>
        prev ? { ...prev, isFollowing: data.following, followersCount: data.followersCount } : prev
      );
    },
  });

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!founder) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Founder not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/startups">Back to Startups</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === founder._id;
  const isFounderVerified = founder.startups.some((s) => s.founderVerified);
  const isBusinessVerified = founder.startups.some((s) => s.isVerified);
  const primaryStartup = founder.startups[0];

  const completionChecks = [
    { label: "Basic Information", done: !!founder.avatar && !!founder.headline },
    { label: "About You", done: !!founder.bio },
    { label: "Location", done: !!founder.location },
    { label: "Experience", done: founder.experience.length > 0 },
    { label: "Education", done: founder.education.length > 0 },
    { label: "Skills & Expertise", done: (founder.skills?.length ?? 0) > 0 },
    { label: "At least one Startup", done: founder.startups.length > 0 },
  ];
  const completionPct = Math.round((completionChecks.filter((c) => c.done).length / completionChecks.length) * 100);

  const headerStats = [
    !!founder.yearsOfExperience && { icon: Briefcase, label: "Experience", value: `${founder.yearsOfExperience}+ Years` },
    founder.languages.length > 0 && { icon: Globe, label: "Languages", value: founder.languages.join(", ") },
    {
      icon: Calendar,
      label: "Member Since",
      value: new Date(founder.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
    },
    { icon: Eye, label: "Profile Views", value: formatCompactNumber(founder.stats.viewCount) },
    { icon: Clock, label: "Last Active", value: founder.isOnline ? "Online now" : timeAgo(founder.lastActiveAt) },
  ].filter(Boolean) as { icon: typeof Briefcase; label: string; value: string }[];

  const hasSocialLinks = !!(founder.linkedIn || founder.socialLinks?.twitter || founder.socialLinks?.github || founder.socialLinks?.website);

  return (
    <div className="container space-y-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Header */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background sm:h-28 sm:w-28">
                  <AvatarImage src={founder.avatar} alt={founder.name} />
                  <AvatarFallback className="text-2xl">{initialsFromName(founder.name)}</AvatarFallback>
                </Avatar>
                {founder.isOnline && (
                  <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full border-2 border-background bg-success px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Online
                  </span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="text-xl font-bold">{founder.name}</h1>
                  {isFounderVerified && <BadgeCheck className="h-5 w-5 fill-primary text-background" />}
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {founder.headline || (primaryStartup ? `Founder @ ${primaryStartup.name}` : "Founder")}
                </p>
                {founder.location && (
                  <span className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {founder.location}
                  </span>
                )}
                {founder.roleTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {founder.roleTags.map((tag) => (
                      <Badge key={tag} className="bg-primary/10 text-primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!isOwner && (
              <div className="flex gap-2">
                <Button
                  variant={founder.isFollowing ? "outline" : "gradient"}
                  disabled={!user || followMutation.isPending}
                  onClick={() => (user ? followMutation.mutate() : navigate("/login"))}
                >
                  {followMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : founder.isFollowing ? (
                    <UserMinus className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {founder.isFollowing ? "Following" : "Connect"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!user || messageMutation.isPending}
                  onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
                >
                  {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  Message
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyLink}>
                      {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                      {linkCopied ? "Link copied" : "Copy profile link"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {isBusinessVerified && (
            <Badge className="mt-3 flex w-fit items-center gap-1 bg-primary/10 text-primary">
              <ShieldCheck className="h-3 w-3" /> Business Verified
            </Badge>
          )}

          {founder.bio && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/90">{founder.bio}</p>}

          {headerStats.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4">
              {headerStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-semibold">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-6">
          {(founder.experience.length > 0 ||
            founder.education.length > 0 ||
            !!founder.educationLevel ||
            (founder.skills?.length ?? 0) > 0 ||
            founder.industries.length > 0) && (
            <div className="flex flex-wrap gap-4">
              {founder.experience.length > 0 && (
                <Card className="min-w-[260px] flex-1 basis-72">
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Briefcase className="h-4 w-4 text-primary" /> Experience
                    </h3>
                    <ExperienceTimeline entries={founder.experience} />
                  </CardContent>
                </Card>
              )}

              {(founder.education.length > 0 || founder.educationLevel) && (
                <Card className="min-w-[260px] flex-1 basis-72">
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <GraduationCap className="h-4 w-4 text-primary" /> Education
                    </h3>
                    {founder.education.length > 0 && (
                      <div className="space-y-3">
                        {founder.education.map((edu, i) => (
                          <div key={i}>
                            <p className="text-sm font-medium">{edu.degree}</p>
                            <p className="text-xs text-muted-foreground">{edu.institution}</p>
                            {(edu.startLabel || edu.endLabel) && (
                              <p className="text-[11px] text-muted-foreground">
                                {edu.startLabel} {edu.startLabel && edu.endLabel && "–"} {edu.endLabel}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {founder.educationLevel && <p className="mt-3 text-xs text-muted-foreground">Highest level: {founder.educationLevel}</p>}
                  </CardContent>
                </Card>
              )}

              {((founder.skills?.length ?? 0) > 0 || founder.industries.length > 0) && (
                <Card className="min-w-[260px] flex-1 basis-72">
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-4 w-4 text-primary" /> Skills & Expertise
                    </h3>
                    {(founder.skills?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {founder.skills!.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {founder.industries.length > 0 && (
                      <>
                        <p className="mb-1.5 mt-4 text-xs font-medium text-muted-foreground">Industries</p>
                        <div className="flex flex-wrap gap-1.5">
                          {founder.industries.map((industry) => (
                            <Badge key={industry} variant="outline">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {(founder.startups.length > 0 || founder.achievements.length > 0 || founder.lookingFor.length > 0) && (
            <div className="flex flex-wrap gap-4">
              {founder.startups.length > 0 && (
                <Card className="min-w-[260px] flex-1 basis-72">
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Rocket className="h-4 w-4 text-primary" /> My Startups
                    </h3>
                    <StartupPortfolio startups={founder.startups} />
                  </CardContent>
                </Card>
              )}

              {founder.achievements.length > 0 && (
                <Card className="min-w-[260px] flex-1 basis-72">
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Trophy className="h-4 w-4 text-primary" /> Achievements
                    </h3>
                    <ul className="space-y-2.5">
                      {founder.achievements.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                          <span>
                            {a.title}
                            {a.dateLabel && <span className="text-muted-foreground"> — {a.dateLabel}</span>}
                            {a.description && <span className="block text-xs text-muted-foreground">{a.description}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {founder.lookingFor.length > 0 && (
                <Card className="min-w-[260px] flex-1 basis-72">
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-4 w-4 text-primary" /> Looking For
                    </h3>
                    <ul className="space-y-2">
                      {founder.lookingFor.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" /> {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {founder.recentInvestors.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Investors</h3>
                  <span className="text-xs text-muted-foreground">{founder.stats.investorsCount} confirmed</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {founder.recentInvestors.map((inv) => (
                    <div key={inv._id} className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={inv.investor.avatar} alt={inv.investor.name} />
                        <AvatarFallback className="text-[10px]">{initialsFromName(inv.investor.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{inv.investor.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          Invested {formatFundingCompact(inv.amount)} · {inv.startupName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(founder.bio || founder.dateOfBirth || founder.nationality || founder.educationLevel || founder.location) && (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" /> About Founder
              </h3>
              {founder.bio && <p className="text-sm leading-relaxed text-foreground/90">{founder.bio}</p>}
              {(founder.dateOfBirth || founder.nationality || founder.educationLevel || founder.location) && (
                <div className="mt-4 space-y-2.5 border-t border-border pt-4">
                  {founder.dateOfBirth && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> Date of Birth
                      </span>
                      <span className="font-medium">{new Date(founder.dateOfBirth).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                  {founder.nationality && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" /> Nationality
                      </span>
                      <span className="font-medium">{founder.nationality}</span>
                    </div>
                  )}
                  {founder.educationLevel && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" /> Education Level
                      </span>
                      <span className="font-medium">{founder.educationLevel}</span>
                    </div>
                  )}
                  {founder.location && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </span>
                      <span className="font-medium">{founder.location}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Verify Status</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  {founder.isEmailVerified ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  Email Verified
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {isFounderVerified ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  Identity Verified
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Statistics</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> Followers
                  </span>
                  <span className="font-semibold">{formatCompactNumber(founder.followersCount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> Profile Views
                  </span>
                  <span className="font-semibold">{formatCompactNumber(founder.stats.viewCount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Post Views
                  </span>
                  <span className="font-semibold">{formatCompactNumber(founder.stats.postViews)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Social Links</h3>
              {hasSocialLinks ? (
                <div className="flex flex-wrap gap-2">
                  {founder.linkedIn && (
                    <a
                      href={founder.linkedIn}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {founder.socialLinks?.twitter && (
                    <a
                      href={founder.socialLinks.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-accent"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {founder.socialLinks?.github && (
                    <a
                      href={founder.socialLinks.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-accent"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {founder.socialLinks?.website && (
                    <a
                      href={founder.socialLinks.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isOwner ? "Add LinkedIn, Twitter, GitHub or a website from Edit Profile." : "No social links added."}
                </p>
              )}
            </CardContent>
          </Card>

          {isOwner && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Profile Completion</h3>
                  <span className="text-sm font-bold text-success">{completionPct}%</span>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success transition-all" style={{ width: `${completionPct}%` }} />
                </div>
                <div className="space-y-2">
                  {completionChecks.map((c) => (
                    <div key={c.label} className="flex items-center gap-2 text-xs">
                      {c.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {completionPct < 100 && (
                  <Button variant="outline" size="sm" asChild className="mt-4 w-full">
                    <Link to="/dashboard/profile">Complete your profile</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {!isOwner && (
            <Card>
              <CardContent className="space-y-2.5 p-5">
                <h3 className="mb-1 text-sm font-semibold">Let&apos;s Connect</h3>
                <button
                  onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
                  disabled={!user || messageMutation.isPending}
                  className="flex items-center gap-2 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" /> Send a message
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ExperienceTimeline({ entries }: { entries: import("@/types").ExperienceEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No experience added yet.</p>;
  }
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-3">
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
              <p className="text-sm font-medium">{entry.title}</p>
              <span className="text-[11px] text-muted-foreground">
                {entry.startLabel} {entry.startLabel && "–"} {entry.endLabel || "Present"}
              </span>
            </div>
            <p className="text-xs text-primary">{entry.company}</p>
            {entry.location && <p className="text-[11px] text-muted-foreground">{entry.location}</p>}
            {entry.description && <p className="mt-1 text-xs leading-relaxed text-foreground/90">{entry.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function StartupPortfolio({ startups }: { startups: import("@/types").FounderStartupSummary[] }) {
  if (startups.length === 0) {
    return <p className="text-sm text-muted-foreground">No startups listed yet.</p>;
  }
  return (
    <div className="space-y-4">
      {startups.map((startup) => (
        <div key={startup._id} className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium">{startup.name}</p>
                {startup.isVerified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </div>
              <p className="truncate text-xs text-muted-foreground">{startup.tagline}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Stage</p>
              <p className="font-medium capitalize">{startup.stage.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Industry</p>
              <p className="truncate font-medium">{startup.industry}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Founded</p>
              <p className="font-medium">{new Date(startup.createdAt).getFullYear()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Team Size</p>
              <p className="font-medium">{startup.teamSize}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="mt-3 w-full">
            <Link to={`/startups/${startup._id}`}>View Startup</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

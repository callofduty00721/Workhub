import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Briefcase,
  ClipboardList,
  MessageSquare,
  X,
  Loader2,
  Bookmark,
  Bell,
  CheckCircle2,
  ExternalLink,
  CalendarClock,
  Video,
  Phone,
  MapPin,
  FileText,
  Crown,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { jobApi } from "@/api/jobs";
import { userApi } from "@/api/users";
import { alertApi } from "@/api/alerts";
import { chatApi } from "@/api/chat";
import { notificationApi } from "@/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { jobSeekerProfileCompletion, resumeScore } from "@/lib/profileCompletion";
import { initialsFromName, formatCurrency, timeAgoShort as timeAgo } from "@/lib/utils";
import type { ApplicationStatus, NotificationType } from "@/types";

const STATUS_VARIANT: Record<ApplicationStatus, "default" | "warning" | "success" | "danger"> = {
  applied: "default",
  shortlisted: "warning",
  interview: "warning",
  hired: "success",
  rejected: "danger",
  withdrawn: "danger",
};

const WITHDRAWABLE: ApplicationStatus[] = ["applied", "shortlisted", "interview"];

// Distinct, non-cycled hues per status — kept separate from the app's badge
// tokens (which reuse "warning" for both shortlisted & interview) since a
// donut slice needs every category to be visually distinguishable.
const DONUT_COLORS: Record<ApplicationStatus, string> = {
  applied: "#3b82f6",
  shortlisted: "#f59e0b",
  interview: "#8b5cf6",
  hired: "#22c55e",
  rejected: "#ef4444",
  withdrawn: "#94a3b8",
};

const ACTIVITY_ICON: Partial<Record<NotificationType, typeof Bell>> = {
  job_application: Briefcase,
  application_status: CheckCircle2,
  new_message: MessageSquare,
  system: Bell,
};

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useScrollToHash();

  const { data: applications, isLoading: loadingApplications } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });
  const { data: savedItems } = useQuery({ queryKey: ["saved-items"], queryFn: userApi.getSavedItems });
  const { data: alerts } = useQuery({ queryKey: ["alerts", "mine"], queryFn: alertApi.mine });
  const { data: notifications, isLoading: loadingNotifications } = useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list });
  const { data: categoryCounts, isLoading: loadingCategories } = useQuery({ queryKey: ["jobs", "category-counts"], queryFn: jobApi.categoryCounts });
  const { data: jobsPage, isLoading: loadingJobs } = useQuery({ queryKey: ["jobs", "list", { limit: 20 }], queryFn: () => jobApi.list({ limit: 20 }) });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => jobApi.withdraw(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });

  const messageMutation = useMutation({
    mutationFn: (employerId: string) => chatApi.getOrCreateConversation(employerId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const confirmInterviewMutation = useMutation({
    mutationFn: (applicationId: string) => jobApi.confirmInterview(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });

  const shortlistedCount = (applications ?? []).filter((a) => a.status === "shortlisted" || a.status === "interview").length;
  const savedJobsCount = savedItems?.jobs.length ?? 0;
  const activeAlertsCount = (alerts ?? []).filter((a) => a.isActive).length;

  const profileCompletion = user ? jobSeekerProfileCompletion(user) : 0;
  const score = user ? resumeScore(user) : 0;

  const now = new Date();
  const upcomingInterviews = (applications ?? [])
    .filter((a) => a.interview?.scheduledAt && new Date(a.interview.scheduledAt) > now)
    .sort((a, b) => new Date(a.interview!.scheduledAt!).getTime() - new Date(b.interview!.scheduledAt!).getTime())
    .slice(0, 3);

  const statusCounts = (applications ?? []).reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<ApplicationStatus, number>>
  );
  const donutData = (Object.keys(statusCounts) as ApplicationStatus[])
    .filter((s) => (statusCounts[s] ?? 0) > 0)
    .map((s) => ({ name: s, label: s[0].toUpperCase() + s.slice(1), value: statusCounts[s]!, color: DONUT_COLORS[s] }));

  // Real personalization, not a recommendation engine — open jobs ranked by
  // skill overlap + location match against this user's real profile fields.
  const matchingJobs = (jobsPage?.data ?? [])
    .map((job) => ({
      job,
      score: (job.skills ?? []).filter((s) => user?.skills?.includes(s)).length + (job.location && job.location === user?.location ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.job);

  const recentActivity = (notifications?.data ?? []).slice(0, 5);
  const topCategories = (categoryCounts ?? []).slice(0, 6);

  return (
    <DashboardLayout
      role="job_seeker"
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle="Track your applications and find your next opportunity."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/jobs">
            <Briefcase className="h-4 w-4" /> Find Jobs
          </Link>
        </Button>
      }
    >
      <Card className="mb-6 overflow-hidden border-none bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold sm:text-base">Let&apos;s find your dream job today</p>
            <p className="mt-0.5 text-xs text-primary-foreground/80">Complete your profile and get better job matches.</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
              <span>Profile Strength</span>
              <span>{profileCompletion}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            {profileCompletion < 100 && (
              <Link to="/dashboard/profile" className="mt-1.5 inline-block text-[11px] font-medium underline underline-offset-2">
                Complete your profile to get better matches
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">{applications?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Applications</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{savedJobsCount}</p>
          <p className="text-xs text-muted-foreground">Saved Jobs</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{shortlistedCount}</p>
          <p className="text-xs text-muted-foreground">Shortlisted</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{activeAlertsCount}</p>
          <p className="text-xs text-muted-foreground">Active Job Alerts</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <Card id="recommended-jobs">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Recommended Jobs for You</h3>
                <Link to="/jobs" className="text-xs font-medium text-primary hover:underline">
                  View All
                </Link>
              </div>
              {loadingJobs ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !matchingJobs.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No open jobs to show right now.</p>
              ) : (
                <div className="space-y-3">
                  {matchingJobs.map((job) => (
                    <Link
                      key={job._id}
                      to={`/jobs/${job._id}`}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{job.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {job.companyName} · {job.location}
                        </p>
                        {!!job.skills?.length && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {job.skills.slice(0, 3).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px]">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {(job.salaryMin || job.salaryMax) && (
                        <span className="shrink-0 text-xs font-medium text-foreground/80">
                          {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Application Status</h3>
              {loadingApplications ? (
                <Skeleton className="h-56 w-full" />
              ) : !donutData.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Apply to jobs to see your status breakdown here.</p>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={2}>
                        {donutData.map((d) => (
                          <Cell key={d.name} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Upcoming Interviews</h3>
              </div>
              {!upcomingInterviews.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No interviews scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingInterviews.map((app) => {
                    const job = typeof app.job === "object" ? app.job : null;
                    const ModeIcon = app.interview?.mode === "phone" ? Phone : app.interview?.mode === "in_person" ? MapPin : Video;
                    return (
                      <div key={app._id} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{job?.title ?? "Job"}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{job?.companyName}</p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground/80">
                              <CalendarClock className="h-3.5 w-3.5 text-primary" />
                              {new Date(app.interview!.scheduledAt!).toLocaleString()}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ModeIcon className="h-3.5 w-3.5" />
                              {app.interview?.mode === "phone" ? "Phone call" : app.interview?.mode === "in_person" ? app.interview.location || "In person" : "Video call"}
                              {app.interview?.meetingLink && (
                                <a href={app.interview.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                  Join link
                                </a>
                              )}
                            </p>
                          </div>
                          <Badge variant={app.interview?.status === "confirmed" ? "success" : "warning"} className="shrink-0 text-[10px]">
                            {app.interview?.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
                          </Badge>
                        </div>
                        {app.interview?.status !== "confirmed" && (
                          <Button
                            size="sm"
                            variant="gradient"
                            className="mt-3"
                            disabled={confirmInterviewMutation.isPending}
                            onClick={() => confirmInterviewMutation.mutate(app._id)}
                          >
                            {confirmInterviewMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Confirm Attendance
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="applications">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">My Applications</h3>
              {loadingApplications ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !applications?.length ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">You haven&apos;t applied to any jobs yet</p>
                  <Button variant="gradient" asChild size="sm" className="mt-1">
                    <Link to="/jobs">Browse Jobs</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app) => {
                    const job = typeof app.job === "object" ? app.job : null;
                    const employerId = job && typeof job.employer === "object" ? job.employer._id : (job?.employer as string | undefined);
                    return (
                      <div key={app._id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{job?.title ?? "Job"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {job?.companyName} · {job?.location}
                            </p>
                          </div>
                          <Badge variant={STATUS_VARIANT[app.status]} className="shrink-0 capitalize">
                            {app.status}
                          </Badge>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {employerId && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={messageMutation.isPending}
                              onClick={() => messageMutation.mutate(employerId)}
                            >
                              {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                              Message
                            </Button>
                          )}
                          {WITHDRAWABLE.includes(app.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-danger hover:bg-danger/10"
                              disabled={withdrawMutation.isPending}
                              onClick={() => withdrawMutation.mutate(app._id)}
                            >
                              <X className="h-3.5 w-3.5" /> Withdraw
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold">Popular Job Categories</h3>
              {loadingCategories ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !topCategories.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No open jobs yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {topCategories.map((c) => (
                    <Link
                      key={c.category}
                      to={`/jobs?category=${encodeURIComponent(c.category)}`}
                      className="rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <p className="text-sm font-semibold">{c.category}</p>
                      <p className="text-xs text-muted-foreground">{c.count} jobs</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-lg">{user ? initialsFromName(user.name) : ""}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user?.name}</p>
                {user?.headline && <p className="text-xs text-muted-foreground">{user.headline}</p>}
              </div>
              <Badge variant={profileCompletion === 100 ? "success" : "outline"}>
                {profileCompletion === 100 ? "Profile Complete" : `${profileCompletion}% Complete`}
              </Badge>
              {user?.id && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/job-seekers/${user.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" /> View Public Profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Resume Score</h3>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              {!user?.resumeUrl ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Upload a resume to get a score.</p>
                  <Button variant="gradient" size="sm" asChild className="mt-3">
                    <Link to="/dashboard/profile">Upload Resume</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between text-xs font-medium">
                    <span>Based on your resume &amp; skills</span>
                    <span>{score}/100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-danger"}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                    <Link to="/dashboard/profile">Improve Resume</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Job Alerts</h3>
                <Link to="/dashboard/freelancer/alerts" className="text-xs font-medium text-primary hover:underline">
                  View All
                </Link>
              </div>
              {!alerts?.length ? (
                <p className="text-sm text-muted-foreground">No job alerts yet.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 4).map((a) => (
                    <div key={a._id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <Bell className="h-3 w-3 shrink-0 text-muted-foreground" />
                        {a.keywords.join(", ")}
                      </span>
                      <Badge variant={a.isActive ? "success" : "outline"} className="shrink-0 text-[10px]">
                        {a.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                <Link to="/dashboard/freelancer/alerts">
                  <Bookmark className="h-3.5 w-3.5" /> Create New Alert
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Recent Activity</h3>
              </div>
              {loadingNotifications ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !recentActivity.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing new yet.</p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((n) => {
                    const Icon = ACTIVITY_ICON[n.type] ?? Bell;
                    return (
                      <Link key={n._id} to={n.link || "#"} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none bg-gradient-to-br from-primary to-secondary text-primary-foreground">
            <CardContent className="p-5 text-center">
              <Crown className="mx-auto h-6 w-6" />
              <p className="mt-2 text-sm font-semibold">Upgrade to Premium</p>
              <p className="mt-1 text-xs text-primary-foreground/80">Get priority visibility and unlock more job alerts.</p>
              <Button size="sm" className="mt-3 w-full border-none bg-white text-primary hover:bg-white/90" asChild>
                <Link to="/pricing">
                  <Sparkles className="h-3.5 w-3.5" /> View Plans
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

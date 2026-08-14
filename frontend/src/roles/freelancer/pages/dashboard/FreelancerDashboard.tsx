import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Wallet,
  Users,
  CheckCircle2,
  Briefcase,
  Plus,
  ArrowDownToLine,
  Receipt,
  Star,
  ExternalLink,
  ImageOff,
  Eye,
  Trash2,
  Phone,
  Video,
  Clock,
  ListTodo,
  Crown,
  Bell,
  MessageSquare,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MiniCalendar } from "@/components/shared/MiniCalendar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { jobApi } from "@/api/jobs";
import { projectApi } from "@/api/projects";
import { paymentApi } from "@/api/payments";
import { serviceApi } from "@/api/freelancers";
import { milestoneApi } from "@/api/milestones";
import { taskApi } from "@/api/tasks";
import { notificationApi } from "@/api/notifications";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { formatCurrency, formatCompactNumber, initialsFromName, timeAgoShort as timeAgo } from "@/lib/utils";
import { freelancerProfileCompletion } from "@/lib/profileCompletion";
import type { TaskType, NotificationType } from "@/types";

const ACTIVITY_ICON: Partial<Record<NotificationType, typeof Bell>> = {
  job_application: Briefcase,
  application_status: CheckCircle2,
  new_message: MessageSquare,
  review_received: Star,
  system: Bell,
};

const TASK_TYPE_ICON: Record<TaskType, typeof Clock> = {
  task: ListTodo,
  meeting: Video,
  call: Phone,
  deadline: Clock,
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const LEVEL_BADGE: Record<string, string> = {
  top_rated: "Top Rated Freelancer",
  level_1: "Level 1 Seller",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useScrollToHash();
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<TaskType>("task");

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59);

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", "mine", { month: calendarMonth.toISOString().slice(0, 7) }],
    queryFn: () => taskApi.mine({ from: monthStart.toISOString(), to: monthEnd.toISOString() }),
  });

  const createTaskMutation = useMutation({
    mutationFn: () => taskApi.create({ title: newTaskTitle.trim(), dueAt: selectedDate.toISOString(), type: newTaskType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "mine"] });
      setNewTaskTitle("");
      setNewTaskType("task");
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "mine"] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", "mine"] }),
  });

  const markedDates = new Set((tasks ?? []).map((t) => dateKey(new Date(t.dueAt))));
  const tasksForSelectedDate = (tasks ?? [])
    .filter((t) => dateKey(new Date(t.dueAt)) === dateKey(selectedDate))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const isSelectedToday = dateKey(selectedDate) === dateKey(today);

  const { data: applications, isLoading: loadingApplications } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: jobApi.myApplications,
  });

  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ["payments", "earnings", { page: 1, limit: 200 }],
    queryFn: () => paymentApi.myEarnings({ page: 1, limit: 200 }),
  });

  const { data: gigs, isLoading: loadingGigs } = useQuery({ queryKey: ["services", "mine"], queryFn: serviceApi.mine });

  // role in the key — the backend now scopes "my subscription" to the
  // caller's currently active role (someone can hold a paid plan per role),
  // so the cache must be keyed the same way or a role switch would keep
  // showing the previous role's plan until a hard reload.
  const { data: subscription } = useQuery({ queryKey: ["payments", "subscription", user?.role], queryFn: paymentApi.mySubscription });
  const currentPlan = subscription?.status === "active" ? subscription.plan : "free";

  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.list,
  });
  const recentActivity = (notifications?.data ?? []).slice(0, 5);

  const { data: recommended, isLoading: loadingRecommended } = useQuery({
    queryKey: ["projects", "recommended"],
    queryFn: () => projectApi.list({ limit: 3 }),
  });

  const hiredApplications = applications?.filter((a) => a.status === "hired") ?? [];
  const recentProjects = hiredApplications.slice(0, 3);

  const milestoneQueries = useQueries({
    queries: recentProjects.map((app) => ({
      queryKey: ["milestones", app._id],
      queryFn: () => milestoneApi.list(app._id),
      enabled: recentProjects.length > 0,
    })),
  });

  const payments = earnings?.payments ?? [];
  const completedProjects = payments.filter((p) => p.type === "job_hire" && p.escrowStatus === "released").length;
  const totalClients = new Set(payments.map((p) => (typeof p.payer === "object" ? p.payer._id : p.payer))).size;
  const now = new Date();
  const thisMonthEarnings = payments
    .filter((p) => {
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + (p.netAmount || p.amount), 0);

  const profileCompletion = user ? freelancerProfileCompletion(user) : 0;

  const metrics = [
    { label: "Total Earnings", value: formatCurrency(earnings?.totalEarnings ?? 0), icon: Wallet, color: "text-primary bg-primary/10" },
    { label: "This Month", value: formatCurrency(thisMonthEarnings), icon: Wallet, color: "text-success bg-success/10" },
    { label: "Active Projects", value: String(hiredApplications.length), icon: Briefcase, color: "text-secondary bg-secondary/10" },
    { label: "Completed Projects", value: String(completedProjects), icon: CheckCircle2, color: "text-success bg-success/10" },
    { label: "Total Clients", value: String(totalClients), icon: Users, color: "text-warning bg-warning/10" },
  ];

  const isLoading = loadingApplications || loadingEarnings;
  const recentGigs = gigs?.slice(0, 3) ?? [];

  // Last 6 calendar months, oldest first — grouped from the same payments
  // list already fetched for the stat cards above, no extra request.
  const monthlyEarnings = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const total = payments
      .filter((p) => {
        const pd = new Date(p.createdAt);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      })
      .reduce((sum, p) => sum + (p.netAmount || p.amount), 0);
    return { month: d.toLocaleDateString("en-US", { month: "short" }), total };
  });

  return (
    <DashboardLayout
      role="freelancer"
      title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}
      subtitle="Here's what's happening with your freelance business today."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/dashboard/freelancer/gigs/new">
            <Plus className="h-4 w-4" /> Create New Gig
          </Link>
        </Button>
      }
    >
      <Card className="mb-6 overflow-hidden border-none bg-primary text-primary-foreground">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold sm:text-base">Grow your freelance career today</p>
            <p className="mt-0.5 text-xs text-primary-foreground/80">A complete profile gets more views and more work.</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
              <span>Profile Completion</span>
              <span>{profileCompletion}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            {profileCompletion < 100 && (
              <Link to="/dashboard/profile" className="mt-1.5 inline-block text-[11px] font-medium underline underline-offset-2">
                Complete your profile to get more work
              </Link>
            )}
          </div>
          <div className="w-full shrink-0 rounded-xl bg-white/15 p-4 sm:w-auto">
            <p className="text-[11px] font-medium text-primary-foreground/80">Current Plan</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold">
              <Crown className="h-4 w-4" /> {PLAN_LABELS[currentPlan]}
            </p>
            {subscription?.status === "active" && subscription.expiresAt && (
              <p className="mt-0.5 text-[11px] text-primary-foreground/80">
                Valid till {new Date(subscription.expiresAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
            <Button size="sm" className="mt-2.5 w-full border-none bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/pricing">Upgrade Plan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((m) => (
            <Card key={m.label} className="p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-semibold">Earnings Overview</h3>
              <span className="text-xs text-muted-foreground">Last 6 months</span>
            </div>
            <p className="mb-4 text-2xl font-bold">
              {formatCurrency(thisMonthEarnings)} <span className="text-sm font-normal text-muted-foreground">this month</span>
            </p>
            {loadingEarnings ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyEarnings} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactNumber(v)} width={40} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }}
                    />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#earningsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">My Gigs</h3>
              <Link to="/dashboard/freelancer/gigs" className="text-xs font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            {loadingGigs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !recentGigs.length ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
                <p className="text-sm font-medium">You haven&apos;t created any gigs yet</p>
                <Button variant="gradient" asChild size="sm">
                  <Link to="/dashboard/freelancer/gigs/new">Create Your First Gig</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGigs.map((gig) => (
                  <Link
                    key={gig._id}
                    to={`/dashboard/freelancer/gigs/${gig._id}/edit`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {gig.images?.[0] ? (
                        <img src={gig.images[0]} alt={gig.title} className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{gig.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant={gig.status === "active" ? "success" : "outline"} className="text-[10px] capitalize">
                          {gig.status}
                        </Badge>
                        <span>{gig.ordersCount} orders</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" /> {gig.rating > 0 ? gig.rating.toFixed(1) : "New"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {formatCompactNumber(gig.viewsCount)}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{formatCurrency(gig.price)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Recent Projects</h3>
                <Link to="/dashboard/freelancer/projects" className="text-xs font-medium text-primary hover:underline">
                  View All
                </Link>
              </div>
              {loadingApplications ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !recentProjects.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Once a client hires you, active work will show up here.</p>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map((app, i) => {
                    const job = typeof app.job === "object" ? app.job : null;
                    const milestones = milestoneQueries[i]?.data ?? [];
                    const releasedCount = milestones.filter((m) => m.status === "released").length;
                    const progress = milestones.length > 0 ? Math.round((releasedCount / milestones.length) * 100) : 0;
                    return (
                      <div key={app._id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{job?.title ?? "Job"}</p>
                            <p className="text-xs text-muted-foreground">
                              {job?.companyName} · Hired {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!!app.proposedRate && <span className="shrink-0 text-sm font-semibold">{formatCurrency(app.proposedRate)}</span>}
                        </div>
                        {milestones.length > 0 && (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>
                                {releasedCount}/{milestones.length} milestones
                              </span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Recent Activity</h3>
                <Link to="/dashboard/messages" className="text-xs font-medium text-primary hover:underline">
                  View All
                </Link>
              </div>
              {loadingNotifications ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !recentActivity.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing new yet — activity will show up here.</p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((n) => {
                    const Icon = ACTIVITY_ICON[n.type] ?? Bell;
                    return (
                      <Link
                        key={n._id}
                        to={n.link || "#"}
                        className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
                      >
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
        </div>
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
                {user?.level && LEVEL_BADGE[user.level] && (
                  <Badge variant="secondary" className="mt-1">
                    {LEVEL_BADGE[user.level]}
                  </Badge>
                )}
              </div>
              <p className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-semibold">{user?.rating ? user.rating.toFixed(1) : "New"}</span>
                <span className="text-xs text-muted-foreground">({user?.reviewCount ?? 0} reviews)</span>
              </p>
              {user?.id && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/freelancers/${user.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" /> View Public Profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-xs text-muted-foreground">Wallet Balance</p>
              {loadingEarnings ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-2xl font-bold text-primary">{formatCurrency(earnings?.wallet.availableBalance ?? 0)}</p>
              )}
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <div className="flex gap-2 pt-1">
                <Button variant="gradient" size="sm" className="flex-1" asChild>
                  <Link to="/dashboard/freelancer/earnings">
                    <ArrowDownToLine className="h-3.5 w-3.5" /> Withdraw
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/dashboard/freelancer/earnings">
                    <Receipt className="h-3.5 w-3.5" /> Transactions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card id="calendar">
            <CardContent className="p-5">
              {loadingTasks ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <MiniCalendar
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  markedDates={markedDates}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-base font-semibold">
                {isSelectedToday ? "Today's Tasks" : `Tasks for ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              </h3>

              {loadingTasks ? (
                <Skeleton className="h-20 w-full" />
              ) : !tasksForSelectedDate.length ? (
                <p className="py-2 text-sm text-muted-foreground">No tasks for this day yet.</p>
              ) : (
                <div className="space-y-2">
                  {tasksForSelectedDate.map((task) => {
                    const Icon = TASK_TYPE_ICON[task.type];
                    return (
                      <div key={task._id} className="group flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded border-border"
                          checked={task.completed}
                          onChange={() => toggleTaskMutation.mutate(task._id)}
                        />
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className={`min-w-0 flex-1 truncate text-sm ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                          {task.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {new Date(task.dueAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteTaskMutation.mutate(task._id)}
                          className="shrink-0 text-muted-foreground opacity-0 hover:text-danger group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a task..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTaskTitle.trim()) createTaskMutation.mutate();
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                  onClick={() => createTaskMutation.mutate()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {createTaskMutation.isError && (
                <p className="text-xs text-danger">
                  {isAxiosError(createTaskMutation.error) ? createTaskMutation.error.response?.data?.message : "Something went wrong."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Open Projects You Could Apply To</h3>
              <Link to="/freelancers?tab=projects" className="text-xs font-medium text-primary hover:underline">
                View All Projects
              </Link>
            </div>
            {loadingRecommended ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !recommended?.data.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open projects right now — check back soon.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {recommended.data.map((project) => (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="rounded-lg border border-border p-4 transition-colors hover:border-primary"
                  >
                    <p className="text-sm font-semibold">{project.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.budgetMin > 0 ? `${formatCurrency(project.budgetMin)} - ${formatCurrency(project.budgetMax)}` : "Rate on request"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.skills.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Loader2, MapPin, Phone, Video } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { jobApi } from "@/api/jobs";
import type { Application } from "@/types";

function InterviewRow({ app, onConfirm, confirming }: { app: Application; onConfirm: (id: string) => void; confirming: boolean }) {
  const job = typeof app.job === "object" ? app.job : null;
  const interview = app.interview!;
  const ModeIcon = interview.mode === "phone" ? Phone : interview.mode === "in_person" ? MapPin : Video;
  const isPast = new Date(interview.scheduledAt!) < new Date();

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{job?.title ?? "Job"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{job?.companyName}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground/80">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            {new Date(interview.scheduledAt!).toLocaleString()}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ModeIcon className="h-3.5 w-3.5" />
            {interview.mode === "phone" ? "Phone call" : interview.mode === "in_person" ? interview.location || "In person" : "Video call"}
            {interview.meetingLink && (
              <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Join link
              </a>
            )}
          </p>
          {interview.note && <p className="mt-1.5 text-xs text-muted-foreground">{interview.note}</p>}
        </div>
        <Badge variant={isPast ? "outline" : interview.status === "confirmed" ? "success" : "warning"} className="shrink-0 text-[10px]">
          {isPast ? "Past" : interview.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
        </Badge>
      </div>
      {!isPast && interview.status !== "confirmed" && (
        <Button size="sm" variant="gradient" className="mt-3" disabled={confirming} onClick={() => onConfirm(app._id)}>
          {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Confirm Attendance
        </Button>
      )}
    </div>
  );
}

export default function JobSeekerInterviews() {
  const queryClient = useQueryClient();
  const { data: applications, isLoading } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });

  const confirmMutation = useMutation({
    mutationFn: (applicationId: string) => jobApi.confirmInterview(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });

  const scheduled = (applications ?? [])
    .filter((a) => a.interview?.scheduledAt)
    .sort((a, b) => new Date(b.interview!.scheduledAt!).getTime() - new Date(a.interview!.scheduledAt!).getTime());
  const now = new Date();
  const upcoming = scheduled.filter((a) => new Date(a.interview!.scheduledAt!) >= now);
  const past = scheduled.filter((a) => new Date(a.interview!.scheduledAt!) < now);

  return (
    <DashboardLayout role="job_seeker" title="Interview Calls" subtitle="Every interview an employer has scheduled with you.">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !scheduled.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No interviews scheduled yet</p>
            <p className="text-sm text-muted-foreground">Once an employer schedules one, it'll show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {!!upcoming.length && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.map((app) => (
                  <InterviewRow key={app._id} app={app} onConfirm={confirmMutation.mutate} confirming={confirmMutation.isPending} />
                ))}
              </div>
            </div>
          )}
          {!!past.length && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Past</h3>
              <div className="space-y-3">
                {past.map((app) => (
                  <InterviewRow key={app._id} app={app} onConfirm={confirmMutation.mutate} confirming={confirmMutation.isPending} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

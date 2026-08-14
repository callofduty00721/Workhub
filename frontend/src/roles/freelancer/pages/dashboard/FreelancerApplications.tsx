import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Briefcase, ClipboardList, MessageSquare, X, Loader2, Pencil, CalendarClock, CheckCircle2, MapPin, Phone, Video, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FilterPills } from "@/components/shared/FilterPills";
import { jobApi } from "@/api/jobs";
import { chatApi } from "@/api/chat";
import { formatCurrency } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";

const STATUS_VARIANT: Record<ApplicationStatus, "default" | "warning" | "success" | "danger"> = {
  applied: "default",
  shortlisted: "warning",
  interview: "warning",
  hired: "success",
  rejected: "danger",
  withdrawn: "danger",
};

const WITHDRAWABLE: ApplicationStatus[] = ["applied", "shortlisted", "interview"];

// Sent / Viewed / Shortlisted / Accepted / Rejected — derived from the raw
// Application.status plus the viewedAt timestamp the employer/client sets
// the first time they open their applicant list.
type ProposalFilter = "all" | "sent" | "viewed" | "shortlisted" | "accepted" | "rejected" | "withdrawn";

function proposalStatus(app: Application): Exclude<ProposalFilter, "all"> {
  if (app.status === "withdrawn") return "withdrawn";
  if (app.status === "hired") return "accepted";
  if (app.status === "rejected") return "rejected";
  if (app.status === "shortlisted" || app.status === "interview") return "shortlisted";
  return app.viewedAt ? "viewed" : "sent";
}

const PROPOSAL_FILTERS: { value: ProposalFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const PROPOSAL_STATUS_VARIANT: Record<string, "default" | "secondary" | "warning" | "success" | "danger"> = {
  sent: "default",
  viewed: "secondary",
  shortlisted: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "danger",
};

// Editable only while status is still "applied" — matches the backend's
// editApplication guard, so this never offers an Edit button the API would
// reject once the employer has shortlisted/interviewed/hired/rejected it.
const EDITABLE: ApplicationStatus[] = ["applied"];

export default function FreelancerApplications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ProposalFilter>("all");
  const [editing, setEditing] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery({ queryKey: ["applications", "mine"], queryFn: jobApi.myApplications });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => jobApi.withdraw(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      setWithdrawing(null);
    },
  });

  const messageMutation = useMutation({
    mutationFn: (employerId: string) => chatApi.getOrCreateConversation(employerId),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const confirmInterviewMutation = useMutation({
    mutationFn: (applicationId: string) => jobApi.confirmInterview(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });

  const filtered = (applications ?? []).filter((app) => filter === "all" || proposalStatus(app) === filter);

  return (
    <DashboardLayout
      role="freelancer"
      title="Proposals"
      subtitle="Track jobs you've applied to and proposals you've sent for freelance projects."
      actions={
        <Button variant="gradient" asChild>
          <Link to="/jobs">
            <Briefcase className="h-4 w-4" /> Find More Jobs
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {!isLoading && !!applications?.length && <FilterPills options={PROPOSAL_FILTERS} value={filter} onChange={setFilter} />}
          {isLoading ? (
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
          ) : !filtered.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No proposals with this status.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((app) => {
                const job = typeof app.job === "object" ? app.job : null;
                const employerId = job && typeof job.employer === "object" ? job.employer._id : (job?.employer as string | undefined);
                const isProposal = app.onModel === "Project";
                const pStatus = proposalStatus(app);
                return (
                  <div key={app._id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{job?.title ?? "Job"}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {isProposal ? "Project" : "Job"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job?.companyName} · {job?.location}
                        </p>
                        {(!!app.proposedRate || !!app.deliveryDays) && (
                          <p className="mt-1.5 text-xs font-medium text-foreground/80">
                            {!!app.proposedRate && <>Your bid: {formatCurrency(app.proposedRate)}</>}
                            {!!app.proposedRate && !!app.deliveryDays && " · "}
                            {!!app.deliveryDays && <>{app.deliveryDays} day delivery</>}
                          </p>
                        )}
                      </div>
                      <Badge variant={PROPOSAL_STATUS_VARIANT[pStatus] ?? STATUS_VARIANT[app.status]} className="shrink-0 capitalize">
                        {pStatus}
                      </Badge>
                    </div>

                    {app.interview?.scheduledAt && (
                      <InterviewDetails
                        interview={app.interview}
                        onConfirm={() => confirmInterviewMutation.mutate(app._id)}
                        confirming={confirmInterviewMutation.isPending}
                      />
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {employerId && (
                        <Button variant="outline" size="sm" disabled={messageMutation.isPending} onClick={() => messageMutation.mutate(employerId)}>
                          {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                          Message
                        </Button>
                      )}
                      {EDITABLE.includes(app.status) && (
                        <Button variant="outline" size="sm" onClick={() => setEditing(app)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      )}
                      {WITHDRAWABLE.includes(app.status) && (
                        <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10" onClick={() => setWithdrawing(app)}>
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

      <EditProposalModal application={editing} onOpenChange={(open) => !open && setEditing(null)} />

      <Dialog open={!!withdrawing} onOpenChange={(open) => !open && setWithdrawing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-danger" /> Withdraw this proposal?
            </DialogTitle>
            <DialogDescription className="line-clamp-1">
              {withdrawing && typeof withdrawing.job === "object" ? `For "${withdrawing.job.title}"` : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This can&apos;t be undone — the employer will see it as withdrawn, and you won&apos;t be able to re-apply to this job.
          </p>
          {withdrawMutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(withdrawMutation.error) ? withdrawMutation.error.response?.data?.message || "Failed to withdraw" : "Something went wrong"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={withdrawMutation.isPending} onClick={() => setWithdrawing(null)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              className="bg-danger hover:bg-danger/90"
              disabled={withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate(withdrawing!._id)}
            >
              {withdrawMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Yes, Withdraw
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Surfaces the interview an employer scheduled directly on the proposal it
// belongs to — previously this was only visible on the job_seeker role's
// separate "Interview Calls" page, so a freelancer shortlisted on several
// proposals at once had no way to see which client's interview was when.
function InterviewDetails({
  interview,
  onConfirm,
  confirming,
}: {
  interview: NonNullable<Application["interview"]>;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const ModeIcon = interview.mode === "phone" ? Phone : interview.mode === "in_person" ? MapPin : Video;
  const isPast = new Date(interview.scheduledAt!) < new Date();

  return (
    <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <CalendarClock className="h-3.5 w-3.5 text-warning" />
        Interview: {new Date(interview.scheduledAt!).toLocaleString()}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <ModeIcon className="h-3.5 w-3.5" />
        {interview.mode === "phone" ? "Phone call" : interview.mode === "in_person" ? interview.location || "In person" : "Video call"}
        {interview.meetingLink && (
          <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Join link
          </a>
        )}
      </p>
      {interview.note && <p className="mt-1.5 text-xs text-muted-foreground">{interview.note}</p>}
      {!isPast && interview.status !== "confirmed" ? (
        <Button size="sm" variant="gradient" className="mt-2.5" disabled={confirming} onClick={onConfirm}>
          {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Confirm Attendance
        </Button>
      ) : (
        <Badge variant={isPast ? "outline" : "success"} className="mt-2.5 text-[10px]">
          {isPast ? "Past" : "Confirmed"}
        </Badge>
      )}
    </div>
  );
}

// Lets a freelancer correct their bid, delivery estimate, or cover letter
// while the proposal is still unread/undecided — locked out entirely once
// the employer has acted on it (enforced server-side, mirrored here by only
// ever being opened for an EDITABLE-status application).
function EditProposalModal({
  application,
  onOpenChange,
}: {
  application: Application | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [proposedRate, setProposedRate] = useState<number | "">(application?.proposedRate || "");
  const [deliveryDays, setDeliveryDays] = useState<number | "">(application?.deliveryDays || "");
  const [coverLetter, setCoverLetter] = useState(application?.coverLetter ?? "");

  // Re-seed local state whenever a different application is opened for
  // editing — Dialog stays mounted across opens, so props alone won't do it.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (application && application._id !== openedFor) {
    setOpenedFor(application._id);
    setProposedRate(application.proposedRate || "");
    setDeliveryDays(application.deliveryDays || "");
    setCoverLetter(application.coverLetter ?? "");
  }

  const mutation = useMutation({
    mutationFn: () =>
      jobApi.editApplication(application!._id, {
        proposedRate: proposedRate === "" ? undefined : Number(proposedRate),
        deliveryDays: deliveryDays === "" ? undefined : Number(deliveryDays),
        coverLetter: coverLetter.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={!!application} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Proposal</DialogTitle>
          <DialogDescription className="line-clamp-1">
            {application && typeof application.job === "object" ? `For "${application.job.title}"` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="editRate">Your Bid (₹)</Label>
              <Input
                id="editRate"
                type="number"
                min={1}
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editDeliveryDays">Delivery (days)</Label>
              <Input
                id="editDeliveryDays"
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editCoverLetter">Cover Letter</Label>
            <Textarea
              id="editCoverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[90px]"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(mutation.error) ? mutation.error.response?.data?.message || "Failed to update proposal" : "Something went wrong"}
            </p>
          )}

          <Button variant="gradient" className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

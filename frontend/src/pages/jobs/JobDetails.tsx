import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { MapPin, Wifi, Briefcase, Clock, CheckCircle2, Loader2, Lock, ShieldCheck, FileText, Download, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { jobApi } from "@/api/jobs";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { FileUpload } from "@/components/shared/FileUpload";
import { SaveButton } from "@/components/shared/SaveButton";

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
};

export default function JobDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: job, isLoading } = useQuery({ queryKey: ["jobs", id], queryFn: () => jobApi.getById(id), enabled: !!id });

  const acceptNdaMutation = useMutation({
    mutationFn: () => jobApi.acceptNda(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs", id] }),
  });

  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [openingAttachment, setOpeningAttachment] = useState<number | null>(null);
  const openAttachment = async (index: number) => {
    setAttachmentError(null);
    setOpeningAttachment(index);
    try {
      const { url } = await jobApi.getAttachmentUrl(id, index);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setAttachmentError(isAxiosError(err) ? err.response?.data?.message || "Could not open this file" : "Could not open this file");
    } finally {
      setOpeningAttachment(null);
    }
  };

  const { data: myApplications } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: jobApi.myApplications,
    enabled: !!user && user.role === "freelancer",
  });

  const alreadyApplied = myApplications?.some((a) => (typeof a.job === "string" ? a.job : a.job._id) === id);

  const applyMutation = useMutation({
    mutationFn: () => jobApi.apply(id, { coverLetter, resumeUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      setDialogOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Job not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const canApply = user && user.role === "freelancer";

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white">
                  {job.companyName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-xl font-bold">{job.title}</h1>
                    <SaveButton type="job" id={job._id} className="h-8 w-8 shrink-0 bg-muted text-muted-foreground hover:bg-muted hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{job.companyName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{TYPE_LABELS[job.type]}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {job.experienceLevel} level
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {job.isRemote ? <Wifi className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {job.isRemote ? "Remote" : job.location}
                    </Badge>
                    {job.visibility === "invite_only" && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Private Project
                      </Badge>
                    )}
                    {job.requiresNda && (
                      <Badge variant={job.ndaAccepted ? "success" : "outline"} className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> {job.ndaAccepted ? "NDA Accepted" : "NDA Required"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {job.requiresNda && !job.ndaAccepted ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <ShieldCheck className="h-9 w-9 text-primary" />
                <p className="text-base font-semibold">This project requires an NDA</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  {job.companyName} requires you to accept a Non-Disclosure Agreement before viewing the full project description and files.
                </p>
                <div className="mt-2 max-h-48 w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-left text-xs text-muted-foreground">
                  {job.ndaText?.trim() ||
                    "By accepting, you agree to keep all project details, files, and communications confidential, and not to disclose or use them for any purpose other than evaluating or completing this project."}
                </div>
                {!user ? (
                  <Button variant="gradient" onClick={() => navigate("/login", { state: { from: `/jobs/${id}` } })}>
                    Log in to review the NDA
                  </Button>
                ) : (
                  <Button variant="gradient" disabled={acceptNdaMutation.isPending} onClick={() => acceptNdaMutation.mutate()}>
                    {acceptNdaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Accept NDA &amp; View Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-5 p-6">
                <div>
                  <h3 className="mb-2 text-base font-semibold">Job Description</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{job.description}</p>
                </div>
                {job.responsibilities && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Responsibilities</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{job.responsibilities}</p>
                  </div>
                )}
                {job.requirements && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Requirements</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{job.requirements}</p>
                  </div>
                )}
                {job.skills.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(job.role || job.industryType || job.department || job.roleCategory || job.educationUG || job.educationPG) && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Role Overview</h3>
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {job.role && <OverviewItem label="Role" value={job.role} />}
                      {job.industryType && <OverviewItem label="Industry Type" value={job.industryType} />}
                      {job.department && <OverviewItem label="Department" value={job.department} />}
                      <OverviewItem label="Employment Type" value={TYPE_LABELS[job.type]} />
                      {job.roleCategory && <OverviewItem label="Role Category" value={job.roleCategory} />}
                      {(job.educationUG || job.educationPG) && (
                        <OverviewItem label="Education" value={[job.educationUG && `UG: ${job.educationUG}`, job.educationPG && `PG: ${job.educationPG}`].filter(Boolean).join(" · ")} />
                      )}
                    </dl>
                  </div>
                )}
                {!!job.attachments?.length && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Confidential Attachments</h3>
                    <div className="space-y-2">
                      {job.attachments.map((a, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openAttachment(i)}
                          disabled={openingAttachment === i}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-accent"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" /> {a.name}
                          </span>
                          {openingAttachment === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      ))}
                    </div>
                    {attachmentError && <p className="mt-2 text-xs text-danger">{attachmentError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              {job.salaryMin > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Salary Range</p>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(job.salaryMin, job.currency as "INR" | "USD")}
                    {job.salaryMax > job.salaryMin ? ` - ${formatCurrency(job.salaryMax, job.currency as "INR" | "USD")}` : ""}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Posted {new Date(job.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" /> {job.applicationsCount} applicants so far
              </div>
              {!!job.openings && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {job.openings} opening{job.openings === 1 ? "" : "s"}
                </div>
              )}

              {!canApply ? (
                <Button className="w-full" variant="outline" disabled={!user} onClick={() => !user && navigate("/login", { state: { from: `/jobs/${id}` } })}>
                  {user ? "Only freelancers can apply" : "Log in to Apply"}
                </Button>
              ) : alreadyApplied ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> Applied
                </div>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="gradient">
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply to {job.title}</DialogTitle>
                      <DialogDescription>Add a short cover letter to introduce yourself to {job.companyName}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                      <Label>Cover Letter</Label>
                      <Textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell them why you're a great fit..."
                        className="min-h-[140px]"
                      />
                    </div>
                    <div className="mt-3">
                      <FileUpload
                        folder="resume"
                        accept="application/pdf"
                        value={resumeUrl}
                        onUploaded={(url) => setResumeUrl(url)}
                        label="Upload your resume (PDF, optional)"
                      />
                    </div>
                    {applyMutation.isError && (
                      <p className="mt-2 text-xs text-danger">
                        {isAxiosError(applyMutation.error) ? applyMutation.error.response?.data?.message : "Something went wrong."}
                      </p>
                    )}
                    <Button className="mt-4 w-full" variant="gradient" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                      {applyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground/90">{value}</dd>
    </div>
  );
}

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { MapPin, Wifi, Briefcase, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jobApi } from "@/api/jobs";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { FileUpload } from "@/components/shared/FileUpload";

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

export default function JobDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [proposedRate, setProposedRate] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: job, isLoading } = useQuery({ queryKey: ["jobs", id], queryFn: () => jobApi.getById(id), enabled: !!id });

  const { data: myApplications } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: jobApi.myApplications,
    enabled: !!user && user.role === "freelancer",
  });

  const alreadyApplied = myApplications?.some((a) => (typeof a.job === "string" ? a.job : a.job._id) === id);

  const isProposalType = job?.type === "freelance" || job?.type === "contract";

  const applyMutation = useMutation({
    mutationFn: () =>
      jobApi.apply(id, {
        coverLetter,
        resumeUrl,
        ...(isProposalType ? { proposedRate, deliveryDays } : {}),
      }),
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
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white">
                  {job.companyName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold">{job.title}</h1>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>
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
                      <DialogTitle>{isProposalType ? "Send a Proposal to" : "Apply to"} {job.title}</DialogTitle>
                      <DialogDescription>
                        {isProposalType
                          ? `Pitch yourself and your bid to ${job.companyName}.`
                          : `Add a short cover letter to introduce yourself to ${job.companyName}.`}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                      <Label>{isProposalType ? "Your Pitch" : "Cover Letter"}</Label>
                      <Textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell them why you're a great fit..."
                        className="min-h-[140px]"
                      />
                    </div>
                    {isProposalType && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Your Bid ({job.currency})</Label>
                          <Input
                            type="number"
                            min={0}
                            value={proposedRate || ""}
                            onChange={(e) => setProposedRate(Number(e.target.value))}
                            placeholder="e.g. 25000"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Delivery Time (days)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={deliveryDays || ""}
                            onChange={(e) => setDeliveryDays(Number(e.target.value))}
                            placeholder="e.g. 14"
                          />
                        </div>
                      </div>
                    )}
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
                      {isProposalType ? "Send Proposal" : "Submit Application"}
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

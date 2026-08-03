import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { MapPin, Wifi, Users2, Timer, CheckCircle2, Loader2, Lock, ShieldCheck, FileText, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectApi } from "@/api/projects";
import { jobApi } from "@/api/jobs";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { FileUpload } from "@/components/shared/FileUpload";
import { SaveButton } from "@/components/shared/SaveButton";

const TYPE_LABELS: Record<string, string> = {
  freelance: "One-off Project",
  contract: "Ongoing Contract",
};

export default function ProjectDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [proposedRate, setProposedRate] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: project, isLoading } = useQuery({ queryKey: ["projects", id], queryFn: () => projectApi.getById(id), enabled: !!id });

  const acceptNdaMutation = useMutation({
    mutationFn: () => projectApi.acceptNda(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", id] }),
  });

  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [openingAttachment, setOpeningAttachment] = useState<number | null>(null);
  const openAttachment = async (index: number) => {
    setAttachmentError(null);
    setOpeningAttachment(index);
    try {
      const { url } = await projectApi.getAttachmentUrl(id, index);
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
    mutationFn: () => projectApi.apply(id, { coverLetter, resumeUrl, proposedRate, deliveryDays }),
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

  if (!project) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Project not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/freelancers?tab=projects">Back to Projects</Link>
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
                  {project.companyName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-xl font-bold">{project.title}</h1>
                    <SaveButton type="project" id={project._id} className="h-8 w-8 shrink-0 bg-muted text-muted-foreground hover:bg-muted hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{project.companyName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{TYPE_LABELS[project.type]}</Badge>
                    {project.category && <Badge variant="outline">{project.category}</Badge>}
                    {project.subCategory && <Badge variant="outline">{project.subCategory}</Badge>}
                    <Badge variant="outline" className="flex items-center gap-1">
                      {project.isRemote ? <Wifi className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {project.isRemote ? "Remote" : project.location}
                    </Badge>
                    {project.visibility === "invite_only" && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Private Project
                      </Badge>
                    )}
                    {project.requiresNda && (
                      <Badge variant={project.ndaAccepted ? "success" : "outline"} className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> {project.ndaAccepted ? "NDA Accepted" : "NDA Required"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {project.requiresNda && !project.ndaAccepted ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <ShieldCheck className="h-9 w-9 text-primary" />
                <p className="text-base font-semibold">This project requires an NDA</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  {project.companyName} requires you to accept a Non-Disclosure Agreement before viewing the full project description and files.
                </p>
                <div className="mt-2 max-h-48 w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-left text-xs text-muted-foreground">
                  {project.ndaText?.trim() ||
                    "By accepting, you agree to keep all project details, files, and communications confidential, and not to disclose or use them for any purpose other than evaluating or completing this project."}
                </div>
                {!user ? (
                  <Button variant="gradient" onClick={() => navigate("/login", { state: { from: `/projects/${id}` } })}>
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
                  <h3 className="mb-2 text-base font-semibold">Scope of Work</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{project.description}</p>
                </div>
                {project.requirements && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Requirements</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{project.requirements}</p>
                  </div>
                )}
                {project.skills.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Skills Required</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {!!project.attachments?.length && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold">Confidential Attachments</h3>
                    <div className="space-y-2">
                      {project.attachments.map((a, i) => (
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
              {project.budgetMin > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Budget Range (indicative)</p>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(project.budgetMin, project.currency as "INR" | "USD")}
                    {project.budgetMax > project.budgetMin ? ` - ${formatCurrency(project.budgetMax, project.currency as "INR" | "USD")}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Freelancers can still bid outside this range.</p>
                </div>
              )}
              {!!project.expectedDeliveryDays && (
                <div>
                  <p className="text-xs text-muted-foreground">Expected Delivery (indicative)</p>
                  <p className="text-lg font-bold">
                    {project.expectedDeliveryDays} day{project.expectedDeliveryDays === 1 ? "" : "s"}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" /> Posted {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users2 className="h-4 w-4" /> {project.applicationsCount} proposal{project.applicationsCount === 1 ? "" : "s"} so far
              </div>

              {!canApply ? (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!user}
                  onClick={() => !user && navigate("/login", { state: { from: `/projects/${id}` } })}
                >
                  {user ? "Only freelancers can bid" : "Log in to Bid"}
                </Button>
              ) : alreadyApplied ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> Proposal Sent
                </div>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="gradient">
                      Send Proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send a Proposal to {project.title}</DialogTitle>
                      <DialogDescription>Pitch yourself and your bid to {project.companyName}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                      <Label>Your Pitch</Label>
                      <Textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell them why you're a great fit..."
                        className="min-h-[140px]"
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Your Bid ({project.currency})</Label>
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
                      Send Proposal
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

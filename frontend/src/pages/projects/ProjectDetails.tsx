import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Users2,
  Wallet,
  Wifi,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/shared/FileUpload";
import { SaveButton } from "@/components/shared/SaveButton";
import { ProjectCard } from "@/pages/projects/ProjectCard";
import { projectApi } from "@/api/projects";
import { jobApi } from "@/api/jobs";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const TYPE_LABELS: Record<string, string> = {
  freelance: "One-off Project",
  contract: "Ongoing Contract",
};

function postedLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function budgetLabel(budgetMin: number, budgetMax: number, currency: string) {
  if (budgetMin <= 0 && budgetMax <= 0) return "Open budget";
  if (budgetMax > budgetMin) return `${formatCurrency(budgetMin, currency as "INR" | "USD")} - ${formatCurrency(budgetMax, currency as "INR" | "USD")}`;
  return formatCurrency(budgetMin, currency as "INR" | "USD");
}

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

  // Real related projects — same category, excluding this one. Not shown at
  // all if the fetch comes back empty, rather than padding with unrelated
  // results.
  const { data: relatedData } = useQuery({
    queryKey: ["projects", "related", project?.category],
    queryFn: () => projectApi.list({ category: project!.category, limit: 4 }),
    enabled: !!project?.category,
  });
  const relatedProjects = (relatedData?.data ?? []).filter((p) => p._id !== id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-4 w-64 bg-[#EDEFEA]" />
          <Skeleton className="h-32 w-full rounded-[20px] bg-[#EDEFEA]" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-96 w-full rounded-[20px] bg-[#EDEFEA]" />
            <Skeleton className="h-64 w-full rounded-[20px] bg-[#EDEFEA]" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Project not found</p>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const employer = typeof project.employer === "object" ? project.employer : null;
  const canApply = user && user.role === "freelancer";
  const isClosed = project.status === "closed";
  const ndaGated = project.requiresNda && !project.ndaAccepted;

  return (
    <div className="bg-[#F7F8F5] pb-24 lg:pb-10">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/projects" className="hover:text-[#111111]">
            Projects
          </Link>
          {project.category && (
            <>
              {" "}
              /{" "}
              <Link to={`/projects?category=${encodeURIComponent(project.category)}`} className="hover:text-[#111111]">
                {project.category}
              </Link>
            </>
          )}{" "}
          / <span className="text-[#6B7280]">{project.title}</span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Projects
        </button>

        {/* Project header */}
        <div className="mt-4 rounded-[20px] border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={
                  isClosed
                    ? "rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-bold text-[#6B7280]"
                    : "rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]"
                }
              >
                {isClosed ? "Closed" : "Open"}
              </span>
              <span className="rounded-full bg-[#F1FFD6] px-2.5 py-1 text-[10.5px] font-semibold text-[#4D7A00]">{TYPE_LABELS[project.type]}</span>
              {project.category && <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-medium text-[#4B5563]">{project.category}</span>}
              <span className="flex items-center gap-1 rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-medium text-[#4B5563]">
                {project.isRemote ? <Wifi className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {project.isRemote ? "Remote" : project.location}
              </span>
              {project.visibility === "invite_only" && (
                <span className="flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10.5px] font-bold text-[#B45309]">
                  <Lock className="h-3 w-3" /> Private Project
                </span>
              )}
              {project.requiresNda && (
                <span
                  className={cnBadge(project.ndaAccepted)}
                >
                  <ShieldCheck className="h-3 w-3" /> {project.ndaAccepted ? "NDA Accepted" : "NDA Required"}
                </span>
              )}
            </div>
            <SaveButton type="project" id={project._id} className="h-9 w-9 shrink-0 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
          </div>

          <h1 className="mt-3 text-xl font-extrabold leading-snug text-[#111111] sm:text-2xl">{project.title}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">{project.companyName}</p>
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#9CA3AF]">
            <Calendar className="h-3.5 w-3.5" /> Posted {postedLabel(project.createdAt)}
          </p>
        </div>

        {/* Main layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left — main content */}
          <div className="min-w-0 space-y-6">
            {ndaGated ? (
              <div className="flex flex-col items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-white px-6 py-14 text-center">
                <ShieldCheck className="h-9 w-9 text-[#B6FF00]" />
                <p className="text-base font-bold text-[#111111]">This project requires an NDA</p>
                <p className="max-w-md text-sm text-[#6B7280]">
                  {project.companyName} requires you to accept a Non-Disclosure Agreement before viewing the full project description and files.
                </p>
                <div className="mt-2 max-h-48 w-full max-w-lg overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#F7F8F5] p-4 text-left text-xs leading-relaxed text-[#6B7280]">
                  {project.ndaText?.trim() ||
                    "By accepting, you agree to keep all project details, files, and communications confidential, and not to disclose or use them for any purpose other than evaluating or completing this project."}
                </div>
                {!user ? (
                  <button
                    type="button"
                    onClick={() => navigate("/login", { state: { from: `/projects/${id}` } })}
                    className="mt-1 rounded-full bg-[#111111] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
                  >
                    Log in to review the NDA
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={acceptNdaMutation.isPending}
                    onClick={() => acceptNdaMutation.mutate()}
                    className="mt-1 flex items-center gap-1.5 rounded-full bg-[#111111] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
                  >
                    {acceptNdaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Accept NDA &amp; View Project
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* About the Project */}
                <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                  <h2 className="text-base font-bold text-[#111111]">About the Project</h2>
                  <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-[1.7] text-[#4B5563]">{project.description}</p>

                  {project.requirements && (
                    <>
                      <h2 className="mt-6 text-base font-bold text-[#111111]">Requirements</h2>
                      <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-[1.7] text-[#4B5563]">{project.requirements}</p>
                    </>
                  )}

                  {project.skills.length > 0 && (
                    <>
                      <h2 className="mt-6 text-base font-bold text-[#111111]">Skills Required</h2>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {project.skills.map((skill) => (
                          <span key={skill} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11.5px] font-medium text-[#4B5563]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {!!project.attachments?.length && (
                    <>
                      <h2 className="mt-6 text-base font-bold text-[#111111]">Confidential Attachments</h2>
                      <div className="mt-2.5 space-y-2">
                        {project.attachments.map((a, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => openAttachment(i)}
                            disabled={openingAttachment === i}
                            className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-left text-sm transition-colors hover:border-[#B6FF00] hover:bg-[#F1FFD6]/30"
                          >
                            <span className="flex items-center gap-2 truncate text-[#111111]">
                              <FileText className="h-4 w-4 shrink-0 text-[#9CA3AF]" /> {a.name}
                            </span>
                            {openingAttachment === i ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#9CA3AF]" />
                            ) : (
                              <Download className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                            )}
                          </button>
                        ))}
                      </div>
                      {attachmentError && <p className="mt-2 text-xs text-[#EF4444]">{attachmentError}</p>}
                    </>
                  )}
                </section>

                {/* About the Client — only real fields, no fabricated stats */}
                {employer && (
                  <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                    <h2 className="text-base font-bold text-[#111111]">About the Client</h2>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-xl border border-[#E5E7EB]">
                        <AvatarImage src={employer.avatar} alt={project.companyName} className="rounded-xl object-cover" />
                        <AvatarFallback className="rounded-xl bg-[#111111] text-sm font-semibold text-white">{initialsFromName(project.companyName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#111111]">{project.companyName}</p>
                        {project.location && (
                          <p className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                            <MapPin className="h-3 w-3" /> {project.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Proposal CTA band — always shown once the NDA (if any) is
                    cleared; the action itself adapts to auth/role/status so
                    logged-out visitors still see a clear next step instead
                    of an empty gap. */}
                {!ndaGated && (
                  <section className="rounded-[20px] border border-[#E5E7EB] bg-[#F1FFD6]/40 p-6 text-center">
                    <h2 className="text-lg font-bold text-[#111111]">Ready to work on this project?</h2>
                    <p className="mt-1.5 text-sm text-[#4B5563]">Send your proposal and tell the client why you're the right fit.</p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                      <ProposalAction
                        variant="band"
                        user={user}
                        canApply={!!canApply}
                        isClosed={isClosed}
                        alreadyApplied={!!alreadyApplied}
                        project={project}
                        navigate={navigate}
                        id={id}
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        coverLetter={coverLetter}
                        setCoverLetter={setCoverLetter}
                        resumeUrl={resumeUrl}
                        setResumeUrl={setResumeUrl}
                        proposedRate={proposedRate}
                        setProposedRate={setProposedRate}
                        deliveryDays={deliveryDays}
                        setDeliveryDays={setDeliveryDays}
                        applyMutation={applyMutation}
                      />
                      {canApply && !isClosed && !alreadyApplied && (
                        <SaveButton type="project" id={project._id} className="h-11 w-11 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Right — sticky project summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-sm font-bold text-[#111111]">Project Details</h2>

              <div className="mt-4 border-t border-[#F1F3EF] pt-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  <Wallet className="h-3.5 w-3.5" /> Budget
                </p>
                <p className="mt-1 text-xl font-extrabold text-[#111111]">{budgetLabel(project.budgetMin, project.budgetMax, project.currency)}</p>
                {project.budgetMin > 0 && <p className="mt-0.5 text-[11px] text-[#9CA3AF]">Freelancers can still bid outside this range.</p>}
              </div>

              {!!project.expectedDeliveryDays && (
                <div className="mt-4 border-t border-[#F1F3EF] pt-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <Clock className="h-3.5 w-3.5" /> Duration
                  </p>
                  <p className="mt-1 text-base font-bold text-[#111111]">
                    {project.expectedDeliveryDays} day{project.expectedDeliveryDays === 1 ? "" : "s"}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[#F1F3EF] pt-4 text-sm">
                <span className="flex items-center gap-1.5 text-[#6B7280]">
                  <Users2 className="h-4 w-4" /> Proposals
                </span>
                <span className="font-bold text-[#111111]">{project.applicationsCount}</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#F1F3EF] pt-4 text-sm">
                <span className="flex items-center gap-1.5 text-[#6B7280]">
                  {project.isRemote ? <Wifi className="h-4 w-4" /> : <MapPin className="h-4 w-4" />} Location
                </span>
                <span className="font-semibold text-[#111111]">{project.isRemote ? "Remote" : project.location}</span>
              </div>

              <div className="mt-5 border-t border-[#F1F3EF] pt-5">
                {ndaGated ? (
                  <p className="text-center text-xs text-[#9CA3AF]">Accept the NDA to submit a proposal.</p>
                ) : (
                  <ProposalAction
                    variant="sidebar"
                    user={user}
                    canApply={!!canApply}
                    isClosed={isClosed}
                    alreadyApplied={!!alreadyApplied}
                    project={project}
                    navigate={navigate}
                    id={id}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    coverLetter={coverLetter}
                    setCoverLetter={setCoverLetter}
                    resumeUrl={resumeUrl}
                    setResumeUrl={setResumeUrl}
                    proposedRate={proposedRate}
                    setProposedRate={setProposedRate}
                    deliveryDays={deliveryDays}
                    setDeliveryDays={setDeliveryDays}
                    applyMutation={applyMutation}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related projects — real projects.list() results, same category */}
        {relatedProjects.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#111111]">You may also like</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map((p) => (
                <ProjectCard key={p._id} project={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {!ndaGated && canApply && !isClosed && !alreadyApplied && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-[#E5E7EB] bg-white p-3 lg:hidden">
          <SaveButton type="project" id={project._id} className="h-12 w-12 shrink-0 border border-[#E5E7EB] bg-white text-[#6B7280]" />
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            Submit Proposal <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function cnBadge(accepted?: boolean) {
  return accepted
    ? "flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]"
    : "flex items-center gap-1 rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-bold text-[#4B5563]";
}

// ============================================================
// Proposal action — the single source of truth for "what should this CTA
// say/do right now", shared between the bottom band and the sidebar so
// logged-out visitors, non-freelancers, closed projects, and already-applied
// freelancers all see a consistent, real state instead of one spot being
// adaptive and the other just vanishing.
// ============================================================
function ProposalAction({
  variant,
  user,
  canApply,
  isClosed,
  alreadyApplied,
  project,
  navigate,
  id,
  ...dialogProps
}: {
  variant: "band" | "sidebar";
  user: { id: string } | null;
  canApply: boolean;
  isClosed: boolean;
  alreadyApplied: boolean;
  project: { _id: string; title: string; companyName: string; currency: string };
  navigate: (path: string, opts?: { state?: unknown }) => void;
  id: string;
} & Omit<Parameters<typeof ProposalDialogTrigger>[0], "project" | "fullWidth">) {
  const fullWidth = variant === "sidebar";
  const sizing = fullWidth ? "flex h-12 w-full items-center justify-center" : "flex h-12 items-center justify-center px-8";

  if (!canApply) {
    return (
      <button
        type="button"
        onClick={() => (user ? undefined : navigate("/login", { state: { from: `/projects/${id}` } }))}
        disabled={!!user}
        className={`${sizing} rounded-[14px] border border-[#E5E7EB] text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-60`}
      >
        {user ? "Only freelancers can bid" : "Log in to Submit a Proposal"}
      </button>
    );
  }
  if (isClosed) {
    return <div className={`${sizing} rounded-[14px] bg-[#F1F3EF] text-sm font-semibold text-[#6B7280]`}>This project is closed</div>;
  }
  if (alreadyApplied) {
    return (
      <div className={`${sizing} gap-2 rounded-[14px] border border-[#16A34A]/30 bg-[#ECFDF3] text-sm font-semibold text-[#16A34A]`}>
        <CheckCircle2 className="h-4 w-4" /> Proposal Sent
      </div>
    );
  }
  return <ProposalDialogTrigger project={project} fullWidth={fullWidth} {...dialogProps} />;
}

// ============================================================
// Proposal dialog — same real form/mutation as before (pitch, bid, delivery
// days, optional resume upload), just restyled and shared between the
// bottom CTA band and the sidebar trigger so both open the same dialog.
// ============================================================
function ProposalDialogTrigger({
  project,
  open,
  onOpenChange,
  coverLetter,
  setCoverLetter,
  resumeUrl,
  setResumeUrl,
  proposedRate,
  setProposedRate,
  deliveryDays,
  setDeliveryDays,
  applyMutation,
  fullWidth,
}: {
  project: { _id: string; title: string; companyName: string; currency: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverLetter: string;
  setCoverLetter: (v: string) => void;
  resumeUrl: string;
  setResumeUrl: (v: string) => void;
  proposedRate: number;
  setProposedRate: (v: number) => void;
  deliveryDays: number;
  setDeliveryDays: (v: number) => void;
  applyMutation: { mutate: () => void; isPending: boolean; isError: boolean; error: unknown };
  fullWidth?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            fullWidth
              ? "flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
              : "flex h-12 items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          }
        >
          Submit Proposal <ArrowRight className="h-4 w-4" />
        </button>
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
            <Input type="number" min={0} value={proposedRate || ""} onChange={(e) => setProposedRate(Number(e.target.value))} placeholder="e.g. 25000" />
          </div>
          <div className="space-y-1.5">
            <Label>Delivery Time (days)</Label>
            <Input type="number" min={0} value={deliveryDays || ""} onChange={(e) => setDeliveryDays(Number(e.target.value))} placeholder="e.g. 14" />
          </div>
        </div>
        <div className="mt-3">
          <FileUpload folder="resume" accept="application/pdf" value={resumeUrl} onUploaded={(url) => setResumeUrl(url)} label="Upload your resume (PDF, optional)" />
        </div>
        {applyMutation.isError && (
          <p className="mt-2 text-xs text-[#EF4444]">
            {isAxiosError(applyMutation.error) ? applyMutation.error.response?.data?.message : "Something went wrong."}
          </p>
        )}
        <button
          type="button"
          onClick={() => applyMutation.mutate()}
          disabled={applyMutation.isPending}
          className="mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
        >
          {applyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Proposal
        </button>
      </DialogContent>
    </Dialog>
  );
}

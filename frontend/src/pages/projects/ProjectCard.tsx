import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Wallet, Timer, Users2, Send, MessageSquare, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { InfoCell } from "@/components/shared/InfoCell";
import { BidModal } from "./BidModal";
import { chatApi } from "@/api/chat";
import { jobApi } from "@/api/jobs";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { Project } from "@/types";

const TYPE_LABELS: Record<Project["type"], string> = {
  contract: "Ongoing Contract",
  freelance: "One-off Project",
};

export function ProjectCard({ project }: { project: Project }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const employer = typeof project.employer === "object" ? project.employer : null;
  const employerId = employer?._id;
  const isOwnProject = !!user && !!employerId && user.id === employerId;
  const visibleSkills = project.skills.slice(0, 4);
  const extraSkillsCount = project.skills.length - visibleSkills.length;

  // Shares the same ["applications", "mine"] cache as FreelancerApplications
  // and ProjectDetails — react-query dedupes this across every card on the
  // page into a single request, not one per card.
  const { data: myApplications } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: jobApi.myApplications,
    enabled: !!user && user.role === "freelancer",
  });
  const alreadyApplied = myApplications?.some((a) => (typeof a.job === "string" ? a.job : a.job._id) === project._id);

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(employerId!),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const handleBid = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    if (user.role !== "freelancer") return navigate(`/projects/${project._id}`);
    setBidModalOpen(true);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    if (employerId) messageMutation.mutate();
  };

  return (
    <Link to={`/projects/${project._id}`} className="block h-full">
      <div className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-foreground/15 hover:shadow-hover">
        <div className="flex flex-1 flex-col p-4">
          {/* Employer */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                <AvatarImage src={employer?.avatar} alt={project.companyName} className="rounded-xl object-cover" />
                <AvatarFallback className="rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
                  {project.companyName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-foreground">{project.title}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">{project.companyName}</p>
              </div>
            </div>
            <div onClick={(e) => e.preventDefault()}>
              <SaveButton type="project" id={project._id} className="h-7 w-7 shrink-0 bg-muted text-muted-foreground hover:bg-muted/80" />
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{TYPE_LABELS[project.type]}</span>
            {project.category && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {project.subCategory || project.category}
              </span>
            )}
            {project.location && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <MapPin className="h-3 w-3" /> {project.isRemote ? "Remote" : project.location}
              </span>
            )}
          </div>

          <p className="mt-2 line-clamp-2 min-h-[2.2em] text-[12px] leading-snug text-muted-foreground">{project.description}</p>

          {/* Info grid */}
          <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-2 rounded-xl bg-muted p-2.5 text-[11px]">
            <InfoCell
              icon={Wallet}
              label="Budget"
              value={
                project.budgetMin > 0
                  ? `${formatCurrency(project.budgetMin)}${project.budgetMax > project.budgetMin ? `+` : ""}`
                  : "Open"
              }
            />
            <InfoCell
              icon={Timer}
              label="Delivery"
              value={project.expectedDeliveryDays ? `${project.expectedDeliveryDays}d` : "Flexible"}
            />
            <InfoCell icon={Users2} label="Proposals" value={String(project.applicationsCount)} />
          </div>

          {visibleSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {visibleSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-primary/5 px-2 py-0.5 text-[10.5px] font-medium text-primary/90">
                  {skill}
                </span>
              ))}
              {extraSkillsCount > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">+{extraSkillsCount} more</span>
              )}
            </div>
          )}

          {!isOwnProject && (
            <div className="mt-auto grid grid-cols-[1fr_auto] gap-1.5 pt-3.5">
              {alreadyApplied ? (
                <div className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success/10 text-[13px] font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Proposal Sent
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBid}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-colors group-hover:bg-primary/90"
                >
                  <Send className="h-3.5 w-3.5" /> Bid
                </button>
              )}
              <button
                type="button"
                aria-label="Message"
                title="Message"
                disabled={messageMutation.isPending}
                onClick={handleMessage}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
              >
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {employerId && (
        <BidModal projectId={project._id} projectTitle={project.title} open={bidModalOpen} onOpenChange={setBidModalOpen} />
      )}
    </Link>
  );
}

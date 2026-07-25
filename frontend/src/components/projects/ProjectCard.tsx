import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Wallet, Timer, Users2, Send, MessageSquare, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { BidModal } from "./BidModal";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/context/AuthContext";
import { cn, formatCurrency } from "@/lib/utils";
import type { Project } from "@/types";

const TYPE_LABELS: Record<Project["type"], string> = {
  contract: "Ongoing Contract",
  freelance: "One-off Project",
};

const TYPE_STYLES: Record<Project["type"], string> = {
  freelance: "bg-secondary/10 text-secondary",
  contract: "bg-primary/10 text-primary",
};

export function ProjectCard({ project }: { project: Project }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const employer = typeof project.employer === "object" ? project.employer : null;
  const employerId = employer?._id;
  const isOwnProject = !!user && !!employerId && user.id === employerId;
  const visibleSkills = project.skills.slice(0, 3);
  const extraSkillsCount = project.skills.length - visibleSkills.length;

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
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card">
      <Link to={`/projects/${project._id}`}>
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0 rounded-xl">
              <AvatarImage src={employer?.avatar} alt={project.companyName} className="rounded-xl object-cover" />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                {project.companyName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="line-clamp-2 text-[15px] font-semibold leading-tight">{project.title}</p>
              <p className="truncate text-xs text-muted-foreground">{project.companyName}</p>
            </div>
          </div>
          <SaveButton type="project" id={project._id} className="h-7 w-7 shrink-0 bg-muted text-muted-foreground hover:bg-muted hover:text-primary" />
        </div>

        <div className="px-5 pt-3">
          <Badge className={cn("mb-3 text-[10px] font-semibold", TYPE_STYLES[project.type])}>{TYPE_LABELS[project.type]}</Badge>

          <p className="mb-4 line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed text-muted-foreground">{project.description}</p>

          {visibleSkills.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">Skills Required</p>
              <div className="flex flex-wrap gap-1.5">
                {visibleSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px]">
                    {skill}
                  </Badge>
                ))}
                {extraSkillsCount > 0 && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    +{extraSkillsCount}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <Wallet className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">Budget</p>
                <p className="truncate text-[12.5px] font-semibold text-success">
                  {project.budgetMin > 0
                    ? `${formatCurrency(project.budgetMin)}${project.budgetMax > project.budgetMin ? `–${formatCurrency(project.budgetMax)}` : ""}`
                    : "Open"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Timer className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">Delivery</p>
                <p className="truncate text-[12.5px] font-semibold">
                  {project.expectedDeliveryDays ? `${project.expectedDeliveryDays} day${project.expectedDeliveryDays === 1 ? "" : "s"}` : "Flexible"}
                </p>
              </div>
            </div>
          </div>

          {project.applicationsCount > 0 && (
            <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users2 className="h-3 w-3" /> {project.applicationsCount} proposal{project.applicationsCount === 1 ? "" : "s"} so far
            </p>
          )}
        </div>
      </Link>

      {!isOwnProject && (
        <div className="grid grid-cols-2 gap-2 p-5 pt-4">
          <Button variant="gradient" size="sm" className="min-w-0" onClick={handleBid}>
            <Send className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Bid</span>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0" disabled={messageMutation.isPending} onClick={handleMessage}>
            {messageMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">Message</span>
          </Button>
        </div>
      )}

      {employerId && (
        <BidModal projectId={project._id} projectTitle={project.title} open={bidModalOpen} onOpenChange={setBidModalOpen} />
      )}
    </Card>
  );
}

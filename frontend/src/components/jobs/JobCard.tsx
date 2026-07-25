import { Link } from "react-router-dom";
import { MapPin, Briefcase, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { formatCurrency } from "@/lib/utils";
import type { Job } from "@/types";

const TYPE_LABELS: Record<Job["type"], string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

export function JobCard({ job }: { job: Job }) {
  const employer = typeof job.employer === "object" ? job.employer : null;

  return (
    <Link to={`/jobs/${job._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0 rounded-lg">
              <AvatarImage src={employer?.avatar} alt={job.companyName} className="rounded-lg object-cover" />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                {job.companyName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{job.title}</p>
              <p className="truncate text-xs text-muted-foreground">{job.companyName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {TYPE_LABELS[job.type]}
            </Badge>
            <SaveButton type="job" id={job._id} className="h-6 w-6 bg-muted text-muted-foreground hover:bg-muted hover:text-primary" />
          </div>
        </div>

        <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{job.description}</p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {job.isRemote ? <Wifi className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
            {job.isRemote ? "Remote" : job.location}
          </span>
          {job.salaryMin > 0 && (
            <span className="flex items-center gap-1 font-semibold text-success">
              <Briefcase className="h-3.5 w-3.5" />
              {formatCurrency(job.salaryMin)}
              {job.salaryMax > job.salaryMin ? ` - ${formatCurrency(job.salaryMax)}` : ""}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

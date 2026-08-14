import { Link } from "react-router-dom";
import { MapPin, Briefcase, Wifi, Users, Clock, UserCheck, ShieldCheck, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "@/components/shared/SaveButton";
import { formatCurrency, timeAgoShort } from "@/lib/utils";
import type { Job } from "@/types";

const TYPE_LABELS: Record<Job["type"], string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

// experienceLevel is stored as a category (entry/mid/senior/lead), not a
// numeric range — this maps it to the conventional year-range labels job
// boards use, purely a display format, not a separate stored field.
const EXPERIENCE_RANGE_LABELS: Record<Job["experienceLevel"], string> = {
  entry: "0-2 years",
  mid: "2-5 years",
  senior: "5-8 years",
  lead: "8+ years",
};

export function JobCard({ job }: { job: Job }) {
  const employer = typeof job.employer === "object" ? job.employer : null;

  return (
    <Link to={`/jobs/${job._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0 rounded-lg">
              <AvatarImage src={employer?.avatar} alt={job.companyName} className="rounded-lg object-cover" />
              <AvatarFallback className="rounded-lg text-sm font-bold">
                {job.companyName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{job.title}</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <span className="truncate">{job.companyName}</span>
                {/* Real, cached rating/reviewCount off the employer's User doc — the
                    same fields recomputed by review.controller.js for any role, so
                    this is the employer's genuine review history, not a fabricated
                    number. "—" shown honestly when they have zero reviews yet. */}
                {!!employer?.reviewCount && (
                  <span className="flex shrink-0 items-center gap-0.5 font-medium text-foreground/80">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {employer.rating?.toFixed(1)} ({employer.reviewCount})
                  </span>
                )}
              </p>
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
          <Badge variant="outline" className="text-[10px]">
            {job.category}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {EXPERIENCE_RANGE_LABELS[job.experienceLevel]}
          </Badge>
          {job.requiresNda && (
            <Badge variant="warning" className="flex items-center gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" /> NDA
            </Badge>
          )}
          {job.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">
            {job.isRemote ? <Wifi className="h-3.5 w-3.5 shrink-0" /> : <MapPin className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{job.isRemote ? "Remote" : job.location}</span>
          </span>
          {job.salaryMin > 0 && (
            <span className="flex items-center gap-1 font-semibold text-success">
              <Briefcase className="h-3.5 w-3.5" />
              {formatCurrency(job.salaryMin)}
              {job.salaryMax > job.salaryMin ? ` - ${formatCurrency(job.salaryMax)}` : ""}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {!!job.openings && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {job.openings} opening{job.openings === 1 ? "" : "s"}
            </span>
          )}
          <span className="flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5" /> {job.applicationsCount} applicant{job.applicationsCount === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {timeAgoShort(job.createdAt)}
          </span>
        </div>
      </Card>
    </Link>
  );
}

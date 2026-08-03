import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFromName } from "@/lib/utils";
import type { JobSeekerSummary } from "@/types";

export function JobSeekerCard({ jobSeeker }: { jobSeeker: JobSeekerSummary }) {
  return (
    <Link to={`/job-seekers/${jobSeeker._id}`}>
      <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={jobSeeker.avatar} alt={jobSeeker.name} />
            <AvatarFallback>{initialsFromName(jobSeeker.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{jobSeeker.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {jobSeeker.jobSeekerProfile?.desiredRole || jobSeeker.headline || "Job Seeker"}
            </p>
          </div>
        </div>
        {jobSeeker.location && (
          <span className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {jobSeeker.location}
          </span>
        )}
        <div className="mb-4 flex flex-1 flex-wrap gap-1.5">
          {jobSeeker.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          {jobSeeker.yearsOfExperience > 0 ? `${jobSeeker.yearsOfExperience} yrs experience` : "Fresher"}
        </div>
      </Card>
    </Link>
  );
}

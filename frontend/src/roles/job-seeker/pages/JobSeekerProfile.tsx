import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, Loader2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { jobSeekerApi } from "@/api/jobSeekers";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";

export default function JobSeekerProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: jobSeeker, isLoading } = useQuery({
    queryKey: ["job-seekers", id],
    queryFn: () => jobSeekerApi.getProfile(id),
    enabled: !!id,
  });

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(id),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!jobSeeker) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Job seeker not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/job-seekers">Back to Directory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={jobSeeker.avatar} alt={jobSeeker.name} />
                <AvatarFallback className="text-lg">{initialsFromName(jobSeeker.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold">{jobSeeker.name}</h1>
                <p className="text-sm text-muted-foreground">{jobSeeker.jobSeekerProfile?.desiredRole || jobSeeker.headline || "Job Seeker"}</p>
                {jobSeeker.location && (
                  <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {jobSeeker.location}
                  </span>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {jobSeeker.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {jobSeeker.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: renderBioHtml(jobSeeker.bio) }} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Expected Salary</p>
                <p className="text-lg font-bold text-success">
                  {jobSeeker.jobSeekerProfile?.expectedSalary ? formatCurrency(jobSeeker.jobSeekerProfile.expectedSalary) : "On request"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="text-lg font-bold">{jobSeeker.yearsOfExperience} yrs</p>
              </div>
              {jobSeeker.jobSeekerProfile?.noticePeriodDays !== undefined && jobSeeker.jobSeekerProfile.noticePeriodDays > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Notice Period</p>
                  <p className="text-sm font-medium">{jobSeeker.jobSeekerProfile.noticePeriodDays} days</p>
                </div>
              )}
              {!!jobSeeker.jobSeekerProfile?.preferredLocations?.length && (
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Locations</p>
                  <p className="text-sm font-medium">{jobSeeker.jobSeekerProfile.preferredLocations.join(", ")}</p>
                </div>
              )}
              {jobSeeker.resumeUrl && (
                <a
                  href={jobSeeker.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" /> View Resume
                </a>
              )}
              <Button
                className="w-full"
                variant="gradient"
                disabled={!user || messageMutation.isPending}
                onClick={() => (user ? messageMutation.mutate() : navigate("/login"))}
              >
                {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

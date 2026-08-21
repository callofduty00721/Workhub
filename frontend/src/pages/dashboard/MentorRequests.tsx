import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { resolveDashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mentorApi } from "@/api/mentors";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName } from "@/lib/utils";
import type { SessionStatus } from "@/types";

const STATUS_VARIANT: Record<SessionStatus, "default" | "warning" | "success" | "danger"> = {
  requested: "warning",
  confirmed: "default",
  completed: "success",
  cancelled: "danger",
};

export default function MentorRequests() {
  const { user } = useAuth();
  const { data: requests, isLoading } = useQuery({
    queryKey: ["mentors", "mine", "requests"],
    queryFn: mentorApi.myRequests,
  });

  return (
    <DashboardLayout role={resolveDashboardRole(user?.role)} title="My Mentor Requests" subtitle="Track the mentorship sessions you have requested.">
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}
            </div>
          ) : !requests?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No mentor requests yet</p>
              <p className="text-sm text-muted-foreground">Browse mentors and book a session to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((session) => {
                const mentor = typeof session.mentor === "object" ? session.mentor : null;
                return (
                  <div key={session._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={mentor?.avatar} />
                        <AvatarFallback className="text-xs">{mentor ? initialsFromName(mentor.name) : "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{session.topic}</p>
                        <p className="text-xs text-muted-foreground">with {mentor?.name ?? "Mentor"}</p>
                        {session.preferredTime && (
                          <p className="mt-1 text-xs text-muted-foreground">Preferred time: {new Date(session.preferredTime).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[session.status]} className="w-fit capitalize">{session.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
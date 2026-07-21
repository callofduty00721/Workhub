import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function MentorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useQuery({ queryKey: ["mentors", "mine", "sessions"], queryFn: mentorApi.mySessions });

  const statusMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: SessionStatus }) => mentorApi.updateSessionStatus(sessionId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentors", "mine", "sessions"] }),
  });

  return (
    <DashboardLayout role="mentor" title={`Welcome back, ${user?.name.split(" ")[0]} 👋`} subtitle="Manage your mentorship session requests.">
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-semibold">Session Requests</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !sessions?.length ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No session requests yet</p>
              <p className="text-sm text-muted-foreground">Complete your profile so founders and job seekers can find you.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const requester = typeof session.requester === "object" ? session.requester : null;
                return (
                  <div key={session._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={requester?.avatar} />
                        <AvatarFallback className="text-xs">{requester ? initialsFromName(requester.name) : "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{session.topic}</p>
                        <p className="text-xs text-muted-foreground">from {requester?.name}</p>
                        {session.message && <p className="mt-1 max-w-md text-xs text-foreground/80">{session.message}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={STATUS_VARIANT[session.status]} className="capitalize">
                        {session.status}
                      </Badge>
                      {session.status === "requested" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ sessionId: session._id, status: "confirmed" })}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" className="text-danger hover:bg-danger/10" onClick={() => statusMutation.mutate({ sessionId: session._id, status: "cancelled" })}>
                            Decline
                          </Button>
                        </>
                      )}
                      {session.status === "confirmed" && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ sessionId: session._id, status: "completed" })}>
                          Mark Completed
                        </Button>
                      )}
                    </div>
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

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { MapPin, Star, MessageSquare, CalendarClock, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { mentorApi } from "@/api/mentors";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { renderBioHtml } from "@/lib/richText";
import { useAuth } from "@/context/AuthContext";

export default function MentorProfile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const { data: mentor, isLoading } = useQuery({ queryKey: ["mentors", id], queryFn: () => mentorApi.getProfile(id), enabled: !!id });

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateConversation(id),
    onSuccess: (conversation) => navigate(`/dashboard/messages?c=${conversation._id}`),
  });

  const bookMutation = useMutation({
    mutationFn: () => mentorApi.requestSession(id, { topic, message, preferredTime: preferredTime || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors", "mine", "requests"] });
      setDialogOpen(false);
      setTopic("");
      setMessage("");
      setPreferredTime("");
    },
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Mentor not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/mentors">Back to Directory</Link>
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
                <AvatarImage src={mentor.avatar} alt={mentor.name} />
                <AvatarFallback className="text-lg">{initialsFromName(mentor.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold">{mentor.name}</h1>
                <p className="text-sm text-muted-foreground">{mentor.headline || "Mentor"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {mentor.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {mentor.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {mentor.rating || "New"} {mentor.reviewCount > 0 && `(${mentor.reviewCount})`}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mentor.expertise.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {(mentor.hoursPerWeekAvailable || mentor.workingDays?.length) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {!!mentor.hoursPerWeekAvailable && `${mentor.hoursPerWeekAvailable} hrs/week`}
                    {!!mentor.hoursPerWeekAvailable && !!mentor.workingDays?.length && " · "}
                    {!!mentor.workingDays?.length && mentor.workingDays.join(", ")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {mentor.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: renderBioHtml(mentor.bio) }} />
              </CardContent>
            </Card>
          )}

          <ReviewsSection targetType="user" targetId={mentor._id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Session Rate</p>
                <p className="text-lg font-bold text-success">{mentor.sessionRate > 0 ? `${formatCurrency(mentor.sessionRate)}/session` : "Free"}</p>
              </div>
              {mentor.sessionFormat && (
                <div>
                  <p className="text-xs text-muted-foreground">Session Format</p>
                  <p className="text-sm font-medium capitalize">{mentor.sessionFormat.replace("_", " ")}</p>
                </div>
              )}
              {!!mentor.completedSessionsCount && (
                <div>
                  <p className="text-xs text-muted-foreground">Sessions Completed</p>
                  <p className="text-sm font-medium">{mentor.completedSessionsCount}</p>
                </div>
              )}
              {mentor.linkedIn && (
                <a href={mentor.linkedIn} target="_blank" rel="noreferrer" className="block text-xs font-medium text-primary hover:underline">
                  LinkedIn
                </a>
              )}

              {!user ? (
                <Button className="w-full" variant="gradient" onClick={() => navigate("/login")}>
                  Log in to Book
                </Button>
              ) : bookMutation.isSuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> Request sent
                </div>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="gradient">
                      <CalendarClock className="h-4 w-4" /> Book a Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Book a session with {mentor.name}</DialogTitle>
                      <DialogDescription>Tell them what you'd like to discuss.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="topic">Topic</Label>
                        <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fundraising strategy" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="message">Message (optional)</Label>
                        <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[90px]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="preferredTime">Preferred Time (optional)</Label>
                        <Input id="preferredTime" type="datetime-local" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
                      </div>
                    </div>
                    {bookMutation.isError && (
                      <p className="mt-2 text-xs text-danger">
                        {isAxiosError(bookMutation.error) ? bookMutation.error.response?.data?.message : "Something went wrong."}
                      </p>
                    )}
                    <Button className="mt-4 w-full" variant="gradient" disabled={!topic.trim() || bookMutation.isPending} onClick={() => bookMutation.mutate()}>
                      {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send Request
                    </Button>
                  </DialogContent>
                </Dialog>
              )}

              <Button
                className="w-full"
                variant="outline"
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

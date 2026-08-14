import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Trophy, Clock, Users, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contestApi } from "@/api/contests";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { FileUpload } from "@/components/shared/FileUpload";
import { SaveButton } from "@/components/shared/SaveButton";
import { usePageMeta } from "@/lib/usePageMeta";

export default function ContestDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [entryTitle, setEntryTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: contest, isLoading } = useQuery({ queryKey: ["contests", id], queryFn: () => contestApi.getById(id), enabled: !!id });

  usePageMeta(contest ? contest.title : "Contest", contest ? contest.description.slice(0, 160) : undefined);

  const { data: myEntries } = useQuery({
    queryKey: ["contests", "entries", "mine"],
    queryFn: contestApi.myEntries,
    enabled: !!user && user.role === "freelancer",
  });

  const alreadyEntered = myEntries?.some((e) => (typeof e.contest === "string" ? e.contest : e.contest._id) === id);

  const submitMutation = useMutation({
    mutationFn: () => contestApi.submitEntry(id, { title: entryTitle, description, fileUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests", "entries", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["contests", id] });
      setDialogOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="container space-y-4 py-10">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg font-semibold">Contest not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/contests">Back to Contests</Link>
        </Button>
      </div>
    );
  }

  const canEnter = user && user.role === "freelancer";
  const daysLeft = Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="container py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Contests
      </button>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold">{contest.title}</h1>
                <SaveButton type="contest" id={contest._id} className="h-8 w-8 shrink-0 bg-muted text-muted-foreground hover:bg-muted hover:text-primary" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{contest.category}</Badge>
                <Badge variant="outline" className="capitalize">
                  {contest.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <h3 className="mb-2 text-base font-semibold">Brief</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{contest.description}</p>
              </div>
              {contest.skills.length > 0 && (
                <div>
                  <h3 className="mb-2 text-base font-semibold">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {contest.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Prize</p>
                <p className="flex items-center gap-1.5 text-lg font-bold text-success">
                  <Trophy className="h-4 w-4" /> {formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" /> {contest.entriesCount} entries so far
              </div>

              {!canEnter ? (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!user}
                  onClick={() => !user && navigate("/login", { state: { from: `/contests/${id}` } })}
                >
                  {user ? "Only freelancers can submit entries" : "Log in to Submit an Entry"}
                </Button>
              ) : alreadyEntered ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> Entry Submitted
                </div>
              ) : contest.status !== "open" ? (
                <Button className="w-full" variant="outline" disabled>
                  This contest is closed
                </Button>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="gradient">
                      Submit Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Your Entry</DialogTitle>
                      <DialogDescription>Share your best work for &quot;{contest.title}&quot;.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                      <Label>Entry Title</Label>
                      <Input value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} placeholder="e.g. Minimal logo concept" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain your approach..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <div className="mt-3">
                      <FileUpload folder="document" value={fileUrl} onUploaded={(url) => setFileUrl(url)} label="Upload your work (optional)" />
                    </div>
                    {submitMutation.isError && (
                      <p className="mt-2 text-xs text-danger">
                        {isAxiosError(submitMutation.error) ? submitMutation.error.response?.data?.message : "Something went wrong."}
                      </p>
                    )}
                    <Button
                      className="mt-4 w-full"
                      variant="gradient"
                      onClick={() => submitMutation.mutate()}
                      disabled={submitMutation.isPending || !entryTitle || !description}
                    >
                      {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Submit Entry
                    </Button>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

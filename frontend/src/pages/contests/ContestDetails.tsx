import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  FileImage,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Trophy,
  Users2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/shared/FileUpload";
import { SaveButton } from "@/components/shared/SaveButton";
import { ContestCard } from "@/pages/contests/ContestCard";
import { contestApi } from "@/api/contests";
import { chatApi } from "@/api/chat";
import { formatCurrency, initialsFromName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePageMeta } from "@/lib/usePageMeta";
import type { Contest } from "@/types";

function daysLeft(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isEndingSoon(contest: Contest) {
  return contest.status === "open" && daysLeft(contest.deadline) <= 3 && daysLeft(contest.deadline) > 0;
}

function postedLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ============================================================
// Status badge — real ContestStatus ("open" | "judging" | "closed") plus a
// computed "ending soon" window. No "Starting Soon" state — the real
// Contest model has no startDate, so every open contest already accepts
// entries.
// ============================================================
function StatusBadge({ contest }: { contest: Contest }) {
  if (contest.status === "closed") return <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-bold text-[#6B7280]">COMPLETED</span>;
  if (contest.status === "judging") return <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10.5px] font-bold text-[#2563EB]">JUDGING</span>;
  if (isEndingSoon(contest)) return <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10.5px] font-bold text-[#B45309]">ENDING SOON</span>;
  return <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]">OPEN</span>;
}

// Live countdown to the real deadline — ticks every second while mounted.
// Not shown at all once the deadline has passed or the contest is judging/closed.
function useCountdown(deadline: string, active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  const diff = new Date(deadline).getTime() - now;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountdownCard({ contest }: { contest: Contest }) {
  const active = contest.status === "open";
  const parts = useCountdown(contest.deadline, active);

  if (!active || !parts) {
    return (
      <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 text-center">
        <p className="text-sm font-semibold text-[#6B7280]">
          {contest.status === "judging" ? "Entries closed — judging in progress" : "Contest ended"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Contest ends in</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          { value: parts.days, label: "Days" },
          { value: parts.hours, label: "Hrs" },
          { value: parts.minutes, label: "Min" },
          { value: parts.seconds, label: "Sec" },
        ].map((p) => (
          <div key={p.label} className="flex flex-col items-center rounded-xl border border-[#E5E7EB] bg-[#F7F8F5] py-2.5">
            <span className="text-lg font-extrabold tabular-nums text-[#111111]">{String(p.value).padStart(2, "0")}</span>
            <span className="text-[9.5px] font-semibold text-[#9CA3AF]">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  const myEntry = myEntries?.find((e) => (typeof e.contest === "string" ? e.contest : e.contest._id) === id);

  const submitMutation = useMutation({
    mutationFn: () => contestApi.submitEntry(id, { title: entryTitle, description, fileUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests", "entries", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["contests", id] });
      setDialogOpen(false);
    },
  });

  const messageMutation = useMutation({
    mutationFn: (hostId: string) => chatApi.getOrCreateConversation(hostId),
    onSuccess: (c) => navigate(`/dashboard/messages?c=${c._id}`),
  });

  // Real related contests — same category, excluding this one.
  const { data: relatedData } = useQuery({
    queryKey: ["contests", "related", contest?.category],
    queryFn: () => contestApi.list({ category: contest!.category, limit: 4 }),
    enabled: !!contest?.category,
  });
  const relatedContests = (relatedData?.data ?? []).filter((c) => c._id !== id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-[#F7F8F5]">
        <div className="container space-y-4 py-10">
          <Skeleton className="h-4 w-64 bg-[#EDEFEA]" />
          <Skeleton className="h-32 w-full rounded-[20px] bg-[#EDEFEA]" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-96 w-full rounded-[20px] bg-[#EDEFEA]" />
            <Skeleton className="h-64 w-full rounded-[20px] bg-[#EDEFEA]" />
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="bg-[#F7F8F5] py-20 text-center">
        <p className="text-lg font-semibold text-[#111111]">Contest not found</p>
        <Link
          to="/contests"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF]"
        >
          Back to Contests
        </Link>
      </div>
    );
  }

  const host = typeof contest.client === "object" ? contest.client : null;
  const canEnter = user && user.role === "freelancer";
  const isClosed = contest.status !== "open";

  return (
    <div className="bg-[#F7F8F5] pb-24 lg:pb-10">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#111111]">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/contests" className="hover:text-[#111111]">
            Contests
          </Link>
          {contest.category && (
            <>
              {" "}
              /{" "}
              <Link to={`/contests?category=${encodeURIComponent(contest.category)}`} className="hover:text-[#111111]">
                {contest.category}
              </Link>
            </>
          )}{" "}
          / <span className="text-[#6B7280]">{contest.title}</span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Contests
        </button>

        {/* Contest hero */}
        <div className="mt-4 rounded-[20px] border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge contest={contest} />
              {contest.category && <span className="rounded-full bg-[#F1F3EF] px-2.5 py-1 text-[10.5px] font-medium text-[#4B5563]">{contest.category}</span>}
            </div>
            <SaveButton type="contest" id={contest._id} className="h-9 w-9 shrink-0 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
          </div>

          <h1 className="mt-3 text-xl font-extrabold leading-snug text-[#111111] sm:text-2xl">{contest.title}</h1>

          {host && (
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar className="h-9 w-9 rounded-xl border border-[#E5E7EB]">
                <AvatarImage src={host.avatar} alt={host.name} className="rounded-xl object-cover" />
                <AvatarFallback className="rounded-xl bg-[#111111] text-xs font-semibold text-white">{initialsFromName(host.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-[#9CA3AF]">Hosted by</p>
                <p className="text-sm font-bold text-[#111111]">{host.name}</p>
              </div>
            </div>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-[#9CA3AF]">
            <Calendar className="h-3.5 w-3.5" /> Posted {postedLabel(contest.createdAt)}
          </p>
        </div>

        {/* Main layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left — main content */}
          <div className="min-w-0 space-y-6">
            {/* Overview */}
            <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-base font-bold text-[#111111]">Contest Overview</h2>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-3">
                <OverviewItem label="Category" value={contest.category || "—"} />
                <OverviewItem label="Status" value={contest.status === "closed" ? "Completed" : contest.status === "judging" ? "Judging" : "Open"} />
                <OverviewItem label="Entries so far" value={String(contest.entriesCount)} />
                <OverviewItem label="Entry limit" value="1 per participant" />
                <OverviewItem label="Accepted formats" value="PNG, JPG, WEBP" />
                <OverviewItem label="Participation" value="Open to freelancers" />
              </div>
            </section>

            {/* About the contest */}
            <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-base font-bold text-[#111111]">About the Contest</h2>
              <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-[1.7] text-[#4B5563]">{contest.description}</p>

              {contest.skills.length > 0 && (
                <>
                  <h2 className="mt-6 text-base font-bold text-[#111111]">Skills Required</h2>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {contest.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-[#F3F5F1] px-2.5 py-1 text-[11.5px] font-medium text-[#4B5563]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h2 className="mt-6 text-base font-bold text-[#111111]">What to Submit</h2>
              <ul className="mt-2.5 space-y-1.5 text-[13.5px] text-[#4B5563]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" /> An entry title
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" /> A description of your approach
                </li>
                <li className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 shrink-0 text-[#9CA3AF]" /> A work file — PNG, JPG or WEBP (optional)
                </li>
              </ul>
            </section>

            {/* Host */}
            {host && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-base font-bold text-[#111111]">About the Host</h2>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-xl border border-[#E5E7EB]">
                      <AvatarImage src={host.avatar} alt={host.name} className="rounded-xl object-cover" />
                      <AvatarFallback className="rounded-xl bg-[#111111] text-sm font-semibold text-white">{initialsFromName(host.name)}</AvatarFallback>
                    </Avatar>
                    <p className="truncate text-sm font-bold text-[#111111]">{host.name}</p>
                  </div>
                  {user?.id !== host._id && (
                    <button
                      type="button"
                      disabled={messageMutation.isPending}
                      onClick={() => (user ? messageMutation.mutate(host._id) : navigate("/login", { state: { from: `/contests/${id}` } }))}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#111111] transition-colors hover:border-[#B6FF00] hover:bg-[#F1FFD6]/30 disabled:opacity-50"
                    >
                      {messageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Message
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* My submission — only when the logged-in freelancer actually has one */}
            {myEntry && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-base font-bold text-[#111111]">My Submission</h2>
                <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-[#F7F8F5] p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#111111]">{myEntry.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] text-[#6B7280]">{myEntry.description}</p>
                    <p className="mt-2 text-[11px] text-[#9CA3AF]">Submitted {postedLabel(myEntry.createdAt)}</p>
                  </div>
                  <span
                    className={
                      myEntry.isWinner
                        ? "flex shrink-0 items-center gap-1 rounded-full bg-[#FFFBEB] px-2.5 py-1 text-[10.5px] font-bold text-[#B45309]"
                        : "flex shrink-0 items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[10.5px] font-bold text-[#16A34A]"
                    }
                  >
                    {myEntry.isWinner ? (
                      <>
                        <Award className="h-3 w-3" /> Winner
                      </>
                    ) : (
                      "Submitted"
                    )}
                  </span>
                </div>
              </section>
            )}

            {/* Entry CTA band — always shown once loaded, adapts to auth/role/status */}
            <section className="rounded-[20px] border border-[#E5E7EB] bg-[#F1FFD6]/40 p-6 text-center">
              <h2 className="text-lg font-bold text-[#111111]">Ready to enter this contest?</h2>
              <p className="mt-1.5 text-sm text-[#4B5563]">Submit your best work and tell the host why it stands out.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <EntryAction
                  variant="band"
                  user={user}
                  canEnter={!!canEnter}
                  isClosed={isClosed}
                  hasEntry={!!myEntry}
                  contest={contest}
                  navigate={navigate}
                  id={id}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  entryTitle={entryTitle}
                  setEntryTitle={setEntryTitle}
                  description={description}
                  setDescription={setDescription}
                  fileUrl={fileUrl}
                  setFileUrl={setFileUrl}
                  submitMutation={submitMutation}
                />
                {canEnter && !isClosed && !myEntry && (
                  <SaveButton type="contest" id={contest._id} className="h-11 w-11 border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F1F3EF]" />
                )}
              </div>
            </section>
          </div>

          {/* Right — sticky prize + countdown + CTA sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {contest.prizeAmount > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  <Trophy className="h-3.5 w-3.5 text-[#B45309]" /> Prize Pool
                </p>
                <p className="mt-1.5 text-3xl font-extrabold text-[#111111]">{formatCurrency(contest.prizeAmount, contest.currency as "INR" | "USD")}</p>
              </div>
            )}

            <CountdownCard contest={contest} />

            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-[#6B7280]">
                  <Users2 className="h-4 w-4" /> Entries
                </span>
                <span className="font-bold text-[#111111]">{contest.entriesCount}</span>
              </div>
              {host?.email && (
                <div className="mt-3 flex items-center justify-between border-t border-[#F1F3EF] pt-3 text-sm">
                  <span className="flex items-center gap-1.5 text-[#6B7280]">
                    <MapPin className="h-4 w-4" /> Hosted by
                  </span>
                  <span className="font-semibold text-[#111111]">{host.name}</span>
                </div>
              )}

              <div className="mt-5 border-t border-[#F1F3EF] pt-5">
                <EntryAction
                  variant="sidebar"
                  user={user}
                  canEnter={!!canEnter}
                  isClosed={isClosed}
                  hasEntry={!!myEntry}
                  contest={contest}
                  navigate={navigate}
                  id={id}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  entryTitle={entryTitle}
                  setEntryTitle={setEntryTitle}
                  description={description}
                  setDescription={setDescription}
                  fileUrl={fileUrl}
                  setFileUrl={setFileUrl}
                  submitMutation={submitMutation}
                />
              </div>
            </div>
          </div>
        </div>

        {/* More contests — real contestApi.list() results, same category */}
        {relatedContests.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#111111]">More Contests</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedContests.map((c) => (
                <ContestCard key={c._id} contest={c} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {canEnter && !isClosed && !myEntry && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-[#E5E7EB] bg-white p-3 lg:hidden">
          <SaveButton type="contest" id={contest._id} className="h-12 w-12 shrink-0 border border-[#E5E7EB] bg-white text-[#6B7280]" />
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          >
            Submit Entry <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#111111]">{value}</p>
    </div>
  );
}

// ============================================================
// Entry action — single source of truth for the CTA state, shared between
// the bottom band and the sidebar so logged-out visitors, non-freelancers,
// closed contests, and already-entered freelancers all see a consistent
// real state instead of one spot going empty.
// ============================================================
function EntryAction({
  variant,
  user,
  canEnter,
  isClosed,
  hasEntry,
  contest,
  navigate,
  id,
  ...dialogProps
}: {
  variant: "band" | "sidebar";
  user: { id: string } | null;
  canEnter: boolean;
  isClosed: boolean;
  hasEntry: boolean;
  contest: Contest;
  navigate: (path: string, opts?: { state?: unknown }) => void;
  id: string;
} & Omit<Parameters<typeof EntryDialogTrigger>[0], "contest" | "fullWidth">) {
  const fullWidth = variant === "sidebar";
  const sizing = fullWidth ? "flex h-12 w-full items-center justify-center" : "flex h-12 items-center justify-center px-8";

  if (!canEnter) {
    return (
      <button
        type="button"
        onClick={() => (user ? undefined : navigate("/login", { state: { from: `/contests/${id}` } }))}
        disabled={!!user}
        className={`${sizing} rounded-[14px] border border-[#E5E7EB] text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F1F3EF] disabled:opacity-60`}
      >
        {user ? "Only freelancers can enter" : "Log in to Submit an Entry"}
      </button>
    );
  }
  if (isClosed) {
    return <div className={`${sizing} rounded-[14px] bg-[#F1F3EF] text-sm font-semibold text-[#6B7280]`}>Contest Closed</div>;
  }
  if (hasEntry) {
    return (
      <div className={`${sizing} gap-2 rounded-[14px] border border-[#16A34A]/30 bg-[#ECFDF3] text-sm font-semibold text-[#16A34A]`}>
        <CheckCircle2 className="h-4 w-4" /> Entry Submitted
      </div>
    );
  }
  return <EntryDialogTrigger contest={contest} fullWidth={fullWidth} {...dialogProps} />;
}

// ============================================================
// Entry submission dialog — same real form/mutation as before (title,
// description, optional work file), restyled and shared between the bottom
// CTA band and the sidebar trigger.
// ============================================================
function EntryDialogTrigger({
  contest,
  open,
  onOpenChange,
  entryTitle,
  setEntryTitle,
  description,
  setDescription,
  fileUrl,
  setFileUrl,
  submitMutation,
  fullWidth,
}: {
  contest: { title: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryTitle: string;
  setEntryTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  fileUrl: string;
  setFileUrl: (v: string) => void;
  submitMutation: { mutate: () => void; isPending: boolean; isError: boolean; error: unknown };
  fullWidth?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            fullWidth
              ? "flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
              : "flex h-12 items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111]"
          }
        >
          <Sparkles className="h-4 w-4" /> Submit Entry
        </button>
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
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain your approach..." className="min-h-[120px]" />
        </div>
        <div className="mt-3">
          <FileUpload folder="document" value={fileUrl} onUploaded={(url) => setFileUrl(url)} label="Upload your work — PNG, JPG or WEBP (optional)" />
        </div>
        {submitMutation.isError && (
          <p className="mt-2 text-xs text-[#EF4444]">
            {isAxiosError(submitMutation.error) ? submitMutation.error.response?.data?.message : "Something went wrong."}
          </p>
        )}
        <button
          type="button"
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !entryTitle || !description}
          className="mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-[#B6FF00] hover:text-[#111111] disabled:opacity-50"
        >
          {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Entry
        </button>
      </DialogContent>
    </Dialog>
  );
}

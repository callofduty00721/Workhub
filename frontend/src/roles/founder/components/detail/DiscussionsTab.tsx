import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Loader2, MessageCircle, Eye, ThumbsUp, Reply, Flag, Heart, Ban, Lightbulb, CheckCircle2, FileText, Send, HelpCircle, Handshake, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { discussionApi } from "@/api/discussions";
import { cn, initialsFromName } from "@/lib/utils";
import type { Discussion, DiscussionComment } from "@/types";
import { EmptyNote, timeAgo } from "./shared";

const DISCUSSION_CATEGORIES = ["All Discussions", "Questions", "Feedback", "Partnerships", "General"] as const;
const POST_CATEGORIES = ["Questions", "Feedback", "Partnerships", "General"] as const;

const CATEGORY_META: Record<Discussion["category"], { bg: string; fg: string; icon: typeof HelpCircle }> = {
  Questions: { bg: "#F5F5F5", fg: "#171717", icon: HelpCircle },
  Feedback: { bg: "#fdf1de", fg: "#d97706", icon: MessageCircle },
  Partnerships: { bg: "#f1ebfc", fg: "#7c3aed", icon: Handshake },
  Investors: { bg: "#F5F5F5", fg: "#171717", icon: Briefcase },
  General: { bg: "#e0f6f6", fg: "#0d9488", icon: HelpCircle },
};

export function DiscussionsTab({
  startupId,
  canPost,
  open,
  onOpenChange,
}: {
  startupId: string;
  canPost: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<(typeof DISCUSSION_CATEGORIES)[number]>("All Discussions");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postCategory, setPostCategory] = useState<Discussion["category"]>("General");
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [reportOpenId, setReportOpenId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const { data: discussions, isLoading } = useQuery({
    queryKey: ["startups", startupId, "discussions", category],
    queryFn: () => discussionApi.list(startupId, category === "All Discussions" ? undefined : category),
  });

  const { data: allDiscussions } = useQuery({
    queryKey: ["startups", startupId, "discussions", "all"],
    queryFn: () => discussionApi.list(startupId),
  });

  const createMutation = useMutation({
    mutationFn: () => discussionApi.create(startupId, { title, body, category: postCategory }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "discussions"] });
      setTitle("");
      setBody("");
      onOpenChange(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: (discussionId: string) => discussionApi.toggleLike(discussionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups", startupId, "discussions"] }),
  });

  const reportMutation = useMutation({
    mutationFn: (discussionId: string) => discussionApi.report(discussionId, reportReason),
    onSuccess: (_data, discussionId) => {
      setReportedIds((prev) => new Set(prev).add(discussionId));
      setReportOpenId(null);
      setReportReason("");
    },
  });

  const filtered = (discussions ?? []).filter(
    (d) => !search.trim() || d.title.toLowerCase().includes(search.trim().toLowerCase()) || d.body.toLowerCase().includes(search.trim().toLowerCase())
  );
  const visible = showAll ? filtered : filtered.slice(0, 5);

  const popularDiscussions = [...(allDiscussions ?? [])]
    .sort((a, b) => b.likes.length + b.commentCount - (a.likes.length + a.commentCount))
    .slice(0, 5);

  return (
    <div>
      <h3 className="text-[19px] font-extrabold text-foreground">Discussions</h3>
      <p className="mt-1 text-[12.5px] text-muted-foreground">Ask questions, share ideas and get suggestions from the community.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discussions..." className="pl-9" />
        </div>
        {canPost && (
          <button
            onClick={() => onOpenChange(!open)}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-bold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Start Discussion
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-2 rounded-xl border border-border p-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Discussion title" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ask a question, share feedback, or propose a partnership..." className="min-h-[80px]" />
          <Select value={postCategory} onValueChange={(v) => setPostCategory(v as Discussion["category"])}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POST_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => title.trim() && body.trim() && createMutation.mutate()} disabled={!title.trim() || !body.trim() || createMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12px] font-bold text-primary-foreground">
            {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Post
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {DISCUSSION_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setShowAll(false);
              }}
              className={cn("rounded-full px-3 py-1.5 text-[11.5px] font-semibold", category === c ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <EmptyNote text="Loading discussions..." />
          ) : !filtered.length ? (
            <EmptyNote text="No discussions yet. Be the first to start one." />
          ) : (
            <>
              <div className="divide-y divide-border">
                {visible.map((d) => {
                  const meta = CATEGORY_META[d.category];
                  const Icon = meta.icon;
                  return (
                    <div key={d._id} className="py-4 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-[13.5px] font-bold">{d.title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground/70">
                              Asked by {d.author.name} · {timeAgo(d.createdAt)}
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                                {d.category}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-[11.5px] text-muted-foreground">
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {d.commentCount} Replies</span>
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {d.viewCount} Views</span>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 pl-12 text-[12.5px] text-muted-foreground">{d.body}</p>
                      <div className="mt-2 flex items-center gap-4 pl-12">
                        <button onClick={() => likeMutation.mutate(d._id)} className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground">
                          <ThumbsUp className="h-3.5 w-3.5" /> {d.likes.length}
                        </button>
                        <button
                          onClick={() => setOpenReplyId(openReplyId === d._id ? null : d._id)}
                          className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
                        >
                          <Reply className="h-3.5 w-3.5" /> Reply
                        </button>
                        {canPost && (
                          <button
                            onClick={() => {
                              if (reportedIds.has(d._id)) return;
                              setReportOpenId(reportOpenId === d._id ? null : d._id);
                            }}
                            disabled={reportedIds.has(d._id)}
                            className={cn(
                              "flex items-center gap-1 text-[11.5px]",
                              reportedIds.has(d._id) ? "text-muted-foreground/70" : "text-muted-foreground hover:text-danger"
                            )}
                          >
                            <Flag className="h-3.5 w-3.5" /> {reportedIds.has(d._id) ? "Reported" : "Report"}
                          </button>
                        )}
                      </div>

                      {reportOpenId === d._id && (
                        <div className="ml-12 mt-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3">
                          <p className="text-[11.5px] font-semibold text-danger">Why are you reporting this discussion?</p>
                          <Textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Optional details for the moderation team..."
                            className="mt-2 min-h-[56px] bg-card text-[12px]"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => reportMutation.mutate(d._id)}
                              disabled={reportMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-[11.5px] font-bold text-danger-foreground hover:opacity-90"
                            >
                              {reportMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Submit Report
                            </button>
                            <button onClick={() => setReportOpenId(null)} className="rounded-lg border border-border px-3 py-1.5 text-[11.5px] font-bold text-foreground hover:bg-card">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {openReplyId === d._id && <DiscussionReplies discussionId={d._id} startupId={startupId} canPost={canPost} />}
                    </div>
                  );
                })}
              </div>
              {filtered.length > 5 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-4 w-full rounded-lg border border-border py-2.5 text-[12.5px] font-bold text-foreground hover:bg-muted"
                >
                  {showAll ? "Show Fewer Discussions" : "Load More Discussions"}
                </button>
              )}
            </>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border p-4">
            <h4 className="text-[13.5px] font-bold text-foreground">Popular Discussions</h4>
            {popularDiscussions.length === 0 ? (
              <EmptyNote text="No discussions yet." />
            ) : (
              <div className="mt-3 space-y-3">
                {popularDiscussions.map((d) => (
                  <div key={d._id} className="flex items-start gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={d.author.avatar} alt={d.author.name} />
                      <AvatarFallback className="bg-brand-gradient text-[10px] font-bold text-brand-foreground">
                        {initialsFromName(d.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-foreground">{d.title}</p>
                      <p className="text-[10.5px] text-muted-foreground/70">{d.author.name} · {timeAgo(d.createdAt)}</p>
                    </div>
                    <span className="shrink-0 text-[10.5px] font-bold text-muted-foreground">{d.commentCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <h4 className="text-[13.5px] font-bold text-foreground">Community Guidelines</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                [Heart, "Respect everyone in the community"],
                [Ban, "Avoid spam and self-promotion"],
                [Lightbulb, "Be helpful and add value"],
                [CheckCircle2, "Share accurate information"],
                [FileText, "Follow platform guidelines"],
              ].map(([Icon, text], i) => {
                const IconComp = Icon as typeof Heart;
                return (
                  <li key={i} className="flex items-start gap-2 text-[11.5px] text-foreground/80">
                    <IconComp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" /> {text as string}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscussionReplies({ discussionId, startupId, canPost }: { discussionId: string; startupId: string; canPost: boolean }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["discussions", discussionId, "comments"],
    queryFn: () => discussionApi.listComments(discussionId),
  });

  const mutation = useMutation({
    mutationFn: () => discussionApi.createComment(discussionId, body),
    onSuccess: (comment: DiscussionComment) => {
      queryClient.setQueryData<DiscussionComment[]>(["discussions", discussionId, "comments"], (prev) => [...(prev ?? []), comment]);
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "discussions"] });
      setBody("");
    },
  });

  return (
    <div className="ml-12 mt-3 space-y-3 border-l-2 border-border pl-4">
      {isLoading ? (
        <EmptyNote text="Loading replies..." />
      ) : !comments?.length ? (
        <EmptyNote text="No replies yet. Be the first to reply." />
      ) : (
        comments.map((c) => (
          <div key={c._id} className="flex items-start gap-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={c.author.avatar} alt={c.author.name} />
              <AvatarFallback className="bg-brand-gradient text-[9.5px] font-bold text-brand-foreground">
                {initialsFromName(c.author.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[11.5px] font-bold text-foreground">
                {c.author.name} <span className="ml-1 font-normal text-muted-foreground/70">· {timeAgo(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 text-[12px] text-foreground/80">{c.body}</p>
            </div>
          </div>
        ))
      )}

      {canPost && (
        <div className="flex items-center gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a reply..."
            className="h-8 text-[12px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && body.trim() && !mutation.isPending) mutation.mutate();
            }}
          />
          <button
            onClick={() => body.trim() && mutation.mutate()}
            disabled={!body.trim() || mutation.isPending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

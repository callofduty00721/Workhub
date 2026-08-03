import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, ThumbsUp, MessageCircle, CheckCircle2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startupUpdateApi } from "@/api/startupUpdates";
import { cn } from "@/lib/utils";
import { EmptyNote, UPDATE_CATEGORIES, UPDATE_CATEGORY_META } from "./shared";

export function UpdatesTab({ startupId, isFounder, canPost }: { startupId: string; isFounder: boolean; canPost: boolean }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof UPDATE_CATEGORIES)[number]>("Announcement");
  const [filter, setFilter] = useState<string>("All Updates");
  const [showAll, setShowAll] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const { data: updates, isLoading } = useQuery({ queryKey: ["startups", startupId, "updates"], queryFn: () => startupUpdateApi.list(startupId) });

  const mutation = useMutation({
    mutationFn: () => startupUpdateApi.create(startupId, { title, description, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", startupId, "updates"] });
      setTitle("");
      setDescription("");
      setShowForm(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: (updateId: string) => startupUpdateApi.toggleLike(updateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups", startupId, "updates"] }),
  });

  const counts = UPDATE_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (updates ?? []).filter((u) => u.category === c).length;
    return acc;
  }, {});

  const filtered = (updates ?? []).filter((u) => filter === "All Updates" || u.category === filter);
  const visible = showAll ? filtered : filtered.slice(0, 4);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-extrabold text-[#0f172a]">Updates</h3>
          <p className="mt-1 text-[12.5px] text-[#64748b]">Stay updated with the latest progress, milestones and activities.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select value={filter} onValueChange={(v) => { setFilter(v); setShowAll(false); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All Updates">All Updates</SelectItem>
              {UPDATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}s</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFounder && (
            <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-[#FF5722] px-4 py-2 text-[12.5px] font-bold text-white hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Add New Update
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mt-4 space-y-2 rounded-xl border border-[#e2e8f0] p-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Update title" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" className="min-h-[70px]" />
          <Select value={category} onValueChange={(v) => setCategory(v as (typeof UPDATE_CATEGORIES)[number])}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UPDATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => title.trim() && mutation.mutate()} disabled={!title.trim() || mutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-[#FF5722] px-3.5 py-2 text-[12px] font-bold text-white">
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Post Update
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <EmptyNote text="Loading updates..." />
          ) : !filtered.length ? (
            <EmptyNote text="No updates posted yet." />
          ) : (
            <>
              <div className="space-y-4">
                {visible.map((u) => {
                  const meta = UPDATE_CATEGORY_META[u.category] ?? UPDATE_CATEGORY_META.Other;
                  const Icon = meta.icon;
                  return (
                    <div key={u._id} className="flex gap-3 rounded-xl border border-[#e2e8f0] p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                            {u.category}
                          </span>
                          <span className="text-[11px] text-[#94a3b8]">{new Date(u.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}</span>
                        </div>
                        <p className="mt-1.5 text-[14px] font-bold text-[#0f172a]">{u.title}</p>
                        {u.description && <p className="mt-1 text-[12.5px] text-[#64748b]">{u.description}</p>}
                        <div className="mt-2.5 flex items-center gap-4 text-[11.5px] text-[#64748b]">
                          <button
                            onClick={() => canPost && likeMutation.mutate(u._id)}
                            disabled={!canPost}
                            className="flex items-center gap-1 hover:text-[#FF5722] disabled:cursor-default disabled:hover:text-[#64748b]"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" /> {u.likes.length}
                          </button>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {u.commentCount}</span>
                        </div>
                      </div>
                      {u.image && (
                        <img src={u.image} alt="" className="hidden h-20 w-24 shrink-0 rounded-lg object-cover sm:block" />
                      )}
                    </div>
                  );
                })}
              </div>
              {filtered.length > 4 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-4 w-full rounded-lg border border-[#e2e8f0] py-2.5 text-[12.5px] font-bold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  {showAll ? "Show Fewer Updates" : "Load More Updates"}
                </button>
              )}
            </>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-[#e2e8f0] p-4">
            <h4 className="text-[13.5px] font-bold text-[#0f172a]">Update Categories</h4>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => { setFilter("All Updates"); setShowAll(false); }}
                className={cn("flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] font-semibold", filter === "All Updates" ? "bg-[#ffece5] text-[#FF5722]" : "text-[#334155] hover:bg-[#f8fafc]")}
              >
                All Updates <span className="text-[11px] font-bold">{(updates ?? []).length}</span>
              </button>
              {UPDATE_CATEGORIES.map((c) => {
                const meta = UPDATE_CATEGORY_META[c];
                const Icon = meta.icon;
                return (
                  <button
                    key={c}
                    onClick={() => { setFilter(c); setShowAll(false); }}
                    className={cn("flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] font-semibold", filter === c ? "bg-[#ffece5] text-[#FF5722]" : "text-[#334155] hover:bg-[#f8fafc]")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}>
                        <Icon className="h-3 w-3" />
                      </span>
                      {c}s
                    </span>
                    <span className="text-[11px] font-bold">{counts[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] p-4">
            <h4 className="text-[13.5px] font-bold text-[#0f172a]">Subscribe for Updates</h4>
            <p className="mt-1.5 text-[11.5px] text-[#64748b]">Get notified about the latest updates from this startup.</p>
            {subscribed ? (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#FF5722]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Thanks, we&apos;ll keep you posted!
              </p>
            ) : (
              <>
                <Input
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  className="mt-3"
                />
                <button
                  onClick={() => subscribeEmail.trim() && setSubscribed(true)}
                  disabled={!subscribeEmail.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#FF5722] py-2 text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" /> Subscribe
                </button>
                <p className="mt-2 text-[10.5px] text-[#94a3b8]">No spam. Unsubscribe anytime.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

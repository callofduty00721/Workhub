import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Send, MessageSquare, ArrowLeft, Paperclip, FileText, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatApi } from "@/api/chat";
import { uploadApi } from "@/api/uploads";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuth } from "@/context/AuthContext";
import { cn, initialsFromName } from "@/lib/utils";
import type { MessageAttachment } from "@/types";

const MAX_ATTACHMENTS_PER_MESSAGE = 5;
const MAX_COMBINED_ATTACHMENT_MB = 256;

const DASHBOARD_ROLES: DashboardRole[] = [
  "founder",
  "freelancer",
  "job_seeker",
  "influencer",
  "employer",
  "super_admin",
  "investor",
  "mentor",
  "partner",
  "client",
];

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("c");
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const sidebarRole: DashboardRole = DASHBOARD_ROLES.includes(user?.role as DashboardRole) ? (user!.role as DashboardRole) : "founder";

  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: chatApi.conversations,
  });

  const activeConversation = useMemo(() => conversations?.find((c) => c._id === activeId), [conversations, activeId]);

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", activeId],
    queryFn: () => chatApi.messages(activeId!),
    enabled: !!activeId,
  });

  const sendMutation = useMutation({
    mutationFn: ({ text, attachments }: { text: string; attachments?: MessageAttachment[] }) =>
      chatApi.sendMessage(activeId!, text, attachments),
    onSuccess: (message) => {
      // The socket "chat:message" push often lands before this response does
      // (it's sent right after the DB write, ahead of the HTTP round-trip),
      // so the same message can already be in the cache — guard against
      // appending it a second time.
      queryClient.setQueryData(["chat", "messages", activeId], (old: typeof messages) =>
        old ? (old.some((m) => m._id === message._id) ? old : [...old, message]) : [message]
      );
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      setDraft("");
    },
  });

  const handleAttachFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || !activeId) return;
    const files = Array.from(fileList);
    setAttachError(null);

    if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      setAttachError(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files at once`);
      return;
    }
    const combinedBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (combinedBytes > MAX_COMBINED_ATTACHMENT_MB * 1024 * 1024) {
      setAttachError(`Combined file size must be under ${MAX_COMBINED_ATTACHMENT_MB}MB`);
      return;
    }

    setIsAttaching(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const result = await uploadApi.upload(file, "chat_attachment");
          const attachment: MessageAttachment = {
            url: result.url,
            name: result.name,
            size: result.size,
            type: file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "file",
          };
          return attachment;
        })
      );
      await sendMutation.mutateAsync({ text: "", attachments: uploaded });
    } catch (err) {
      setAttachError(isAxiosError(err) ? err.response?.data?.message || "Upload failed" : "Upload failed");
    } finally {
      setIsAttaching(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useChatSocket(({ conversationId, message }) => {
    queryClient.setQueryData(["chat", "messages", conversationId], (old: typeof messages) => {
      if (!old) return old;
      if (old.some((m) => m._id === message._id)) return old;
      return [...old, message];
    });
    queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeId && conversations?.length) {
      setSearchParams({ c: conversations[0]._id }, { replace: true });
    }
  }, [activeId, conversations, setSearchParams]);

  // A caller (e.g. FreelancerProfile's "Hire Me" / "Invite to Project" buttons)
  // can deep-link here with ?text= to prefill an opening message — consumed
  // once, then stripped from the URL so it doesn't reappear on refresh/reply.
  useEffect(() => {
    const prefill = searchParams.get("text");
    if (prefill && activeId) {
      setDraft(prefill);
      const next = new URLSearchParams(searchParams);
      next.delete("text");
      setSearchParams(next, { replace: true });
    }
  }, [activeId, searchParams, setSearchParams]);

  const otherParticipant = (c: NonNullable<typeof conversations>[number]) => c.participants.find((p) => p._id !== user?.id);

  return (
    <DashboardLayout role={sidebarRole} title="Messages" subtitle="Chat with founders, freelancers, mentors and investors in real time.">
      <Card className="grid h-[calc(100vh-13rem)] min-h-[420px] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
        <div className={cn("flex-col border-b border-border md:flex md:border-b-0 md:border-r", activeId ? "hidden" : "flex")}>
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loadingConversations ? (
              <p className="p-4 text-xs text-muted-foreground">Loading...</p>
            ) : !conversations?.length ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No conversations yet. Message someone from their profile to get started.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const other = otherParticipant(c);
                return (
                  <button
                    key={c._id}
                    onClick={() => setSearchParams({ c: c._id })}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent",
                      activeId === c._id && "bg-accent"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={other?.avatar} alt={other?.name} />
                      <AvatarFallback>{other ? initialsFromName(other.name) : "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{other?.name ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessage || "No messages yet"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={cn("flex-col md:flex", activeId ? "flex" : "hidden")}>
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Select a conversation to start chatting</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border p-4">
                <button
                  onClick={() => setSearchParams({})}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={otherParticipant(activeConversation)?.avatar} />
                  <AvatarFallback>{initialsFromName(otherParticipant(activeConversation)?.name ?? "?")}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{otherParticipant(activeConversation)?.name}</p>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
                {messages?.map((m) => {
                  const isMine = m.sender === user?.id;
                  const hasAttachments = !!m.attachments?.length;
                  return (
                    <div key={m._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-xs overflow-hidden rounded-2xl text-sm",
                          hasAttachments ? "space-y-1.5 p-1.5" : "px-4 py-2",
                          isMine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground"
                        )}
                      >
                        {m.attachments?.map((attachment, i) =>
                          attachment.type === "image" ? (
                            <a key={i} href={attachment.url} target="_blank" rel="noreferrer">
                              <img src={attachment.url} alt={attachment.name || "Attachment"} className="max-h-56 w-full rounded-xl object-cover" />
                            </a>
                          ) : attachment.type === "video" ? (
                            <video key={i} src={attachment.url} controls className="max-h-56 w-full rounded-xl" />
                          ) : (
                            <a
                              key={i}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "flex items-center gap-2 rounded-xl px-2.5 py-2 hover:underline",
                                isMine ? "bg-primary-foreground/10" : "bg-background"
                              )}
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="truncate">{attachment.name || "File"}</span>
                            </a>
                          )
                        )}
                        {m.text && <p className={cn(hasAttachments && "px-2 pt-1.5")}>{m.text}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {attachError && <p className="px-3 pt-2 text-xs text-danger">{attachError}</p>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) sendMutation.mutate({ text: draft.trim() });
                }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => handleAttachFiles(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isAttaching}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a file"
                >
                  {isAttaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." />
                <Button type="submit" size="icon" variant="gradient" disabled={!draft.trim() || sendMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

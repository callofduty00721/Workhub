import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { DashboardRole } from "@/components/layout/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatApi } from "@/api/chat";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuth } from "@/context/AuthContext";
import { cn, initialsFromName } from "@/lib/utils";

const DASHBOARD_ROLES: DashboardRole[] = [
  "founder",
  "freelancer",
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
  const [draft, setDraft] = useState("");

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
    mutationFn: (text: string) => chatApi.sendMessage(activeId!, text),
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
                  return (
                    <div key={m._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-xs rounded-2xl px-4 py-2 text-sm",
                          isMine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground"
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) sendMutation.mutate(draft.trim());
                }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
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

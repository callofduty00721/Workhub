import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { notificationApi } from "@/api/notifications";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import type { AppNotification } from "@/types";

const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  for (const [unit, secondsInUnit] of TIME_UNITS) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return rtf.format(-value, unit);
  }
  return "just now";
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // staleTime keeps the cached (already-decremented) unread count intact across
  // route navigations — NotificationBell remounts on every page change (each
  // DashboardLayout instance renders its own Navbar), and without this, the
  // fresh mount's refetch can race the in-flight markAsRead request and
  // overwrite a correct optimistic update with a stale pre-read count.
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list, enabled: !!user, staleTime: 60_000 });

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    const handler = (notification: AppNotification) => {
      queryClient.setQueryData(["notifications"], (old: typeof data) =>
        old
          ? { ...old, data: [notification, ...old.data], unreadCount: old.unreadCount + 1 }
          : { success: true, data: [notification], unreadCount: 1 }
      );
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    queryClient.setQueryData(["notifications"], (old: typeof data) => (old ? { ...old, unreadCount: 0, data: old.data.map((n) => ({ ...n, isRead: true })) } : old));
  };

  const handleClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await notificationApi.markAsRead(notification._id);
      queryClient.setQueryData(["notifications"], (old: typeof data) =>
        old ? { ...old, unreadCount: Math.max(0, old.unreadCount - 1), data: old.data.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)) } : old
      );
    }
  };

  const handleDismiss = async (notification: AppNotification) => {
    queryClient.setQueryData(["notifications"], (old: typeof data) =>
      old
        ? {
            ...old,
            unreadCount: notification.isRead ? old.unreadCount : Math.max(0, old.unreadCount - 1),
            data: old.data.filter((n) => n._id !== notification._id),
          }
        : old
    );
    await notificationApi.remove(notification._id);
  };

  const unread = data?.data.filter((n) => !n.isRead) ?? [];

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4.5 w-4.5" />
          {!!data?.unreadCount && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {data.unreadCount > 9 ? "9+" : data.unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {!!data?.unreadCount && (
            <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {!unread.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No new notifications.</p>
          ) : (
            unread.map((n) => (
              <div key={n._id} className="group relative border-b border-border bg-primary/5 last:border-0 hover:bg-accent">
                <Link to={n.link || "#"} onClick={() => handleClick(n)} className="flex flex-col gap-0.5 px-4 py-3 pr-9 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {n.title}
                  </span>
                  {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
                  <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </Link>
                <button
                  onClick={() => handleDismiss(n)}
                  aria-label="Dismiss notification"
                  className="absolute right-2.5 top-3 rounded-md p-1 text-muted-foreground opacity-0 hover:bg-border hover:text-foreground group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

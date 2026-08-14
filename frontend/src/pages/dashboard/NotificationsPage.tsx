import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, X, CheckCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { resolveDashboardRole } from "@/components/layout/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationApi } from "@/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { timeAgoRelative as timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/types";

export default function NotificationsPage() {
  const { user } = useAuth();
  const sidebarRole = resolveDashboardRole(user?.role);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list });

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    queryClient.setQueryData(["notifications"], (old: typeof data) =>
      old ? { ...old, unreadCount: 0, data: old.data.map((n) => ({ ...n, isRead: true })) } : old
    );
  };

  const handleClick = async (notification: AppNotification) => {
    if (notification.isRead) return;
    await notificationApi.markAsRead(notification._id);
    queryClient.setQueryData(["notifications"], (old: typeof data) =>
      old
        ? { ...old, unreadCount: Math.max(0, old.unreadCount - 1), data: old.data.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)) }
        : old
    );
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

  const notifications = data?.data ?? [];

  return (
    <DashboardLayout
      role={sidebarRole}
      title="Notifications"
      subtitle="Everything GrowHive has let you know about, in one place."
      actions={
        !!data?.unreadCount && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        )
      }
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !notifications.length ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">Activity on your account will show up here.</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div key={n._id} className={`group relative border-b border-border last:border-0 hover:bg-accent ${!n.isRead ? "bg-primary/5" : ""}`}>
                  <Link to={n.link || "#"} onClick={() => handleClick(n)} className="flex flex-col gap-1 px-5 py-4 pr-12 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      {n.title}
                    </span>
                    {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
                    <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </Link>
                  <button
                    onClick={() => handleDismiss(n)}
                    aria-label="Dismiss notification"
                    className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground opacity-0 hover:bg-border hover:text-foreground group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

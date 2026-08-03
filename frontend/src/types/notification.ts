export type NotificationType =
  | "startup_follow"
  | "startup_interest"
  | "job_application"
  | "application_status"
  | "new_message"
  | "session_request"
  | "session_status"
  | "review_received"
  | "system";

export interface AppNotification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  reviewer: { _id: string; name: string; avatar?: string };
  targetType: "user" | "service" | "startup";
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

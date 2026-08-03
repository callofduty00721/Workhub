export type SessionStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface MentorSession {
  _id: string;
  mentor: { _id: string; name: string; avatar?: string; headline?: string } | string;
  requester: { _id: string; name: string; avatar?: string; headline?: string } | string;
  topic: string;
  message?: string;
  preferredTime?: string;
  status: SessionStatus;
  createdAt: string;
}

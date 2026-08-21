import type { UserRole, AvailabilityStatus, KycStatus, SocialLinks } from "./user";

export interface FreelancerSummary {
  _id: string;
  name: string;
  avatar?: string;
  coverImage?: string;
  headline?: string;
  location?: string;
  bio?: string;
  category?: string;
  subCategory?: string;
  skills: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
  availabilityStatus?: AvailabilityStatus;
  level?: "new" | "level_1" | "top_rated";
  company?: { _id: string; name: string } | null;
  kycStatus?: KycStatus;
  responseTimeLabel?: string;
  languages?: string[];
  jobsCompleted?: number;
  jobSuccessPercent?: number;
  isDemo?: boolean;
  socialLinks?: SocialLinks;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  participants: { _id: string; name: string; avatar?: string; role: UserRole }[];
  lastMessage: string;
  lastMessageAt: string;
}

export interface MessageAttachment {
  url: string;
  name?: string;
  type: "image" | "video" | "file";
  size?: number;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  attachments?: MessageAttachment[];
  readBy: string[];
  createdAt: string;
}

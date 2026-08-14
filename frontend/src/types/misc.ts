export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface JobAlert {
  _id: string;
  user: string;
  keywords: string[];
  remoteOnly: boolean;
  isActive: boolean;
  createdAt: string;
}

export type MilestoneStatus = "pending" | "funded" | "released";

export interface ProjectMilestone {
  _id: string;
  application: string;
  title: string;
  amount: number;
  order: number;
  status: MilestoneStatus;
  createdAt: string;
}

export interface TimeEntry {
  _id: string;
  application: string;
  freelancer: string;
  date: string;
  hours: number;
  description?: string;
  billed: boolean;
  payment?: string;
  createdAt: string;
}

export type PhoneAuthProvider = "disabled" | "firebase";

export interface PlatformSettings {
  _id: string;
  commissionPercent: number;
  phoneAuthProvider: PhoneAuthProvider;
  firebaseConfigured: boolean;
  allowedEmailDomains: string[];
  jobsEnabled: boolean;
}

export type TaskType = "task" | "meeting" | "call" | "deadline";

export interface Task {
  _id: string;
  user: string;
  title: string;
  type: TaskType;
  dueAt: string;
  completed: boolean;
  createdAt: string;
}

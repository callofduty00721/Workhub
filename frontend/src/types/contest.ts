export type ContestStatus = "open" | "judging" | "closed";

export interface Contest {
  _id: string;
  client: { _id: string; name: string; avatar?: string; email?: string } | string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  prizeAmount: number;
  currency: string;
  deadline: string;
  status: ContestStatus;
  entriesCount: number;
  winnerEntry?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface ContestEntry {
  _id: string;
  contest: Contest | string;
  freelancer: { _id: string; name: string; avatar?: string; email?: string; headline?: string; location?: string } | string;
  title: string;
  description: string;
  fileUrl?: string;
  isWinner: boolean;
  createdAt: string;
}

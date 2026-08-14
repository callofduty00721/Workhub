import type { InfluencerPlatform } from "./user";

// Slim shape — only the fields talentRoster.controller.js actually selects,
// not a full InfluencerSummary.
export interface RosterInfluencer {
  _id: string;
  name: string;
  avatar?: string;
  influencerProfile?: { category?: string; niche?: string; platforms?: InfluencerPlatform[] };
  location?: string;
  rating?: number;
  reviewCount?: number;
}

export type RosterStatus = "pending" | "accepted" | "declined" | "removed";

export interface RosterInvite {
  _id: string;
  status: RosterStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string | null;
  // Present on the partner-facing endpoints (/mine, invite response).
  influencer?: RosterInfluencer;
  // Present on the influencer-facing endpoint (/pending).
  partner?: { _id: string; name: string; avatar?: string; headline?: string };
}

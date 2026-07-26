export type OutreachType = "cold" | "warm";

export interface OutreachRecord {
  id: string;
  name: string;
  company: string;
  role: string;
  source: string;
  method: string;
  firstDate: string;
  lastDate: string;
  followUps: number;
  status: string;
  personalized: boolean;
  compliment: boolean;
  easy: boolean;
  value: boolean;
  notes: string;
}

export interface ContentRecord {
  id: string;
  platform: string;
  account: string;
  date: string;
  status: string;
  hook: string;
  retain: string;
  reward: string;
  giveTake: string;
  url: string;
  notes: string;
}

export interface OfferRecord {
  id: string;
  name: string;
  date: string;
  madeTo: string;
  outcome: string;
  dreamOutcome: number;
  likelihood: number;
  timeDelay: number;
  sacrifice: number;
  valueScore: number;
  notes: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  campaign: string;
  status: string;
  cameInFor: string;
  potentialValue: string;
  notes: string;
  syncedAt: string;
}

export const OUTREACH_METHODS = ["X DM", "LinkedIn", "Email", "Telegram", "Other"] as const;
export const OUTREACH_STATUSES = ["Sent", "Replied", "Call booked", "Client", "Dead"] as const;
export const CONTENT_PLATFORMS = ["X", "LinkedIn"] as const;
export const CONTENT_ACCOUNTS = ["Company", "Personal"] as const;
export const CONTENT_STATUSES = ["Planned", "Posted"] as const;
export const OFFER_OUTCOMES = ["Pending", "Accepted", "Rejected"] as const;

export function computeValueScore(offer: {
  dreamOutcome: number;
  likelihood: number;
  timeDelay: number;
  sacrifice: number;
}): number {
  const denominator = Math.max(offer.timeDelay, 1) * Math.max(offer.sacrifice, 1);
  return Math.round((offer.dreamOutcome * offer.likelihood * 100) / denominator) / 100;
}

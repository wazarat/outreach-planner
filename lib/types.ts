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

// ---- Principles (1-4) ----

/** P1 — someone imported from outreach who really values what I offer. */
export interface ValuedPersonRecord {
  id: string;
  date: string;
  outreachId: string;
  name: string;
  company: string;
  valueLevel: string;
  howTheyValue: string;
  internalChampion: string;
  notes: string;
}

/** P1 — a point logged toward building my own loyal marketplace. */
export interface MarketplacePointRecord {
  id: string;
  date: string;
  note: string;
  points: number;
}

/** P2 — a move I'm making to build my own market. */
export interface MarketMoveRecord {
  id: string;
  date: string;
  move: string;
  problemSolved: string;
  whoTalkedTo: string;
}

/** P2 — something I'm saying no to so I stay focused. */
export interface SayNoRecord {
  id: string;
  date: string;
  item: string;
  reason: string;
}

/** P2 — "famous for a few": a note on a metric of an existing content piece. */
export interface FamousNoteRecord {
  id: string;
  date: string;
  contentId: string;
  contentTitle: string;
  metric: string;
  note: string;
}

/** P2 — an entry in one of the 7-11-4 trackers. */
export interface SevenElevenFourRecord {
  id: string;
  date: string;
  track: string;
  title: string;
  detail: string;
  priority: string;
  minutes: number;
}

/** P3 — a content piece picked up as a market signal (P4 conditions live here too). */
export interface SignalRecord {
  id: string;
  date: string;
  contentId: string;
  contentTitle: string;
  signalNote: string;
  signalSize: string;
  condTension: boolean;
  condOwnConditions: boolean;
  condLineOut: boolean;
}

/** P3 — a market positioning note under one of the four positions. */
export interface PositioningRecord {
  id: string;
  date: string;
  position: string;
  category: string;
  note: string;
}

/** P4 — a potential champion pulled from the reach-out lists. */
export interface ChampionRecord {
  id: string;
  date: string;
  outreachId: string;
  name: string;
  email: string;
  company: string;
  role: string;
  championType: string;
  notes: string;
}

export const VALUE_LEVELS = ["Normal", "Moderate", "High", "Really High"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const SIGNAL_SIZES = ["Small", "Medium", "Large"] as const;
export const SEVEN_ELEVEN_FOUR_TRACKS = ["Hours", "Interactions", "Locations"] as const;
export const CHAMPION_TYPES = ["Testimonial", "Potential Referral", "Product Refinement"] as const;

export const MARKET_POSITIONS: Record<string, readonly string[]> = {
  Innovation: ["Product Innovation", "System Innovation", "Brand Innovation"],
  Relationships: ["Influence", "Popularity", "Lasting Agreements"],
  Convenience: ["Better Distribution", "Better Market Innovation", "Automation"],
  Price: ["Barrier to Entry", "Refining Inefficiencies", "Systems and Technologies"],
};

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

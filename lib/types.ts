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

// ---- Principles (5-6) ----

/** A reference to another row (content, offer, persona), stored as JSON in a string column. */
export interface LinkedRef {
  id: string;
  title: string;
}

/** Parses a JSON-array string column into a list of refs. */
export function parseRefs(raw: string): LinkedRef[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({ id: String(item.id ?? ""), title: String(item.title ?? "") }));
  } catch {
    return [];
  }
}

export function serializeRefs(refs: LinkedRef[]): string {
  return refs.length ? JSON.stringify(refs) : "";
}

/** P5 — a philosophy I hold, where I've posted it, and who it attracts. */
export interface PhilosophyRecord {
  id: string;
  date: string;
  philosophy: string;
  targetMarket: string;
  contentRefs: string;
  notes: string;
}

/** P5 — an external reference that aligns with my beliefs. */
export interface BeliefReferenceRecord {
  id: string;
  date: string;
  source: string;
  url: string;
  note: string;
  philosophyId: string;
  philosophyLabel: string;
}

/** P5 — something I'm attracted to but saying no (or wait/undecided) to. */
export interface RulesSayNoRecord {
  id: string;
  date: string;
  item: string;
  reason: string;
  status: string;
}

/** P5 — a way I'm playing differently to everyone else. */
export interface DifferentiatorRecord {
  id: string;
  date: string;
  point: string;
  expectedNorms: string;
  opposite: string;
  why: string;
}

/** P6 — a target customer persona, reusable across offers and planning. */
export interface PersonaRecord {
  id: string;
  date: string;
  name: string;
  description: string;
  notes: string;
}

/** P6 — a connection between two offers (or an offer and content) for personas. */
export interface EcosystemConnectionRecord {
  id: string;
  date: string;
  offerAId: string;
  offerAName: string;
  offerBType: string;
  offerBId: string;
  offerBName: string;
  personaRefs: string;
  howTheyConnect: string;
  worksTogether: string;
  valueNote: string;
}

/** P6 — a content piece given away free, building toward the paid ask. */
export interface GiveawayRecord {
  id: string;
  date: string;
  contentId: string;
  contentTitle: string;
  howGiving: string;
  buildToAsk: string;
}

/** P6 — an ecosystem offer building block with size, stage and classification. */
export interface EcosystemOfferRecord {
  id: string;
  date: string;
  name: string;
  linkedOfferId: string;
  linkedOfferName: string;
  linkedContentId: string;
  linkedContentTitle: string;
  size: string;
  stage: string;
  classification: string;
  personaRefs: string;
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
export const P5_NO_STATUSES = ["No", "Wait", "Undecided"] as const;
export const WORKS_TOGETHER_OPTIONS = ["Yes", "No", "Unsure"] as const;
export const ECO_OFFER_SIZES = ["Small", "Medium", "Large"] as const;
export const ECO_OFFER_STAGES = [
  "Ideation",
  "Development",
  "Signals",
  "Talking to Customers",
  "Implementation",
] as const;
export const ECO_OFFER_CLASSIFICATIONS = [
  "Core Offer",
  "Innovation Long-Term",
  "Innovation Short-Term",
  "Undecided",
] as const;

export function computeValueScore(offer: {
  dreamOutcome: number;
  likelihood: number;
  timeDelay: number;
  sacrifice: number;
}): number {
  const denominator = Math.max(offer.timeDelay, 1) * Math.max(offer.sacrifice, 1);
  return Math.round((offer.dreamOutcome * offer.likelihood * 100) / denominator) / 100;
}

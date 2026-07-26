import { ModuleKey } from "./config";

/**
 * URL section slugs for /api/principles/[section] mapped to sheet modules.
 * Shared by the API route (server) and the principle pages (client).
 */
export const PRINCIPLE_SECTIONS = {
  "valued-people": "p1People",
  points: "p1Points",
  "market-moves": "p2Moves",
  "say-no": "p2SayNo",
  "famous-notes": "p2Famous",
  "seven-eleven-four": "p2Seven",
  signals: "p3Signals",
  positioning: "p3Positioning",
  champions: "p4Champions",
} as const satisfies Record<string, ModuleKey>;

export type PrincipleSection = keyof typeof PRINCIPLE_SECTIONS;

export interface PrincipleMeta {
  number: number;
  slug: string;
  title: string;
  tagline: string;
  implemented: boolean;
}

export const PRINCIPLES: PrincipleMeta[] = [
  {
    number: 1,
    slug: "1",
    title: "Demand & Supply",
    tagline: "Find the small group of people who really value what I offer.",
    implemented: true,
  },
  {
    number: 2,
    slug: "2",
    title: "My People",
    tagline: "Create a market of my own — and get famous for a few.",
    implemented: true,
  },
  {
    number: 3,
    slug: "3",
    title: "Market Creation",
    tagline: "Provide signals, pick a market position, let them ask.",
    implemented: true,
  },
  {
    number: 4,
    slug: "4",
    title: "Right Conditions",
    tagline: "Create the conditions that make people feel positive about buying.",
    implemented: true,
  },
  { number: 5, slug: "5", title: "Principle 5", tagline: "Coming in the next iteration.", implemented: false },
  { number: 6, slug: "6", title: "Principle 6", tagline: "Coming in the next iteration.", implemented: false },
  { number: 7, slug: "7", title: "Principle 7", tagline: "Coming in the next iteration.", implemented: false },
  { number: 8, slug: "8", title: "Principle 8", tagline: "Coming in the next iteration.", implemented: false },
];

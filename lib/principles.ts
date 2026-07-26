import { ModuleKey } from "./config";

/**
 * URL section slugs for /api/principles/[section] mapped to data modules.
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
  philosophies: "p5Philosophies",
  references: "p5References",
  "rules-say-no": "p5SayNo",
  differentiators: "p5Differentiators",
  personas: "personas",
  connections: "p6Connections",
  giveaways: "p6Giveaways",
  "ecosystem-offers": "p6Offers",
  "journey-personas": "p7Profiles",
  "persona-data-points": "p7DataPoints",
  journeys: "p7Journeys",
  "customer-values": "p7Values",
  packages: "p7Packages",
  "remarkable-products": "p8Remarkable",
  brand: "p8Brand",
  "brand-actions": "p8BrandActions",
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
  {
    number: 5,
    slug: "5",
    title: "Set Rules",
    tagline: "Build something contrarian and unique — and have the courage to say no.",
    implemented: true,
  },
  {
    number: 6,
    slug: "6",
    title: "Ecosystem Building",
    tagline: "Connect every offer and idea into one ecosystem that serves my personas.",
    implemented: true,
  },
  {
    number: 7,
    slug: "7",
    title: "Create Journeys",
    tagline: "Become a business of transformation — meet people where they are and move them to what they want even more.",
    implemented: true,
  },
  {
    number: 8,
    slug: "8",
    title: "Positively Remarkable",
    tagline: "Build remarkable products and a positive personal brand that grows at the speed of sound.",
    implemented: true,
  },
];

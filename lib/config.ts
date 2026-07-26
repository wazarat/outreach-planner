export type ModuleKey =
  | "cold"
  | "warm"
  | "content"
  | "offers"
  | "leads"
  | "p1People"
  | "p1Points"
  | "p2Moves"
  | "p2SayNo"
  | "p2Famous"
  | "p2Seven"
  | "p3Signals"
  | "p3Positioning"
  | "p4Champions"
  | "p5Philosophies"
  | "p5References"
  | "p5SayNo"
  | "p5Differentiators"
  | "personas"
  | "p6Connections"
  | "p6Giveaways"
  | "p6Offers"
  | "p7Profiles"
  | "p7DataPoints"
  | "p7Journeys"
  | "p7Values"
  | "p7Packages"
  | "p8Remarkable"
  | "p8Brand"
  | "p8BrandActions";

export type ColumnType = "string" | "boolean" | "number";

export interface ColumnDef {
  key: string;
  header: string;
  type: ColumnType;
}

export interface ModuleConfig {
  key: ModuleKey;
  /** Postgres table name for this module. */
  table: string;
  columns: ColumnDef[];
}

const s = (key: string, header: string): ColumnDef => ({ key, header, type: "string" });
const b = (key: string, header: string): ColumnDef => ({ key, header, type: "boolean" });
const n = (key: string, header: string): ColumnDef => ({ key, header, type: "number" });

function outreachColumns(sourceHeader: string, easyHeader: string): ColumnDef[] {
  return [
    s("id", "ID"),
    s("name", "Name"),
    s("company", "Company"),
    s("role", "Role"),
    s("source", sourceHeader),
    s("method", "Method"),
    s("firstDate", "First Outreach Date"),
    s("lastDate", "Last Contact Date"),
    n("followUps", "Follow-up Count"),
    s("status", "Status"),
    b("personalized", "Personalized?"),
    b("compliment", "Complimented Achievement?"),
    b("easy", easyHeader),
    b("value", "Overwhelming Value?"),
    s("notes", "Notes"),
  ];
}

export const MODULES: Record<ModuleKey, ModuleConfig> = {
  cold: {
    key: "cold",
    table: "cold_outreach",
    columns: outreachColumns("How I Found Them", "Easy To Read?"),
  },
  warm: {
    key: "warm",
    table: "warm_outreach",
    columns: outreachColumns("How I Know Them", "Easy To Understand?"),
  },
  content: {
    key: "content",
    table: "content",
    columns: [
      s("id", "ID"),
      s("platform", "Platform"),
      s("account", "Account"),
      s("date", "Date"),
      s("status", "Status"),
      s("hook", "Hook"),
      s("retain", "Retain"),
      s("reward", "Reward"),
      s("giveTake", "Give or Take"),
      s("url", "Post URL"),
      s("notes", "Notes"),
    ],
  },
  offers: {
    key: "offers",
    table: "offers",
    columns: [
      s("id", "ID"),
      s("name", "Offer Name"),
      s("date", "Date"),
      s("madeTo", "Made To"),
      s("outcome", "Outcome"),
      n("dreamOutcome", "Dream Outcome (1-10)"),
      n("likelihood", "Perceived Likelihood (1-10)"),
      n("timeDelay", "Time Delay (1-10)"),
      n("sacrifice", "Sacrifice (1-10)"),
      n("valueScore", "Value Score"),
      s("notes", "Notes"),
    ],
  },
  leads: {
    key: "leads",
    table: "leads",
    columns: [
      s("id", "ID"),
      s("name", "Name"),
      s("email", "Email"),
      s("company", "Company"),
      s("campaign", "Campaign"),
      s("status", "Status"),
      s("cameInFor", "Came In For"),
      s("potentialValue", "Potential Value"),
      s("notes", "Notes"),
      s("syncedAt", "Synced At"),
    ],
  },
  p1People: {
    key: "p1People",
    table: "p1_valued_people",
    columns: [
      s("id", "ID"),
      s("date", "Date Added"),
      s("outreachId", "Outreach Ref"),
      s("name", "Name"),
      s("company", "Company"),
      s("valueLevel", "Value Level"),
      s("howTheyValue", "How Much They Value It"),
      s("internalChampion", "Internal Champion"),
      s("notes", "Notes"),
    ],
  },
  p1Points: {
    key: "p1Points",
    table: "p1_points",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("note", "Champion-Creating Action"),
      n("points", "Points"),
    ],
  },
  p2Moves: {
    key: "p2Moves",
    table: "p2_market_moves",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("move", "How I'm Building My Market"),
      s("problemSolved", "Problem I'm Solving (That Others Can't)"),
      s("whoTalkedTo", "Who I Talked To (Optional)"),
    ],
  },
  p2SayNo: {
    key: "p2SayNo",
    table: "p2_say_no",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("item", "Saying No To"),
      s("reason", "Why"),
    ],
  },
  p2Famous: {
    key: "p2Famous",
    table: "p2_famous_notes",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("contentId", "Content Ref"),
      s("contentTitle", "Content"),
      s("metric", "Metric"),
      s("note", "Note"),
    ],
  },
  p2Seven: {
    key: "p2Seven",
    table: "p2_seven_eleven_four",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("track", "Track"),
      s("title", "Title"),
      s("detail", "Detail"),
      s("priority", "Priority"),
      n("minutes", "Minutes (Hours Track)"),
    ],
  },
  p3Signals: {
    key: "p3Signals",
    table: "p3_signals",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("contentId", "Content Ref"),
      s("contentTitle", "Content"),
      s("signalNote", "Signal Note"),
      s("signalSize", "Signal Size"),
      b("condTension", "Demand/Supply Tension Transparent?"),
      b("condOwnConditions", "Created My Own Conditions?"),
      b("condLineOut", "Line Out The Door?"),
    ],
  },
  p3Positioning: {
    key: "p3Positioning",
    table: "p3_positioning",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("position", "Market Position"),
      s("category", "Category"),
      s("note", "Notes"),
    ],
  },
  p4Champions: {
    key: "p4Champions",
    table: "p4_champions",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("outreachId", "Outreach Ref"),
      s("name", "Name"),
      s("email", "Email"),
      s("company", "Company"),
      s("role", "Role"),
      s("championType", "Champion Type"),
      s("notes", "Notes"),
    ],
  },
  p5Philosophies: {
    key: "p5Philosophies",
    table: "p5_philosophies",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("philosophy", "Philosophy"),
      s("targetMarket", "Target Market"),
      s("contentRefs", "Posted In (Content Refs)"),
      s("notes", "Notes"),
    ],
  },
  p5References: {
    key: "p5References",
    table: "p5_references",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("source", "Source"),
      s("url", "URL"),
      s("note", "Why It Aligns"),
      s("philosophyId", "Philosophy Ref"),
      s("philosophyLabel", "Philosophy"),
    ],
  },
  p5SayNo: {
    key: "p5SayNo",
    table: "p5_say_no",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("item", "Attracted To"),
      s("reason", "Why It Doesn't Align"),
      s("status", "Status"),
    ],
  },
  p5Differentiators: {
    key: "p5Differentiators",
    table: "p5_differentiators",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("point", "Differentiator"),
      s("expectedNorms", "Expected Norms"),
      s("opposite", "The Opposite I'm Doing"),
      s("why", "Why I'm Doing This"),
    ],
  },
  personas: {
    key: "personas",
    table: "personas",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("name", "Persona"),
      s("description", "Description"),
      s("notes", "Notes"),
    ],
  },
  p6Connections: {
    key: "p6Connections",
    table: "p6_connections",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("offerAId", "Offer A Ref"),
      s("offerAName", "Offer A"),
      s("offerBType", "Connects To Type"),
      s("offerBId", "Connects To Ref"),
      s("offerBName", "Connects To"),
      s("personaRefs", "Personas"),
      s("howTheyConnect", "How They Connect"),
      s("worksTogether", "Works Together?"),
      s("valueNote", "Value To Persona"),
    ],
  },
  p6Giveaways: {
    key: "p6Giveaways",
    table: "p6_giveaways",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("contentId", "Content Ref"),
      s("contentTitle", "Content"),
      s("howGiving", "How I'm Giving It Away"),
      s("buildToAsk", "How It Builds To My Ask"),
    ],
  },
  p6Offers: {
    key: "p6Offers",
    table: "p6_offers",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("name", "Offer Name"),
      s("linkedOfferId", "Linked Offer Ref"),
      s("linkedOfferName", "Linked Offer"),
      s("linkedContentId", "Linked Content Ref"),
      s("linkedContentTitle", "Linked Content"),
      s("size", "Size"),
      s("stage", "Stage"),
      s("classification", "Classification"),
      s("personaRefs", "Personas"),
      s("notes", "Notes"),
    ],
  },
  p7Profiles: {
    key: "p7Profiles",
    table: "p7_persona_profiles",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("personaId", "Persona Ref"),
      s("personaName", "Persona"),
      s("language", "Language They Want To Be Spoken In"),
      s("endGoal", "Their End Goal"),
      s("communication", "How I Can Communicate With Them"),
      s("resonates", "What Will Resonate With Them"),
      s("brandingProblems", "Branding Problems They Have"),
      s("hypothesisValidation", "Hypothesis Validation For These Claims"),
      s("hyperTargeted", "Hyper-Targeted?"),
      s("customized", "Customized For Their Needs?"),
      s("allDataCollected", "All The Data I Can Collect?"),
      s("spokenToRefs", "People Spoken To"),
      s("notes", "Notes"),
    ],
  },
  p7DataPoints: {
    key: "p7DataPoints",
    table: "p7_data_points",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("profileId", "Profile Ref"),
      s("personaName", "Persona"),
      s("label", "Data Point"),
      s("value", "Detail"),
    ],
  },
  p7Journeys: {
    key: "p7Journeys",
    table: "p7_journeys",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("personaId", "Persona Ref"),
      s("personaName", "Persona"),
      s("wantSignals", "Data Points Suggesting They Want My Product"),
      s("journeyWanted", "Customer Journey They Want"),
      s("dreamOutcomeSelling", "Dream Outcome I'm Selling"),
      s("firstSteps", "First Few Steps"),
      s("smallDecisions", "Small Decisions I Can Help And Influence"),
      s("eventualOutcome", "Eventual Dream Outcome"),
    ],
  },
  p7Values: {
    key: "p7Values",
    table: "p7_values",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("personaId", "Persona Ref"),
      s("personaName", "Persona"),
      s("value", "Value"),
      s("whyImportant", "Why It's Most Important To Them"),
      s("bridgeToSolution", "How It Leads To The Solution"),
    ],
  },
  p7Packages: {
    key: "p7Packages",
    table: "p7_packages",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("personaId", "Persona Ref"),
      s("personaName", "Persona"),
      s("name", "Package Name"),
      s("offerRefs", "Offers In The Package"),
      s("howItComesTogether", "How It All Comes Together"),
      s("everythingIncluded", "Everything Of Value Included?"),
      s("everythingNote", "What's Still Missing"),
    ],
  },
  p8Remarkable: {
    key: "p8Remarkable",
    table: "p8_remarkable",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("packageId", "Package Ref"),
      s("packageName", "Solution Package"),
      b("genuineAdvantages", "Genuine Advantages?"),
      b("realBenefits", "Real Benefits?"),
      b("superiorExperience", "Superior Experience?"),
      s("howRemarkable", "How I'm Making This Offer Remarkable"),
      s("standOut", "What Makes Me Stand Out"),
      s("solvingBeforeMoney", "Solving Needs Before Making Money?"),
      s("howSolvingGenuinely", "How I'm Solving Their Needs Genuinely"),
    ],
  },
  p8Brand: {
    key: "p8Brand",
    table: "p8_brand",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("brandStatement", "What I Want My Personal Brand To Be"),
      s("sevenElevenFourPlan", "How I'll Complete My 7-11-4 In Accordance"),
      s("notes", "Notes"),
    ],
  },
  p8BrandActions: {
    key: "p8BrandActions",
    table: "p8_brand_actions",
    columns: [
      s("id", "ID"),
      s("date", "Date"),
      s("action", "Action I'll Take"),
      s("howPositive", "How It Makes My Brand More Positive"),
      s("improvement", "How It Can Be Further Improved"),
    ],
  },
};

export function getModuleConfig(key: string): ModuleConfig | null {
  return (MODULES as Record<string, ModuleConfig>)[key] ?? null;
}

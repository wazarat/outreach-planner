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
  | "p4Champions";

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
};

export function getModuleConfig(key: string): ModuleConfig | null {
  return (MODULES as Record<string, ModuleConfig>)[key] ?? null;
}

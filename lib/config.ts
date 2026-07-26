export type ModuleKey = "cold" | "warm" | "content" | "offers" | "leads";

export type ColumnType = "string" | "boolean" | "number";

export interface ColumnDef {
  key: string;
  header: string;
  type: ColumnType;
}

export interface ModuleConfig {
  key: ModuleKey;
  defaultTab: string;
  tabEnv: string;
  spreadsheetEnv: string;
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
    defaultTab: "Cold Outreach",
    tabEnv: "COLD_SHEET_TAB",
    spreadsheetEnv: "COLD_SPREADSHEET_ID",
    columns: outreachColumns("How I Found Them", "Easy To Read?"),
  },
  warm: {
    key: "warm",
    defaultTab: "Warm Outreach",
    tabEnv: "WARM_SHEET_TAB",
    spreadsheetEnv: "WARM_SPREADSHEET_ID",
    columns: outreachColumns("How I Know Them", "Easy To Understand?"),
  },
  content: {
    key: "content",
    defaultTab: "Content",
    tabEnv: "CONTENT_SHEET_TAB",
    spreadsheetEnv: "CONTENT_SPREADSHEET_ID",
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
    defaultTab: "Offers",
    tabEnv: "OFFERS_SHEET_TAB",
    spreadsheetEnv: "OFFERS_SPREADSHEET_ID",
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
    defaultTab: "Leads",
    tabEnv: "LEADS_SHEET_TAB",
    spreadsheetEnv: "LEADS_SPREADSHEET_ID",
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
};

export function getModuleConfig(key: string): ModuleConfig | null {
  return (MODULES as Record<string, ModuleConfig>)[key] ?? null;
}

export function getSpreadsheetId(cfg: ModuleConfig): string {
  return process.env[cfg.spreadsheetEnv] || process.env.SHEETS_SPREADSHEET_ID || "";
}

export function getTabName(cfg: ModuleConfig): string {
  return process.env[cfg.tabEnv] || cfg.defaultTab;
}

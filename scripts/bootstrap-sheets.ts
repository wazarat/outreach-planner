/**
 * One-time setup: creates a tab per module with header row, frozen header,
 * and checkbox validation for boolean columns.
 *
 * Usage: npm run bootstrap:sheets
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { sheets_v4 } from "googleapis";
import { MODULES, ModuleConfig, getSpreadsheetId, getTabName } from "../lib/config";
import { getSheetsClient, isSheetsConfigured } from "../lib/sheets";

async function ensureTab(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  cfg: ModuleConfig
): Promise<void> {
  const tab = getTabName(cfg);
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === tab);

  let sheetId: number;
  if (existing) {
    sheetId = existing.properties!.sheetId!;
    console.log(`  Tab "${tab}" already exists — refreshing headers`);
  } else {
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tab, gridProperties: { frozenRowCount: 1 } } } }],
      },
    });
    sheetId = res.data.replies![0].addSheet!.properties!.sheetId!;
    console.log(`  Created tab "${tab}"`);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [cfg.columns.map((c) => c.header)] },
  });

  const requests: sheets_v4.Schema$Request[] = [
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true },
            backgroundColor: { red: 0.08, green: 0.09, blue: 0.12 },
            horizontalAlignment: "LEFT",
          },
        },
        fields: "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)",
      },
    },
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },
  ];

  cfg.columns.forEach((col, index) => {
    if (col.type !== "boolean") return;
    requests.push({
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: index,
          endColumnIndex: index + 1,
        },
        rule: { condition: { type: "BOOLEAN" }, strict: true, showCustomUi: true },
      },
    });
  });

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
}

async function main() {
  if (!isSheetsConfigured()) {
    console.error(
      "Missing configuration. Copy .env.example to .env.local and set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY and SHEETS_SPREADSHEET_ID."
    );
    process.exit(1);
  }
  const sheets = getSheetsClient();
  for (const cfg of Object.values(MODULES)) {
    const spreadsheetId = getSpreadsheetId(cfg);
    console.log(`Module "${cfg.key}" -> spreadsheet ${spreadsheetId}`);
    await ensureTab(sheets, spreadsheetId, cfg);
  }
  console.log("\nDone. All tabs are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

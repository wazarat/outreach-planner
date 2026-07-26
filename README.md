# Outreach Planner

A personal outreach, content and offer tracking tool for [CanHav](https://www.canhav.co) and personal branding in DeFi, blockchain finance and FinTech.

**Google Sheets is the database.** Every module reads and writes rows in your own spreadsheet, so you can work in the app or directly in Sheets — both stay in sync.

## Modules

| Page | What it does |
| --- | --- |
| `/` Dashboard | Combined metrics: outreach volume, follow-ups, method breakdown, reply/close rates, give/take ratio, offer scores, lead count |
| `/cold` Cold Outreach | People you don't know. Tracks how you found them, method, follow-ups, status, and a 4-point personalization checklist (personalized, complimented an achievement, easy to read, overwhelming value) |
| `/warm` Warm Outreach | Same tracking, but "how I know them" and an "easy to understand" checklist item |
| `/content` Content Tracker | X + LinkedIn, Company + Personal accounts. Every piece has a Hook / Retain / Reward plan and is flagged Give or Take — the app tracks your give/take ratio overall and per slice |
| `/offers` Offers | Every offer scored 1-10 on Dream Outcome, Perceived Likelihood, Time Delay and Sacrifice. Value score = (Dream × Likelihood) ÷ (Delay × Sacrifice), with a trend chart over time |
| `/leads` Leads | Live sync from Instantly.ai campaigns. Enrich each lead with "came in for", potential value and notes (manual fields survive re-syncs) |
| `/principles` Principles | The eight operating principles behind every outreach, each with its own quote, trackers and reminders. Principles 1–4 are live (see below); 5–8 come next |

### The Eight Principles (1–4 implemented)

| Principle | What you track |
| --- | --- |
| 1 — Demand & Supply | People imported from your outreach lists who really value what you offer (value level from normal to really high, how much they value it, internal champion, notes) plus a points tracker for building your own loyal marketplace |
| 2 — My People | Market-building moves (with the problem you're solving that others can't, and who you talked to for the idea), a "saying no" tracker, "famous for a few" metric notes linked to your content, and the 7-11-4 trackers (7 hours of content, 11 interaction points, 4 locations — with High/Medium/Low priority, no caps) |
| 3 — Market Creation | Content pieces picked up as market signals (tagged Small / Medium / Large with notes) and market positioning notes under Innovation, Relationships, Convenience and Price — each with its own categories |
| 4 — Right Conditions | The Principle 3 signals worked through a three-part conditions checklist (demand/supply tension transparency, create my own conditions, line out the door) and a champions list built from your reach-out contacts (testimonial, potential referral, product refinement) |

## Setup

### 1. Install and configure

```bash
npm install
cp .env.example .env.local
```

### 2. Google Sheets (the database)

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create (or pick) a project.
2. Enable the **Google Sheets API**: APIs & Services → Library → search "Google Sheets API" → Enable.
3. Create a **service account**: APIs & Services → Credentials → Create Credentials → Service account. No roles needed.
4. Open the service account → Keys → Add key → **JSON**. Download the key file.
5. From the JSON file, copy into `.env.local`:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (keep it quoted, with the `\n` escapes)
6. Create a Google Sheet (any name). Copy the long ID from its URL (`docs.google.com/spreadsheets/d/<THIS>/edit`) into `SHEETS_SPREADSHEET_ID`.
7. **Share the sheet** with the service account email (Editor access) — this is the step people forget.

Then create all tabs, headers and checkboxes automatically:

```bash
npm run bootstrap:sheets
```

Want separate spreadsheets per module? Set the optional `COLD_SPREADSHEET_ID`, `WARM_SPREADSHEET_ID`, etc. in `.env.local` (share each with the service account) and re-run the bootstrap.

### 3. Instantly.ai (for the Leads module)

1. In Instantly, go to Settings → Integrations → API and create an **API v2 key**.
2. Put it in `.env.local` as `INSTANTLY_API_KEY`.

Everything else works without this — you'll just see a notice on the Leads page until it's set.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | Service account email from the JSON key |
| `GOOGLE_PRIVATE_KEY` | Yes | Private key from the JSON key (quoted, `\n`-escaped) |
| `SHEETS_SPREADSHEET_ID` | Yes | Default spreadsheet for all modules |
| `COLD_SPREADSHEET_ID` … `P4_CHAMPIONS_SPREADSHEET_ID` | No | Per-module spreadsheet overrides (see `.env.example` for the full list) |
| `COLD_SHEET_TAB` … `P4_CHAMPIONS_SHEET_TAB` | No | Per-module tab-name overrides (see `.env.example` for the full list) |
| `INSTANTLY_API_KEY` | For leads | Instantly.ai API v2 key |

## Roadmap

- Principles 5–8 (Principles 1–4 shipped)
- Deeper integration with the canhav-prod platform

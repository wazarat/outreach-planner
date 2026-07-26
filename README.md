# Outreach Planner

A personal outreach, content and offer tracking tool for [CanHav](https://www.canhav.co) and personal branding in DeFi, blockchain finance and FinTech.

**Neon Postgres is the database.** Every module reads and writes rows in your own Neon project, and everything can be added, edited and deleted directly in the app.

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

### 2. Neon Postgres (the database)

1. Create a project at [console.neon.tech](https://console.neon.tech) (free tier is plenty).
2. Copy the **pooled connection string** from the project's Connection Details.
3. Put it in `.env.local` as `DATABASE_URL`.

Then create all tables automatically:

```bash
npm run bootstrap:db
```

The script is idempotent — re-run it any time a new module is added to `lib/config.ts` and it will create the missing tables and columns.

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
| `DATABASE_URL` | Yes | Neon Postgres connection string (pooled) |
| `INSTANTLY_API_KEY` | For leads | Instantly.ai API v2 key |

## Roadmap

- Principles 5–8 (Principles 1–4 shipped)
- Deeper integration with the canhav-prod platform

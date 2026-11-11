# AI-Powered CRM

A modern, responsive CRM web app to manage leads, track customer interactions, run a sales pipeline and get AI-powered insights for every lead.

- **Live demo:** https://ai-powered-crm-z5p1.vercel.app
- **Demo video:** https://drive.google.com/file/d/1jiZqgEr7m5cZFtt2hK9PrfUkMgBn_cjt/view?usp=sharing

## Features

- **Dashboard:** total leads, new leads, converted customers, pending follow-ups, conversion rate, charts (status distribution, 6-month sales performance, leads by source) and recent activities.
- **Lead management:** add, edit, delete, view a lead profile, search by name / email / company, filter by status, set priority.
- **Sales pipeline:** Kanban board with drag and drop (dnd-kit). A dropdown on each card is an alternative for touch screens. The status is saved to the database.
- **AI lead intelligence:** summary, lead score (1-100), conversion probability, next best action and a personalized follow-up message.
- **Interaction history:** timeline of calls, emails, meetings, notes and follow-up activities for each lead.
- **Follow-up management:** create reminders, set due dates, mark as completed, overdue and upcoming views.
- **UI:** responsive layout, sidebar navigation (top menu on mobile), loading, error and empty states.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Data fetching and forms | TanStack Query, React Hook Form, Zod |
| Charts and drag and drop | Recharts, dnd-kit |
| Backend | Next.js API routes (REST) |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini API (`@google/genai`) with a mock fallback |

## AI implementation details

The AI feature lives in `app/api/ai/analyze/route.ts`.

1. The frontend calls `POST /api/ai/analyze` with a `lead_id`. No API key is ever used in the browser.
2. The server loads the lead and its last 10 activities from Supabase.
3. The server sends them to **Google Gemini** (model `gemini-2.5-flash` by default, set with `GEMINI_MODEL`) and asks for **JSON only** with these fields: `summary`, `score`, `conversion_probability`, `next_best_action`, `follow_up_message`.
4. The response is parsed and validated with Zod. Scores are clamped to valid ranges.
5. The result is saved in the `leads` table (`ai_score`, `ai_probability`, `ai_result`) so it stays after a refresh.

**Mock fallback:** if `GEMINI_API_KEY` is missing, or the Gemini call fails, the server returns a rule-based **mock response** (based on status, priority, contact details and activity count). The UI clearly shows when a mock response is used.

> Update this section to match what is used in your deployed version (real Gemini or mock).

## Getting started

### 1. Install

```bash
git clone <YOUR_REPO_URL>
cd crm-app
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Keys are used on the server only. Never commit `.env.local`.

### 3. Database

Open the Supabase SQL Editor and run the SQL from `supabase/schema.sql` (tables: `leads`, `activities`, `follow_ups`). Optional sample data is in `supabase/seed.sql`.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## API routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/leads` | GET, POST | List (search and filter) and create leads |
| `/api/leads/[id]` | GET, PATCH, DELETE | Read, update (also used for pipeline moves) and delete a lead |
| `/api/activities` | GET, POST | Lead timeline |
| `/api/follow-ups` | GET, POST | Follow-up reminders |
| `/api/follow-ups/[id]` | PATCH, DELETE | Complete or delete a follow-up |
| `/api/stats` | GET | Dashboard numbers and chart data |
| `/api/ai/analyze` | POST | AI lead intelligence |

## Project structure

```
app/
  (dashboard)/        pages: dashboard, leads, leads/[id], pipeline, follow-ups
  api/                REST API routes
components/           shared UI (sidebar, forms, timeline, AI panel)
lib/                  Supabase client, Zod schemas, types, helpers
supabase/             SQL for tables and sample data
```

## Known limitations

- There is no login. This is a demo project and the API routes are open.
- AI scores are suggestions and should not replace sales judgment.

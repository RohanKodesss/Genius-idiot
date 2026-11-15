# Genius Idiot

A private study/work tracker built on one promise:

> **A missed day never becomes overdue debt.**
> The task moves to tomorrow, everything after it slides forward, and the daily load never grows.

Built with React + Vite + Tailwind + Recharts + date-fns + Supabase. No custom backend — Supabase
is the backend. All business logic is pure functions in `src/lib/`.

---

## Contents

1. [What this app does](#1-what-this-app-does)
2. [Run it in 2 minutes (demo mode)](#2-run-it-in-2-minutes-demo-mode)
3. [Connect a real Supabase project](#3-connect-a-real-supabase-project)
4. [Your first five minutes](#4-your-first-five-minutes)
5. [How the engine works](#5-how-the-engine-works)
6. [Entering a roadmap](#6-entering-a-roadmap)
7. [Daily use](#7-daily-use)
8. [Streaks, graphs and the health warning](#8-streaks-graphs-and-the-health-warning)
9. [Where your data lives](#9-where-your-data-lives)
10. [Project structure](#10-project-structure)
11. [Scripts, tests, deploy](#11-scripts-tests-deploy)
12. [Troubleshooting](#12-troubleshooting)
13. [What this app deliberately does not do](#13-what-this-app-deliberately-does-not-do)
14. [Design decisions (frozen)](#14-design-decisions-frozen)
15. [Docs index](#15-docs-index)
16. [Contributing & contact](#16-contributing--contact)

---

## 1. What this app does

You have goals — DSA, Web Development, Content Writing. Each goal is an **ordered queue of tasks**.
You do **one task per day per goal**. If you miss a day, nothing piles up: the queue slides forward
by one day and only the finish date changes.

Everything else — streaks, heatmap, progress, the shift graph — is **computed from completed work**,
never stored. That is why there is no cron job, no nightly job, no "mark overdue" batch.

**The core rule:** today's task is `today + your position in the pending queue`.

---

## 2. Run it in 2 minutes (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:5173. With no Supabase env vars the app runs in **demo mode**: data lives in
`localStorage`, pre-seeded with 3 goals × 10 tasks. Log in with any email/password (it's pre-filled).
Everything works offline, including completing tasks and shifts.

Demo mode is also your insurance: if the network or auth dies during a demo, set
`VITE_DEMO_MODE=true` and the app keeps working from the browser.

---

## 3. Connect a real Supabase project

### 3.1 Create the tables

Open your project → **SQL Editor** → paste all of `supabase/schema.sql` → **Run**.

That single file creates:

| Object | What it is |
|---|---|
| `public.goals` | one row per goal (name, daily minutes) |
| `public.tasks` | the ordered queue (`"order"`, `planned_date`, `completed_at`) |
| `public.rest_days` | one row per goal per rest day |
| indexes | FK lookups, ordered queues, completed-task partial index |
| triggers | `updated_at` maintained by Postgres |
| RLS policies | 6 policies; every row is private to its owner |
| `reorder_task(uuid, integer)` | atomic reorder inside one transaction |

Verify in the SQL editor:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
select proname from pg_proc where proname = 'reorder_task';
```

### 3.2 Environment variables

Copy `.env.example` to `.env`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable / anon key>
VITE_DEMO_MODE=false
```

- Use the **publishable / anon** key. **Never** put the `service_role` key in a frontend env var.
- If either value is empty, the app silently falls back to demo mode.

### 3.3 Email confirmation (required)

The app opens on **Create your account**, and Supabase sends a confirmation link before the account
can be used. Unconfirmed signups cannot log in — the app shows a "Confirm your email" screen with a
resend button.

Two project settings must match your app URL, or the links in those emails point at the wrong place:

- **Authentication → URL Configuration → Site URL** — set it to the app origin, e.g.
  `http://localhost:5173` in development.
- **Redirect URLs** — add `http://localhost:5173/**` (and your production URL later).

This project is already configured for `http://localhost:5173`. If you deploy, add the deployed
origin to both fields or confirmation links will fail.

Password reset emails use the same settings: the link returns the user to
`<app origin>/reset-password`, so the wildcard redirect entry above covers it.

The built-in SMTP is limited to a couple of signup emails per hour. For testing real accounts,
either wait, configure a custom SMTP, or turn off **Authentication → Providers → Email → Confirm
email** temporarily (the app still refuses unconfirmed sessions, but new signups are auto-confirmed).

---

## 4. Your first five minutes

1. **Create an account.** The app opens on account creation; a new user cannot get in without
   signing up and confirming the email. Existing users switch to **Log in**. In demo mode any
   credentials work.
2. **Set up a goal.** Name it (`DSA`), set daily minutes (`60`), press **Add goal**.
3. **Add its roadmap** — three ways, same result:
   - **Card builder** (default): set a start date, add cards (title, optional link, optional minutes).
     Card 1 lands on the start date, card 2 the next day, and so on.
   - **Markdown**: paste a strict checklist, preview, import.
   - **Quick paste**: paste a plain list, a spreadsheet column, or drop a `.txt` / `.csv` file.
   - Every method uses the same start date, so you can mix them per goal.
4. Repeat for each goal. The setup gate keeps you on this screen until every goal has at least one task — or press **Set up later** to use the dashboard first.
5. Press **Go to today**.

You now see one card per goal with today's task. Press **Complete** on one — the card updates
instantly, the next task becomes tomorrow's, and the streak badge appears.

---

## 5. How the engine works

### 5.1 The queue

Each goal has its own queue, ordered by `"order"` (1-based, unique per goal). Completed tasks stay in
the queue — they are history, not deleted.

### 5.2 `planned_date` — a frozen snapshot

`planned_date` is a calendar date assigned when a task is created or imported:

- Card builder / Markdown: `planned_date = start date + position among the cards`
- Single "Add task": `planned_date = today + number of pending tasks`

It is **not** recomputed when you complete a task, when the page loads, or at midnight. It is the
baseline used to measure how far the queue has slipped.

### 5.3 Projection — today's task

Only pending tasks (no `completed_at`) are projected, in `"order"`:

```
projected = today + index among pending tasks
```

So the first pending task is today's, the second is tomorrow's, the third is the day after.

### 5.4 Shift — the thing that replaces "overdue"

```
shift = projected − planned_date
```

| Task | planned_date | projected | shift |
|---|---|---|---|
| Task 5 | Nov 10 | Nov 12 | +2 |
| Task 6 | Nov 11 | Nov 13 | +2 |

Nothing is "overdue". The task is simply two days later than planned, and every later task moved with
it. The daily load is still one task.

### 5.5 Completing early, and catch-up

- The **timer** on each Today card counts down the goal's `daily_minutes`. The task is marked done
  only when it reaches `00:00`; pausing, reloading or leaving the tab keeps the elapsed time, and
  **Finish early** (running or paused) logs what you actually spent.
- Completing a task before its projected day is fine — it counts for the day you completed it.
- Completing two tasks in one day pulls the whole queue forward by a day.
- `est_minutes` is display-only in v1: the projection always assumes 1 task = 1 day.

### 5.6 Rest days

Marking a rest day for a goal on a date:

- protects that goal's streak for the day (it counts as "kept up"),
- is shown on Today as "Resting today",
- does not touch the queue; the projection still uses `today + index`.

### 5.7 What is derived (never stored)

| Thing | Derived from |
|---|---|
| Today's task / finish date | pending tasks + `today` |
| Shift | `projected − planned_date` |
| Shift history graph | replay of `completed_at` over past planned dates |
| Streak | `completed_at` days + `rest_days` |
| Heatmap | count of `completed_at` per day |
| Progress | completed / total |
| Today's load | `daily_minutes` + today's completions/rests |

There is no `status` column, no `projected_date`, no `current_streak`, no `shift_snapshots` table.

### 5.8 Reordering

Reordering is a single call to the `reorder_task` Postgres function, which shifts the affected range
and renumbers inside one transaction. Reordering changes **which task comes next**; stored
`planned_date` values are not rewritten.

---

## 6. Entering a roadmap

### 6.1 Card builder (recommended)

- **Start date** seeds the sequence: card 1 = start, card 2 = start + 1 day, …
- Each card: title (required), link (optional, must start with `http://` or `https://`), minutes
  (optional, positive whole number).
- Blank cards are ignored and do not consume a day.
- The footer previews the exact range: `4 tasks ready · 2026-11-14 → 2026-11-17`.

### 6.2 Markdown

```markdown
# DSA
- [ ] Arrays basics | https://example.com/arrays | 45
- [ ] Two pointers
- [ ] Sliding window | 45
```

Rules:

| Part | Rule |
|---|---|
| `# Heading` | first one becomes the goal name (optional, informational) |
| `- [ ]` | required prefix for every task |
| title | everything before the first `|` |
| link | any `http(s)://` part |
| minutes | any positive integer part |
| anything else | reported as an error with its line number |

Import is blocked while any line has an error. The start date works exactly like the card builder.

### 6.3 Quick paste (anything)

The forgiving importer. One task per line, and these all work:

```text
title, link, minutes          ← spreadsheet header row (optional)
Arrays basics, https://example.com/arrays, 45
Two pointers                  ← plain title
- Sliding window | 45         ← bullet + minutes
1. Binary search              ← numbered list
- [ ] Recursion               ← pasted checklist
```

- Delimiters: comma, tab, or `|`. Quoted cells keep their commas: `"Arrays, basics"`.
- Fields after the title are recognised by shape — a URL is a link, a whole number is minutes —
  so column order does not matter.
- A header row (`title,…`) is skipped.
- You can also **drop a file** (`.txt`, `.md`, `.csv`, `.tsv`) onto the box or use **Choose file**.
- Errors show their line number and block the import.

### 6.4 Which one should I use?

| Situation | Use |
|---|---|
| Hand-writing 5–20 tasks | Card builder |
| A file you already have in Markdown | Markdown |
| Copying from Excel, Notion, a syllabus, or a chat | Quick paste |

---

## 7. Daily use

| Action | Where | Notes |
|---|---|---|
| Start the timer | Today card → **Start · N min** | counts down the goal's `daily_minutes` |
| Pause / resume | Timer → **Pause** / **Resume** | partial progress survives a reload |
| Reset the timer | Timer → **Reset** | clears the countdown; the task stays pending |
| Finish early | Timer → **Finish early** (running or paused) | logs the elapsed minutes and completes the task |
| Task completes | automatically at `00:00` | logs `daily_minutes`; the queue moves forward |
| Undo a completion | Today card → **Undo** | clears `completed_at` and logged minutes |
| Log minutes | Today card → minutes + **Log** | optional, display-only |
| Write a note | Today card or Goal page → **Add note** | per task; saved with the task, never touched by a shift |
| Mark a rest day | Today card / goal page | toggles; protects the streak |
| See today's total | Today header | minutes done / total, goals done / total |
| See next 7 days | Goal page | planned vs projected table |
| Reorder | Goal page → Roadmap | ↑ / ↓ uses the RPC |
| Edit / delete a task | Goal page → Roadmap | delete asks for confirmation |
| Add one task | Goal page → Roadmap → **Add task** | appended to the end of the queue |
| Rename / delete a goal | Settings | delete cascades to tasks + rest days |
| Export | Settings → **Export JSON** | goals + tasks + rest days snapshot |
| Reset a forgotten password | Login → **Forgot password?** | emails a link that opens `/reset-password` |
| Read the guide | Sidebar → **How it works** | what the app does, in plain language |
| Log out | Header / Settings | session cleared |

---

## 8. Streaks, graphs and the health warning

**Per-goal streak:** consecutive calendar days ending today on which the goal was completed **or**
marked as rest. A missed day breaks it. If today isn't done yet, the streak is counted from
yesterday, so it doesn't show 0 all morning.

**Overall streak:** consecutive days on which **every** goal was completed or rested.

**Longest streak:** the best run in the goal's history.

**Shift graph:** for each of the last 30 days, how far the first still-pending task had slipped by the
end of that day. Derived by replaying `completed_at` — no snapshot table.

**Heatmap:** one square per day for the last 26 weeks, filled when at least one task was completed.

**Health warning:** when a goal's worst pending task is more than 14 days behind, the goal page offers
two honest choices:

- **Trim last N** — deletes the last N pending tasks (completed work is never touched),
- **Accept new finish date** — dismisses the warning for the session.

---

## 9. Where your data lives

Three tables, all protected by Row Level Security:

```
goals (id, user_id → auth.users, name, daily_minutes, created_at, updated_at)
  └── tasks (id, goal_id, "order", title, link, est_minutes,
             planned_date, completed_at, minutes_spent, notes,
             created_at, updated_at)
  └── rest_days (id, goal_id, date, created_at)
```

- `planned_date` is a `date` (calendar day). `completed_at` is a `timestamptz` (a moment).
- `UNIQUE(goal_id, "order")` is `DEFERRABLE` — required by `reorder_task`.
- RLS: a user can only read/write their own goals; tasks and rest days inherit ownership through
  their goal. Deleting a goal cascades to its tasks and rest days.
- The frontend only ever holds the publishable key. There is no `service_role` key in the bundle and
  no `dangerouslySetInnerHTML` anywhere.

---

## 10. Project structure

```
src/
  lib/                 pure functions — no React, no network, no `new Date()`
    dates.js           local 'YYYY-MM-DD' helpers
    projection.js      projection, shift, shift history (+ frozen decisions)
    streaks.js         streaks (+ frozen decisions)
    markdown.js        roadmap parser
    roadmap.js         card builder → task rows
    quickImport.js     forgiving CSV / list / file parser
    timer.js           timer maths (pure)
    heatmap.js         completed-per-day map
    progress.js        progress + today's totals
    repository.js      the ONLY file that talks to Supabase
    localRepository.js localStorage implementation (demo mode)
  context/AppContext.jsx   state, derived data, optimistic actions, auth
  components/          presentational + domain components
  screens/             Login, Setup, Today, GoalDashboard, Settings
  routes/AuthGuard.jsx session gate + setup gate
  __tests__/           Vitest tests for lib/
supabase/schema.sql    tables, indexes, triggers, RLS, reorder_task
docs/                  PRD, Architecture, Database, API, UI, TRD, Testing
```

Data flows down only: screens → context → repository → Supabase. Components never mutate context
state; they call actions, which apply the change optimistically and roll back on failure.

---

## 11. Scripts, tests, deploy

| Command | What it does |
|---|---|
| `npm run dev` | dev server on :5173 |
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve the production build |
| `npm run test` | Vitest (pure `lib/` functions) |
| `npm run test:watch` | Vitest in watch mode |

**Deploy to Vercel:** import the repo, build `npm run build`, output `dist`, add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables. `vercel.json` rewrites
every route to `index.html`, so deep links work.

**Before showing it to anyone:** run `npm run test`, log in with two different accounts and confirm
each sees zero of the other's goals (RLS), and rehearse the missed-day shift once.

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `PGRST205: Could not find the table 'public.goals'` | schema never applied | run `supabase/schema.sql` in the SQL editor |
| Login works, dashboard empty, toast "Could not load your data" | wrong env vars, or tables missing | check `.env`, restart `npm run dev` |
| Signup succeeds but no email arrives | Supabase SMTP rate limit (2/hour) | wait, add a custom SMTP, or disable "Confirm email" while testing |
| Confirmation link opens `localhost:3000` or a blank page | Site URL does not match the app | set **Site URL** / **Redirect URLs** to the app origin |
| Reset link logs you in but shows no form | redirect URL not allowed, so the recovery session is dropped | add the app origin (`http://localhost:5173/**`) to **Redirect URLs** |
| "Reset link expired or already used" | the link was opened twice, or in a different browser | request a fresh link from Login → **Forgot password?** |
| `email rate limit exceeded` (429) | too many signups per hour | wait, or disable confirmation |
| PATCH/DELETE returns `[]` | RLS: the row isn't yours | the app treats it as 404 and rolls back the optimistic change |
| App runs from `localStorage` unexpectedly | env vars empty → demo mode | fill in `.env` or set `VITE_DEMO_MODE=false` |
| Reorder throws `23505` | unique constraint not deferrable | re-run `supabase/schema.sql` |
| "Database not set up" toast | tables missing | run the schema |

---

## 13. What this app deliberately does not do

No AI, no PDF import, no email notifications, no social login, no Google Calendar, no payments, no
collaboration, no tags or tag filters, no date-range filters, no pagination, no websockets, no custom
backend, no `projected_date` column, no stored streaks.

If a feature needs a new table or column, update `docs/DATABASE_SCHEMA.md` first — then migrate. The
schema is frozen for a reason: every stored derived value becomes a second source of truth.

---

## 14. Design decisions (frozen)

Written at the top of `src/lib/projection.js` and `src/lib/streaks.js`:

1. **`planned_date` is a frozen snapshot** — set on create/import, never recomputed on completion,
   read, or reorder.
2. **Streak** = consecutive days completed **or** rested, ending today; overall = every goal kept up.
3. **Shift graph is derived** from `completed_at`; there is no `shift_snapshots` table.
4. **`est_minutes` is display-only** in v1 — the projection assumes 1 task = 1 day.

---

## 15. Docs index

| Doc | What it covers |
|---|---|
| `docs/PRD.md` | problem, users, requirements, MVP scope |
| `docs/ARCHITECTURE.md` | four layers, data flow, demo mode |
| `docs/DATABASE_SCHEMA.md` | tables, constraints, RLS, `reorder_task` |
| `docs/REST_API_SPEC.md` | every endpoint and error contract |
| `docs/UI_SPEC.md` | palette, typography, screens, states, a11y |
| `docs/TRD.md` | stack, performance, security, testing (partially truncated at source) |
| `docs/TESTING.md` | unit tests, API tests, RLS test, demo rehearsal |
| `AGENTS.md` | the build contract and invariants |

---

## 16. Contributing & contact

Genius Idiot is built in the open. Issues, ideas, docs fixes and pull requests are all welcome — the
best first contribution is usually the roadmap import that failed for you, or a paragraph that did not
explain itself.

Start with **[CONTRIBUTING.md](CONTRIBUTING.md)**. It covers the layering rule (`src/lib/` stays pure),
the frozen scheduling decisions, the schema rules, and the checks to run before opening a PR. There is
no CLA and no process beyond that.

| Where | Link |
|---|---|
| Source code | https://github.com/SidhCodez/Genius-idiot |
| Contributor guide | [CONTRIBUTING.md](CONTRIBUTING.md) |
| LinkedIn | https://www.linkedin.com/in/siddiq-dev |
| Discord | `sidhdev` |

Built by **Siddiq** — say hello on [LinkedIn](https://www.linkedin.com/in/siddiq-dev) or on Discord at
`sidhdev`. The same links live in the app, under **How it works → Contribute**.

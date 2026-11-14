# Genius Idiot

A private study/work tracker where **missed days never become overdue debt**. Miss a day and the
task quietly moves to tomorrow; everything after it slides forward. Daily load stays constant — only
the finish date moves.

React + Vite + Tailwind + Recharts + date-fns + Supabase. No custom backend. All business logic is
pure functions in `src/lib/`.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints. With no Supabase env vars the app runs in **demo mode** (localStorage,
seeded with 3 goals × 10 tasks) — any email/password logs you in.

## Connect Supabase

1. **Run the schema.** Paste `supabase/schema.sql` into the Supabase SQL editor and run it once.
   It creates `goals`, `tasks`, `rest_days`, indexes, updated-at triggers, RLS policies, and the
   `reorder_task` RPC.
2. **Env.** Copy `.env.example` to `.env` and fill in:

   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable / anon key>
   VITE_DEMO_MODE=false
   ```

   Never put the `service_role` key here.
3. **Auth.** Email confirmation is on by default in Supabase. Either confirm the email after
   sign-up, or turn confirmation off in Authentication → Providers → Email for a fast demo.

`VITE_DEMO_MODE=true` (or empty URL/key) runs entirely from localStorage — the demo insurance if
the network or auth dies mid-demo.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |
| `npm run test` | Vitest unit tests for `src/lib/` |

## How it works (the whole product)

- Each goal is an ordered queue of tasks (`"order"` 1-based, unique per goal).
- `planned_date` is a frozen snapshot taken when the roadmap is created/edited.
- Today's task = the first pending task; the next pending task is today + 1, and so on.
  `shift = projected − planned_date`.
- Completing early is fine. Completing two in a day pulls the queue forward.
- Streaks, heatmap, progress and the shift graph are all derived from `completed_at` and
  `rest_days` — never stored.
- Reordering goes through the `reorder_task` Postgres function (one transaction).

Pre-build decisions are written as comments at the top of `src/lib/projection.js` and
`src/lib/streaks.js`.

## Structure

```
src/
  lib/            pure functions + the only Supabase access (repository.js)
  context/        AppContext: state, derived data, optimistic actions
  components/     presentational + domain components
  screens/        Login, Setup, Today, GoalDashboard, Settings
  routes/         AuthGuard
supabase/schema.sql
docs/             PRD, Architecture, Database, API, UI, TRD, Testing
```

## Deploy

Vercel: import the repo, build `npm run build`, output `dist`, set the two `VITE_SUPABASE_*`
environment variables. `vercel.json` rewrites all routes to `index.html`.

## Notes

- Docs list `today` as a `Date` in the test examples; the implementation and tests use a local
  `'YYYY-MM-DD'` string so timezone never moves a day boundary.
- `docs/TRD.md` is truncated at the source; its §11+ sections (and Appendix C) are missing.

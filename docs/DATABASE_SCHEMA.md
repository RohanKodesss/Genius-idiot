# Database Schema Design
## Genius Idiot — Smart Study & Work Tracker

**Document version:** 1.0
**Author role:** Senior Database Engineer
**Audience:** Beginner hackathon team + hackathon judges
**Companion docs:** PRD v1.0, TRD v1.0, Architecture v1.0

---

## How to read this document

This is the **database schema** — the shape of the data, the rules that protect it, and the reasoning behind every table and column. It is written so that a beginner can:

1. Copy the SQL at the end and have a working database in 5 minutes.
2. Understand *why* each table exists (not just *what* it looks like).
3. Answer a judge's question: *"Why did you design it this way?"*

**The one-sentence schema (memorize this for the demo):**

> Three tables — `goals`, `tasks`, and `rest_days` — plus Supabase's managed `auth.users`. The entire product's state is one user's ordered queue of tasks per goal, and everything else (projections, streaks, heatmaps) is **computed** from those rows, never stored.

**What makes this schema unusual (in a good way):** it is deliberately **thin**. There are no status columns, no cached streak counters, no materialized views, no `projected_date` fields. Every value the user sees is derived at read time from three small tables. This is the schema's superpower — and the reason it fits a 48-hour hackathon.

---

## 1. Table Inventory (what exists, what Supabase provides)

| Table | Owner | Purpose | User-touchable? |
|---|---|---|---|
| **`auth.users`** | Supabase (GoTrue) | User accounts: email, hashed password, metadata | ❌ Never create, alter, or delete rows directly |
| **`auth.sessions`** | Supabase (GoTrue) | Active login sessions (JWT → refresh token) | ❌ Never touch |
| **`auth.refresh_tokens`** | Supabase (GoTrue) | Refresh tokens for session renewal | ❌ Never touch |
| **`public.goals`** | **You** | One row per study goal (DSA, Web Dev, etc.) | ✅ Full CRUD via RLS |
| **`public.tasks`** | **You** | One row per task in a goal's ordered queue | ✅ Full CRUD via RLS |
| **`public.rest_days`** | **You** | One row per rest day per goal | ✅ Full CRUD via RLS |

### 1.1 Why `auth.users` and `auth.sessions` are listed but not created by you

Supabase ships with a pre-built authentication schema in the `auth` PostgreSQL schema. It handles password hashing (bcrypt), JWT issuance, session refresh, and OAuth — all the security-critical parts you should never hand-roll.

**Your job is to read from it (indirectly) and reference it via foreign keys.** Here's what matters from `auth.users`:

| Column | Type | What it is |
|---|---|---|
| `id` | `uuid` | The user's unique ID — **this is what your `goals.user_id` references** |
| `email` | `text` | The user's login email |
| `created_at` | `timestamptz` | Signup timestamp |
| `last_sign_in_at` | `timestamptz` | Last login (useful for debugging) |
| `encrypted_password` | `text` | Bcrypt hash — **never select this** |

**And from `auth.sessions`:**

| Column | Type | What it is |
|---|---|---|
| `id` | `uuid` | Session ID |
| `user_id` | `uuid` | FK to `auth.users.id` |
| `created_at` | `timestamptz` | Session start |
| `updated_at` | `timestamptz` | Last activity |
| `not_after` | `timestamptz` | Session expiry |

**The rule for the hackathon team:** you never run `CREATE TABLE` on anything in the `auth` schema. You only reference `auth.users(id)` in your foreign keys. `supabase.auth.signUp()` and `.signInWithPassword()` populate these tables for you.

### 1.2 Why there are no lookup tables

A **lookup table** is a small reference table that holds a fixed set of values — like `task_statuses(name)` containing `'pending'`, `'completed'`, `'skipped'`. You'd use one when a column's allowed values are enumerated and you want to enforce them at the database level.

**This schema has none, deliberately:**

| Candidate lookup | Why it's not needed |
|---|---|
| `task_statuses` | Status is derivable from `completed_at`: `NULL` = pending, non-NULL = completed. Adding an explicit status column creates a second source of truth that can drift. |
| `goal_categories` | The PRD doesn't define categories. Goals are user-named and independent. |
| `difficulty_levels` | Not in the PRD. `est_minutes` is a free-form integer, not an enum. |
| `streak_types` | Streaks are computed, not stored. No table needed. |

**If the app later adds tags or categories**, that's when a lookup appears. The pattern is:

```sql
-- Hypothetical extension (NOT in this schema)
create table task_tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table task_tag_links (
  task_id uuid references tasks(id) on delete cascade,
  tag_id  uuid references task_tags(id) on delete cascade,
  primary key (task_id, tag_id)
);
```

This is a classic **many-to-many with a junction table**. You'd only add it if the PRD gained a "tag tasks" feature. Right now, adding it would be scope creep — and a beginner team doesn't need to maintain a join table they can't demo.

**The senior-engineer principle:** *Tables exist to store facts, not to enumerate values that are derivable.* If you can compute it, don't store it.

---

## 2. Entity-Relationship Diagram

```
┌──────────────────────────┐
│  auth.users (Supabase)   │
│  ─────────────           │
│  id          uuid  PK    │
│  email       text        │
│  created_at  timestamptz │
└────────────┬─────────────┘
             │
             │ 1 user owns N goals
             │ (ON DELETE CASCADE)
             ▼
┌──────────────────────────┐
│  goals                   │
│  ─────────────           │
│  id            uuid  PK  │
│  user_id       uuid  FK  │──────┐
│  name          text      │      │
│  daily_minutes integer   │      │
│  created_at    timestamptz│     │
│  updated_at    timestamptz│     │
│                          │      │
│  UNIQUE(user_id, name)   │      │
└────────────┬─────────────┘      │
             │                     │
     ┌───────┴────────┐            │
     │                │            │
     │ 1 goal has     │ 1 goal has │
     │ N tasks        │ N rest days│
     │ (CASCADE)      │ (CASCADE)  │
     ▼                ▼            │
┌──────────────┐  ┌──────────────┐ │
│  tasks       │  │  rest_days   │ │
│  ──────────  │  │  ──────────  │ │
│  id          │  │  id          │ │
│  goal_id  FK │  │  goal_id  FK │ │
│  order       │  │  date        │ │
│  title       │  │              │ │
│  link        │  │ UNIQUE       │ │
│  est_minutes │  │ (goal_id,    │ │
│  planned_date│  │  date)       │ │
│  completed_at│  └──────────────┘ │
│  minutes_spent│                  │
│  created_at  │                  │
│  updated_at  │                  │
│              │                  │
│ UNIQUE(goal_id, "order")        │
└──────────────┘                  │
                                  │
     All roads lead back to ──────┘
     auth.users via goals.user_id
```

**Relationships summarized:**

| Relationship | Cardinality | Enforcement |
|---|---|---|
| `auth.users` → `goals` | 1 : N | `goals.user_id` FK, `ON DELETE CASCADE` |
| `goals` → `tasks` | 1 : N | `tasks.goal_id` FK, `ON DELETE CASCADE` |
| `goals` → `rest_days` | 1 : N | `rest_days.goal_id` FK, `ON DELETE CASCADE` |
| `tasks` ↔ `tasks` (ordering within a goal) | N/A (queue) | `UNIQUE(goal_id, "order")` |

**There are no many-to-many relationships in this schema.** Tasks belong to exactly one goal; rest days belong to exactly one goal; goals belong to exactly one user. Every relationship is 1-to-many. This is a deliberate simplification — many-to-many requires a junction table and doubles the query complexity for no product benefit here.

---

## 3. Table-by-Table Detail

### 3.1 `public.goals`

**Why this table exists:** it's the top of the ownership tree. Every piece of user data traces back to a goal, which traces back to a user. Without this table, there is no way to scope data per user or per subject.

**Columns:**

| Column | Type | Nullable? | Default | Constraint | Purpose |
|---|---|---|---|---|---|
| `id` | `uuid` | ❌ Required | `gen_random_uuid()` | PK | Primary key; referenced by `tasks.goal_id` and `rest_days.goal_id` |
| `user_id` | `uuid` | ❌ Required | — | FK → `auth.users(id)` `ON DELETE CASCADE` | Owner; drives RLS |
| `name` | `text` | ❌ Required | — | `UNIQUE(user_id, name)`; `CHECK (length(trim(name)) > 0)` | Display name ("DSA", "Web Development") |
| `daily_minutes` | `integer` | ❌ Required | `60` | `CHECK (daily_minutes > 0 AND daily_minutes <= 1440)` | Planned minutes/day for this goal |
| `created_at` | `timestamptz` | ❌ Required | `now()` | — | Audit / ordering |
| `updated_at` | `timestamptz` | ❌ Required | `now()` | Trigger-maintained | Audit / debugging |

**Design notes:**

- **`UNIQUE(user_id, name)`** prevents a user from having two goals called "DSA." This is a UX guardrail, not a strict product requirement — but the side panel becomes ambiguous if two goals share a name, so the constraint earns its place.
- **`daily_minutes <= 1440`** caps at 24 hours/day. A user could theoretically enter 99999, but the CHECK constraint catches typos before they confuse the dashboard math. (1440 is a soft ceiling; adjust if needed.)
- **`created_at` and `updated_at`** are almost-free and worth keeping: they answer "when did I create this goal?" during debugging, and `updated_at` (via trigger) is useful if you ever add "sort goals by recent activity."

---

### 3.2 `public.tasks`

**Why this table exists:** this is **the product**. Each row is one task in one goal's ordered queue. The entire "missed days never become overdue" behavior is derived from the fact that `completed_at` stays `NULL` for a missed task — the queue position and the planned date together determine the shift.

**Columns:**

| Column | Type | Nullable? | Default | Constraint | Purpose |
|---|---|---|---|---|---|
| `id` | `uuid` | ❌ Required | `gen_random_uuid()` | PK | Primary key |
| `goal_id` | `uuid` | ❌ Required | — | FK → `goals(id)` `ON DELETE CASCADE` | Which goal's queue this task belongs to |
| `"order"` | `integer` | ❌ Required | — | `CHECK ("order" >= 1)`; `UNIQUE(goal_id, "order")` DEFERRABLE | Position in the queue; **the sort key** |
| `title` | `text` | ❌ Required | — | `CHECK (length(trim(title)) > 0)` | Task description ("Arrays basics") |
| `link` | `text` | ✅ Optional | `NULL` | `CHECK (link IS NULL OR link ~ '^https?://')` | Optional resource URL |
| `est_minutes` | `integer` | ✅ Optional | `NULL` | `CHECK (est_minutes IS NULL OR est_minutes > 0)` | Estimated minutes (display-only in v1) |
| `planned_date` | `date` | ❌ Required | — | — | **Frozen snapshot** of when this task was originally planned; the baseline for shift calculation |
| `completed_at` | `timestamptz` | ✅ Optional | `NULL` | — | When the user completed it; `NULL` = pending |
| `minutes_spent` | `integer` | ✅ Optional | `NULL` | `CHECK (minutes_spent IS NULL OR minutes_spent >= 0)` | Optional time log |
| `notes` | `text` | ✅ Optional | `NULL` | — | Free-text note the user writes on the task (what they learned, where they stopped). Not part of the schedule; no constraint, no index |
| `created_at` | `timestamptz` | ❌ Required | `now()` | — | Audit |
| `updated_at` | `timestamptz` | ❌ Required | `now()` | Trigger-maintained | Audit |

**Design notes (the ones judges will ask about):**

1. **Why `"order"` is quoted.** `ORDER` is a reserved SQL keyword. Quoting it (`"order"`) tells Postgres "this is an identifier, not the keyword." You *could* rename it to `position` and avoid quoting forever — that's arguably cleaner. We keep `"order"` because the PRD and TRD already committed to it, and consistency across documents matters more than aesthetics.

2. **Why `UNIQUE(goal_id, "order")` is `DEFERRABLE`.** Reordering swaps two rows' `"order"` values. If the constraint were checked immediately after each row, the swap would fail halfway through (temporarily violating uniqueness). `DEFERRABLE INITIALLY IMMEDIATE` means "check at the end of each transaction unless a function explicitly defers it." Inside a `reorder_task()` function, we `SET CONSTRAINTS ... DEFERRED`, shuffle the rows, and the constraint is validated once at commit. This is the correct, race-free way to reorder.

3. **Why `planned_date` is `date`, not `timestamptz`.** "The date this task was planned for" is a **calendar day**, not a moment in time. Storing it as `date` prevents timezone drift in comparisons (`planned_date = '2026-11-08'` always means November 8th, regardless of the user's timezone).

4. **Why `completed_at` is `timestamptz`, not `date`.** "When did the user complete it?" **is** a moment in time. A `timestamptz` lets the app later compute "completed at 11pm" for analytics, while the heatmap can use `completed_at::date` to bucket by calendar day.

5. **Why `est_minutes` is `nullable` and `daily_minutes` is not.** A goal *always* has a daily budget (it's the user's intent). A task *may or may not* have an estimate — the Markdown format makes it optional (`| 45` suffix). The projection in v1 assumes 1 task = 1 day, so `est_minutes` is display-only. The TRD R5 notes this explicitly; the schema encodes it via `nullable`.

6. **Why `minutes_spent` is `nullable`.** From the PRD: time logging is **optional**. Completion is the only event that matters for streaks and projections; `minutes_spent` is a nicety.

7. **Why there is no `projected_date` or `shift` column.** These are **functions of `today`**, which changes every day. Storing them would mean updating every row every midnight — which is exactly the cascade the queue + projection model avoids. The schema enforces the invariant by having no column to store them in.

8. **Why there is no `status` column.** `completed_at IS NULL` = pending; `completed_at IS NOT NULL` = completed. A separate `status` column would be a second source of truth that could disagree with `completed_at` — a classic bug. Derive, don't store.

---

### 3.3 `public.rest_days`

**Why this table exists:** from the PRD, a rest day "pauses projection and keeps the streak safe; it is not counted as a miss." This is a user intent that has no equivalent in `tasks` — it's a fact about *the goal* on *a date*, not about a task. Without this table, the app would have no way to distinguish "missed day (bad)" from "rest day (intentional)."

**Columns:**

| Column | Type | Nullable? | Default | Constraint | Purpose |
|---|---|---|---|---|---|
| `id` | `uuid` | ❌ Required | `gen_random_uuid()` | PK | Primary key |
| `goal_id` | `uuid` | ❌ Required | — | FK → `goals(id)` `ON DELETE CASCADE` | Which goal the rest day applies to |
| `date` | `date` | ❌ Required | — | `UNIQUE(goal_id, date)` | The rest day |
| `created_at` | `timestamptz` | ❌ Required | `now()` | — | Audit |

**Design notes:**

- **`UNIQUE(goal_id, date)`** prevents marking the same day as rest twice. Without it, double-clicking the rest button would create duplicates and confuse the streak computation.
- **No `user_id`** — ownership is inherited through `goal_id`. Same reasoning as `tasks` (§4.1 below).
- **Why `date` and not `timestamptz`** — a rest day is a calendar day, not a moment. Same reasoning as `planned_date`.
- **No `reason` or `note` column** — out of scope for MVP. If the PRD later adds "why did you rest?", add a nullable `note text` column. That's a one-line migration.

---

## 4. Relationships (Detailed)

### 4.1 One-to-Many: `auth.users` → `goals`

**What it means:** one user can have many goals; each goal belongs to exactly one user.

**How it's enforced:**
```sql
user_id uuid not null references auth.users(id) on delete cascade
```

**Why `ON DELETE CASCADE`:** if a user's account is deleted (e.g., via GDPR request or Supabase admin), all their goals — and transitively their tasks and rest days — are deleted automatically. This is the correct behavior and it's enforced by the database, not the application.

**Why `goals.user_id` is the only place ownership is stored:** every other table inherits ownership through its parent goal. This is the "single source of truth for ownership" pattern — it prevents the inconsistency bug where a task's `user_id` disagrees with its goal's owner.

### 4.2 One-to-Many: `goals` → `tasks`

**What it means:** one goal has many tasks (the ordered queue); each task belongs to exactly one goal.

**How it's enforced:**
```sql
goal_id uuid not null references goals(id) on delete cascade
```

**Why `ON DELETE CASCADE`:** deleting a goal should delete its tasks. One line at the schema level replaces ~10 lines of application code.

**What "the queue" means at the database level:** the `UNIQUE(goal_id, "order")` constraint is the database's guarantee that no two tasks in the same goal can occupy the same queue slot. The application's import and reorder logic maintain contiguity (1, 2, 3, … N); the database enforces non-duplication.

### 4.3 One-to-Many: `goals` → `rest_days`

**What it means:** one goal can have many rest days; each rest day belongs to exactly one goal.

**Why rest days are per-goal, not global:** from the PRD's multi-goal example, "DSA ❌ not done today → DSA queue shifts +1 day" while "Web Dev ✅ done today → streak +1." A rest day on DSA should not pause Web Dev's projection. Per-goal is the only correct scope.

### 4.4 Queue ordering (the non-obvious "relationship")

There is no separate table for "task order." The order is a column on `tasks`, and the relationship between tasks *within a goal* is captured by:

```sql
UNIQUE(goal_id, "order")
```

This is not a formal relational relationship (it's not a foreign key), but it **is** a data integrity constraint that the projection logic depends on. If two tasks share an `"order"`, the sort is non-deterministic and the projection flickers between renders. The constraint prevents that bug at the schema level.

### 4.5 What a Many-to-Many would look like (and why we don't have one)

The most plausible many-to-many for this app would be **task ↔ tag** (if tasks could have multiple tags). That would require:

```sql
-- HYPOTHETICAL — not in this schema
create table tags (id uuid pk, name text);
create table task_tags (
  task_id uuid references tasks(id) on delete cascade,
  tag_id  uuid references tags(id)  on delete cascade,
  primary key (task_id, tag_id)
);
```

**Why we don't have it:** the PRD has no tag feature. Adding it would mean maintaining a join table, a tag CRUD screen, and a tag filter — three features not in the acceptance criteria. The senior-engineer call is to **not** pre-build for a feature that hasn't been requested.

---

## 5. Required vs. Optional Fields

### 5.1 Summary table

| Table | Required (NOT NULL) | Optional (NULLABLE) |
|---|---|---|
| `goals` | `id`, `user_id`, `name`, `daily_minutes`, `created_at`, `updated_at` | — |
| `tasks` | `id`, `goal_id`, `"order"`, `title`, `planned_date`, `created_at`, `updated_at` | `link`, `est_minutes`, `completed_at`, `minutes_spent` |
| `rest_days` | `id`, `goal_id`, `date`, `created_at` | — |

### 5.2 Why these specific fields are optional

| Optional field | Why it can be NULL |
|---|---|
| `tasks.link` | Markdown format allows `- [ ] Task title` with no URL. Many tasks have no external resource. |
| `tasks.est_minutes` | Markdown format allows no ` \| minutes` suffix. The app treats missing estimates as "1 task = 1 day." |
| `tasks.completed_at` | This **is** the pending/completed state. A freshly imported task has never been completed. |
| `tasks.minutes_spent` | Time logging is explicitly optional in the PRD. A user can check ✅ without logging minutes. |

**Why no required field is optional "just in case":** every nullable column is a place where application code must handle `NULL`. Keeping the nullable set small (four columns, all with clear product justification) keeps the codebase simple and the queries readable.

---

## 6. Indexes

### 6.1 The indexes we have

```sql
-- Primary keys (implicit) — every table has one; these are free
goals_pkey      (id)
tasks_pkey      (id)
rest_days_pkey  (id)

-- Foreign key indexes — NOT automatic in Postgres; add these explicitly
goals_user_id_idx          on goals (user_id)
tasks_goal_id_order_idx    on tasks (goal_id, "order")
tasks_goal_id_completed_idx on tasks (goal_id, completed_at) where completed_at is not null
rest_days_goal_id_date_idx on rest_days (goal_id, date)

-- Unique constraints (implicit indexes)
goals_user_id_name_key    (user_id, name)                  ← from UNIQUE(user_id, name)
tasks_goal_id_order_key   (goal_id, "order")               ← from UNIQUE(goal_id, "order")
rest_days_goal_id_date_key (goal_id, date)                 ← from UNIQUE(goal_id, date)
```

### 6.2 Justification for each

| Index | Speeds up | Why it's worth the write cost |
|---|---|---|
| `goals(user_id)` | `SELECT * FROM goals WHERE user_id = auth.uid()` — every page load | Without it, Postgres scans all goals (fine at 10 rows, slow at 10,000 users × 10 goals) |
| `tasks(goal_id, "order")` | `SELECT * FROM tasks WHERE goal_id = ? ORDER BY "order"` — every projection | The composite index returns rows **pre-sorted**, eliminating a sort step on every render |
| `tasks(goal_id, completed_at) WHERE completed_at IS NOT NULL` | Streak/heatmap/progress calculations | **Partial index** — only indexes completed tasks, so it's small and fast even when most tasks are pending |
| `rest_days(goal_id, date)` | Streak calculation looks up rest days per goal | Composite index on the two columns used together |

### 6.3 What we deliberately do NOT index

| Candidate | Why not |
|---|---|
| `tasks(completed_at)` alone | RLS always scopes by `goal_id`; the composite `(goal_id, completed_at)` is what queries actually use |
| `tasks(title)` with full-text search | Search is substring match within a goal's roadmap — a `WHERE goal_id = ? AND title ILIKE '%x%'` query uses the `goal_id` index, then filters in memory. Fine at 500 tasks. |
| `goals(created_at)` | No query sorts goals by creation date |
| `tasks(link)`, `tasks(est_minutes)`, `tasks(minutes_spent)` | Never filtered on directly |
| Any index on `rest_days` alone | Always queried per goal |

**The principle:** every index speeds up reads but slows down writes and consumes storage. At single-user scale, the four indexes above are the entire justified set. Adding "just in case" indexes is premature optimization and a maintenance burden.

---

## 7. Example Records

### 7.1 `auth.users` (managed by Supabase — shown for context)

| id | email | created_at |
|---|---|---|
| `a1b2c3d4-…` | `student@example.com` | `2026-11-01 09:00:00+00` |

### 7.2 `goals`

| id | user_id | name | daily_minutes | created_at | updated_at |
|---|---|---|---|---|---|
| `11111111-1111-1111-1111-111111111111` | `a1b2c3d4-…` | DSA | 60 | `2026-11-01 09:05:00+00` | `2026-11-01 09:05:00+00` |
| `22222222-2222-2222-2222-222222222222` | `a1b2c3d4-…` | Web Development | 70 | `2026-11-01 09:10:00+00` | `2026-11-01 09:10:00+00` |
| `33333333-3333-3333-3333-333333333333` | `a1b2c3d4-…` | Content Writing | 50 | `2026-11-01 09:12:00+00` | `2026-11-01 09:12:00+00` |

### 7.3 `tasks` (DSA queue, 3 tasks)

| id | goal_id | order | title | link | est_minutes | planned_date | completed_at | minutes_spent |
|---|---|---|---|---|---|---|---|---|
| `aaaa1111-…` | `11111111-…` | 1 | Arrays basics | `https://example.com/arrays` | NULL | `2026-11-01` | `2026-11-01 19:00:00+00` | 45 |
| `aaaa2222-…` | `11111111-…` | 2 | Two pointers | NULL | NULL | `2026-11-02` | `2026-11-02 19:30:00+00` | 40 |
| `aaaa3333-…` | `11111111-…` | 3 | Sliding window | NULL | 45 | `2026-11-03` | **NULL** (missed) | NULL |
| `aaaa4444-…` | `11111111-…` | 4 | Binary search | NULL | NULL | `2026-11-04` | NULL | NULL |
| `aaaa5555-…` | `11111111-…` | 5 | Recursion basics | NULL | NULL | `2026-11-05` | NULL | NULL |

**Reading this as the product sees it (today = 2026-11-04):**

- Tasks 1 and 2 are completed.
- Task 3 was **planned for Nov 3 but not completed** — this is the missed day.
- Pending tasks in order: [3, 4, 5].
- **Projection** (computed, not stored):
  - Task 3 → projected `2026-11-04` (today + 0), shift = **+1 day** (Nov 3 → Nov 4)
  - Task 4 → projected `2026-11-05` (today + 1), shift = **+1 day** (Nov 4 → Nov 5)
  - Task 5 → projected `2026-11-06` (today + 2), shift = **+1 day** (Nov 5 → Nov 6)
- **Shift notice shown to user:** "Task 3 moved from Nov 3 → Nov 4 (+1 day). All later tasks shifted +1 day."
- **Daily load:** still 1 task/day. **Finish date:** moved from Nov 5 to Nov 6 (+1 day).

**This is the money demo, and it requires zero writes — just reading these five rows and computing.**

### 7.4 `rest_days`

| id | goal_id | date | created_at |
|---|---|---|---|
| `rrrr1111-…` | `11111111-…` (DSA) | `2026-11-06` | `2026-11-05 20:00:00+00` |
| `rrrr2222-…` | `22222222-…` (Web Dev) | `2026-11-06` | `2026-11-05 20:01:00+00` |

**Reading this:** on Nov 6, DSA and Web Dev are marked as rest days. Content Writing is not — if the user doesn't complete a Content Writing task on Nov 6, that goal's queue shifts +1 day (as expected), while DSA and Web Dev pause their projection and keep their streaks.

### 7.5 Data volume estimate

| Scenario | Goals | Tasks/goal | Total task rows |
|---|---|---|---|
| Single user, MVP | 3 | 100 | **300** |
| Single user, heavy | 10 | 500 | **5,000** |
| 100 users, typical | 3 | 100 | **30,000** |
| 1,000 users, typical | 3 | 100 | **300,000** |

**Postgres on Supabase free tier handles all of these comfortably.** This is why the schema has no partitioning, no sharding, no materialized views — the data is tiny, and the indexes above keep queries fast.

---

## 8. Full SQL Schema

Copy-paste this into the Supabase SQL editor. It's idempotent-ish (uses `create table if not exists` where sensible) and includes all constraints, indexes, triggers, RLS, and the reorder function.

```sql
-- ============================================================
-- GENIUS IDIOT — DATABASE SCHEMA v1.0
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

-- Goals: one per subject the user is tracking
create table if not exists public.goals (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  name          text        not null,
  daily_minutes integer     not null default 60,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint goals_name_not_blank      check (length(trim(name)) > 0),
  constraint goals_daily_minutes_range check (daily_minutes > 0 and daily_minutes <= 1440),
  constraint goals_user_name_unique    unique (user_id, name)
);

-- Tasks: the ordered queue per goal
create table if not exists public.tasks (
  id             uuid        primary key default gen_random_uuid(),
  goal_id        uuid        not null references public.goals(id) on delete cascade,
  "order"        integer     not null,
  title          text        not null,
  link           text,
  est_minutes    integer,
  planned_date   date        not null,
  completed_at   timestamptz,
  minutes_spent  integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint tasks_order_positive       check ("order" >= 1),
  constraint tasks_title_not_blank      check (length(trim(title)) > 0),
  constraint tasks_link_is_url          check (link is null or link ~ '^https?://'),
  constraint tasks_est_minutes_positive check (est_minutes is null or est_minutes > 0),
  constraint tasks_minutes_spent_nonneg check (minutes_spent is null or minutes_spent >= 0),

  -- DEFERRABLE so reorder_task() can shuffle rows inside one transaction
  constraint tasks_goal_order_unique    unique (goal_id, "order") deferrable initially immediate
);

-- Rest days: pause projection + protect streak
create table if not exists public.rest_days (
  id         uuid        primary key default gen_random_uuid(),
  goal_id    uuid        not null references public.goals(id) on delete cascade,
  date       date        not null,
  created_at timestamptz not null default now(),

  constraint rest_days_goal_date_unique unique (goal_id, date)
);

-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

-- Foreign-key indexes (Postgres does NOT create these automatically)
create index if not exists goals_user_id_idx
  on public.goals (user_id);

create index if not exists tasks_goal_id_order_idx
  on public.tasks (goal_id, "order");

-- Partial index: only completed tasks — small and fast for streak/heatmap
create index if not exists tasks_goal_id_completed_idx
  on public.tasks (goal_id, completed_at)
  where completed_at is not null;

create index if not exists rest_days_goal_id_date_idx
  on public.rest_days (goal_id, date);

-- ────────────────────────────────────────────────────────────
-- 3. UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.goals      enable row level security;
alter table public.tasks      enable row level security;
alter table public.rest_days  enable row level security;

-- ── goals: user owns their rows directly ──
drop policy if exists goals_select_own on public.goals;
create policy goals_select_own on public.goals
  for select using (auth.uid() = user_id);

drop policy if exists goals_insert_own on public.goals;
create policy goals_insert_own on public.goals
  for insert with check (auth.uid() = user_id);

drop policy if exists goals_update_own on public.goals;
create policy goals_update_own on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists goals_delete_own on public.goals;
create policy goals_delete_own on public.goals
  for delete using (auth.uid() = user_id);

-- ── tasks: ownership inherited through goals ──
drop policy if exists tasks_all_own on public.tasks;
create policy tasks_all_own on public.tasks
  for all
  using (
    exists (select 1 from public.goals g
             where g.id = tasks.goal_id
               and g.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.goals g
             where g.id = tasks.goal_id
               and g.user_id = auth.uid())
  );

-- ── rest_days: same pattern ──
drop policy if exists rest_days_all_own on public.rest_days;
create policy rest_days_all_own on public.rest_days
  for all
  using (
    exists (select 1 from public.goals g
             where g.id = rest_days.goal_id
               and g.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.goals g
             where g.id = rest_days.goal_id
               and g.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- 5. OPTIONAL: ATOMIC REORDER FUNCTION
-- ────────────────────────────────────────────────────────────
-- Moves a task to a new position and renumbers the affected range.
-- Runs as a single transaction. Uses DEFERRED constraint check so
-- intermediate states are allowed.
--
-- Usage (from supabase-js):
--   await supabase.rpc('reorder_task', { p_task_id: id, p_new_order: 3 })
-- ────────────────────────────────────────────────────────────

create or replace function public.reorder_task(
  p_task_id   uuid,
  p_new_order integer
)
returns void
language plpgsql
security invoker
as $$
declare
  v_goal_id   uuid;
  v_old_order integer;
  v_max_order integer;
begin
  -- Fetch the task's current position
  select goal_id, "order" into v_goal_id, v_old_order
    from public.tasks where id = p_task_id;

  if v_goal_id is null then
    raise exception 'Task % not found', p_task_id;
  end if;

  if p_new_order < 1 then
    raise exception 'p_new_order must be >= 1';
  end if;

  select max("order") into v_max_order
    from public.tasks where goal_id = v_goal_id;

  if p_new_order > v_max_order then
    raise exception 'p_new_order % exceeds max order %', p_new_order, v_max_order;
  end if;

  if v_old_order = p_new_order then
    return;
  end if;

  -- Defer the unique constraint so the intermediate states don't conflict
  set constraints tasks_goal_order_unique deferred;

  if p_new_order < v_old_order then
    -- Moving up: shift the range [p_new_order, v_old_order - 1] down by 1
    update public.tasks
       set "order" = "order" + 1
     where goal_id = v_goal_id
       and "order" >= p_new_order
       and "order" <  v_old_order;
  else
    -- Moving down: shift the range [v_old_order + 1, p_new_order] up by 1
    update public.tasks
       set "order" = "order" - 1
     where goal_id = v_goal_id
       and "order" >  v_old_order
       and "order" <= p_new_order;
  end if;

  -- Place the moved task
  update public.tasks
     set "order" = p_new_order
   where id = p_task_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 6. OPTIONAL: SEED DATA FOR DEMO
-- ────────────────────────────────────────────────────────────
-- Uncomment to seed a demo user's goals + DSA tasks.
-- Replace the user_id with your own after signing up.
-- ────────────────────────────────────────────────────────────

-- insert into public.goals (user_id, name, daily_minutes) values
--   ('<YOUR-USER-UUID>', 'DSA', 60),
--   ('<YOUR-USER-UUID>', 'Web Development', 70),
--   ('<YOUR-USER-UUID>', 'Content Writing', 50);
--
-- insert into public.tasks (goal_id, "order", title, planned_date) values
--   ('<DSA-GOAL-UUID>', 1, 'Arrays basics',    '2026-11-01'),
--   ('<DSA-GOAL-UUID>', 2, 'Two pointers',     '2026-11-02'),
--   ('<DSA-GOAL-UUID>', 3, 'Sliding window',   '2026-11-03'),
--   ('<DSA-GOAL-UUID>', 4, 'Binary search',    '2026-11-04'),
--   ('<DSA-GOAL-UUID>', 5, 'Recursion basics', '2026-11-05');
```

---

## 9. Design Decisions & Tradeoffs (the "why")

### 9.1 Why 3 tables, not 5 or 10

| Candidate table | Why we don't have it |
|---|---|
| `streaks` | Derived from `completed_at` + `rest_days` |
| `heatmap` | Derived from `completed_at` |
| `projections` | Depends on `today` — would need rewriting daily |
| `shifts` | Derived from `projected − planned` |
| `progress` | `completed_count / total_count` |
| `settings` | Belongs in `goals` (daily_minutes) and Supabase auth (`email`) |
| `notifications` | In-app only; no persistence needed |
| `profiles` | Optional; add later if you need display name / timezone |

**The principle:** a table exists to store a **fact**. Everything else is a function of facts. Storing derived data creates dual sources of truth — the #1 source of subtle bugs in tracking apps.

### 9.2 Why UUIDs instead of sequential integers

| | UUID | Bigserial |
|---|---|---|
| Generation | Client or DB, no coordination | DB only |
| Leak risk | None (not enumerable) | Sequential IDs leak row counts |
| Supabase default | ✅ Yes | Possible but non-default |
| Index size | 16 bytes | 8 bytes |
| Readability | Worse in logs | Better in logs |

**Verdict:** UUIDs. The 8-byte difference is irrelevant at this scale; the leak-protection and client-side-generation benefits are real. Supabase's `gen_random_uuid()` makes it free.

### 9.3 Why `planned_date` is stored but `projected_date` is not

**`planned_date`** is a **fact about the past**: "when this task was originally scheduled." It's frozen at import time (and deliberately recomputed on reorder). It doesn't change with `today`, so it's safe to store.

**`projected_date`** is a **function of `today`**: `today + pending_index`. It changes every day (and every time a task is completed early). Storing it would mean updating every row at midnight — the exact cascade the queue model avoids.

**The invariant:** *store facts, compute forecasts.*

### 9.4 Why `UNIQUE(goal_id, "order")` is DEFERRABLE

Reordering is a multi-row update. If the constraint is checked immediately after each row, a swap like "move task 3 to position 5" fails halfway through because position 5 is temporarily occupied. `DEFERRABLE INITIALLY IMMEDIATE` lets a function explicitly defer the check to commit time, so intermediate states are allowed inside the transaction.

**Why not just use a two-step client-side upsert?** It works, but the client must know the exact safe order of updates, which is fragile. A Postgres function encapsulates the atomic operation in one place — the correct tool for a multi-row invariant.

### 9.5 Why `order` is quoted

`ORDER` is a reserved SQL keyword. Quoting it (`"order"`) is the minimal fix. The alternative — rename to `position` — is cleaner but would diverge from the PRD and TRD, which both already use `order`. **Consistency across docs beats a cosmetic improvement.**

### 9.6 Why no `status` column

`completed_at IS NULL` = pending; `completed_at IS NOT NULL` = completed. A `status` column would be a second source of truth — and the two can disagree if a bug sets one but not the other. **Derive, don't duplicate.**

If the app ever needs a "skipped" state (distinct from pending), that would be a real new fact and would justify a `status` column or a `skipped_at timestamptz`. Until then, no column.

---

## 10. What's Deliberately NOT in the Schema

| Feature | Why it's absent | When to add it |
|---|---|---|
| User profiles (display name, avatar, timezone) | Not in the PRD; Supabase auth covers email | If the app adds social features or per-user timezones |
| Task tags / categories | Not in the PRD | If the app adds tag filtering |
| Task attachments (files) | No file uploads in the MVP | If the PRD adds file uploads |
| Notifications history | In-app only; nothing to persist | If the PRD adds email/push |
| Streak snapshots | Computed from `completed_at` | If the derivation becomes too slow (won't at this scale) |
| Shift snapshots | Computed from `completed_at` (Option B, Architecture §4.6) | If the graph needs historical stability (Option A) |
| Soft deletes (`deleted_at`) | Hard deletes + cascade are simpler | If the app needs an undo/trash feature |
| Audit log | Overkill for single-user | If the app becomes multi-user with compliance needs |
| Multi-tenancy tables | RLS is the multi-tenancy mechanism | Never — RLS scales |
| AI / embeddings / prompts | Explicitly out of scope | Never for this product |

**The senior-engineer framing to use with judges:** *"Every table and column in this schema earns its place by storing a fact the product actually needs. We have no speculative columns, no reserved-for-future fields, and no derived data. The schema will not need to shrink — only to grow, if and when the PRD grows."*

---

## 11. Pre-Build Checklist for the Team

Before the first commit, verify:

- [ ] **Run the SQL** — paste §8 into the Supabase SQL editor. No errors.
- [ ] **RLS is enabled** — Supabase dashboard → Authentication → Policies → all 3 tables show policies.
- [ ] **Test RLS with two users** — sign up as A, create a goal; sign up as B, run `select * from goals` in the SQL editor *as B* — expect 0 rows. If B sees A's goal, RLS is broken.
- [ ] **Verify indexes exist** — `select indexname from pg_indexes where schemaname = 'public';` — expect the four from §6.
- [ ] **Test the reorder function** — call `select reorder_task('<task-uuid>', 1);` and verify the queue shifts correctly.
- [ ] **No `service_role` in the frontend** — `grep -r "service_role" src/` → 0 matches.
- [ ] **Test cascade delete** — delete a goal as A; verify its tasks and rest_days are gone (`select count(*) from tasks where goal_id = …` → 0).

These seven checks take ~15 minutes and prevent the four failure modes that would sink the demo: data leaks, broken reorder, orphaned rows, and a leaked service key.

---

## Appendix A — Schema at a glance (for the demo slide)

| Table | Rows (typical) | Columns | Purpose in one line |
|---|---|---|---|
| `auth.users` | 1 per account | ~10 (managed) | Supabase's user account records |
| `public.goals` | 3–10 per user | 6 | One row per subject the user is tracking |
| `public.tasks` | 100–500 per goal | 11 | The ordered task queue per goal |
| `public.rest_days` | 0–20 per goal | 4 | Days the user intentionally paused |

**Total user-controlled columns: 21. Total user-controlled tables: 3. Total lines of SQL: ~120.**

That's the whole database. Everything else — projections, streaks, heatmaps, shift graphs — is computed from these rows by pure functions in the frontend. The schema is small because the product is designed so it can be.
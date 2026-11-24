-- ============================================================
-- GENIUS IDIOT — DATABASE SCHEMA v1.0
-- Copied verbatim from docs/DATABASE_SCHEMA.md §8.
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
  why           text        not null default '',
  is_public     boolean     not null default false,
  public_id     uuid        not null default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint goals_name_not_blank      check (length(trim(name)) > 0),
  constraint goals_daily_minutes_range check (daily_minutes > 0 and daily_minutes <= 1440),
  constraint goals_user_name_unique    unique (user_id, name)
);

alter table public.goals add column if not exists why text not null default '';
alter table public.goals add column if not exists is_public boolean not null default false;
alter table public.goals add column if not exists public_id uuid default gen_random_uuid();
update public.goals set public_id = gen_random_uuid() where public_id is null;
alter table public.goals alter column public_id set default gen_random_uuid();
alter table public.goals alter column public_id set not null;
create unique index if not exists goals_public_id_uidx on public.goals (public_id);

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
  notes          text,
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
  hibernation_id uuid,
  created_at timestamptz not null default now(),

  constraint rest_days_goal_date_unique unique (goal_id, date)
);

alter table public.rest_days add column if not exists hibernation_id uuid;

-- Notes: one free-text note per task. `create table if not exists` above
-- does not add columns to a database that already exists, so this does.
alter table public.tasks add column if not exists notes text;

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

create index if not exists rest_days_hibernation_id_idx
  on public.rest_days (hibernation_id)
  where hibernation_id is not null;

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

-- Public roadmap rows are readable only when explicitly shared. Anonymous
-- clients use get_public_roadmap(), which returns a safe column projection.
drop policy if exists goals_select_public on public.goals;
create policy goals_select_public on public.goals
  for select to anon using (is_public = true);

create or replace function public.goal_is_public(p_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.goals g
    where g.id = p_goal_id and g.is_public = true
  );
$$;
revoke all on function public.goal_is_public(uuid) from public;
grant execute on function public.goal_is_public(uuid) to anon;

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

drop policy if exists tasks_select_public on public.tasks;
create policy tasks_select_public on public.tasks
  for select to anon
  using (public.goal_is_public(goal_id));

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
-- 5. ATOMIC REORDER FUNCTION
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

-- The public API returns only name/public_id and task title/order/completion.
-- It deliberately omits internal IDs, ownership, links, notes, and user data.
create or replace function public.get_public_roadmap(p_public_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select pg_catalog.jsonb_build_object(
    'goal', pg_catalog.jsonb_build_object(
      'name', g.name,
      'public_id', g.public_id
    ),
    'tasks', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'title', t.title,
          'order', t."order",
          'completed_at', t.completed_at
        ) order by t."order"
      )
      from public.tasks t
      where t.goal_id = g.id
    ), '[]'::pg_catalog.jsonb)
  )
  from public.goals g
  where g.public_id = p_public_id
    and g.is_public = true;
$$;

revoke all on function public.get_public_roadmap(uuid) from public;
grant execute on function public.get_public_roadmap(uuid) to anon, authenticated;

-- Anonymous clients must not query base tables directly: row policies protect
-- rows, while the RPC above also enforces the public column allowlist.
revoke select on public.goals, public.tasks from anon, public;

-- Refresh PostgREST's schema cache after applying migrations such as `notes`.
notify pgrst, 'reload schema';

-- ────────────────────────────────────────────────────────────
-- 6. OPTIONAL: SEED DATA FOR DEMO
-- ────────────────────────────────────────────────────────────
-- Uncomment to seed a demo user's goals + DSA tasks.
-- Replace the user_id with your own after signing up.

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

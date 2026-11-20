-- Public, read-only roadmap links. Public rows are served through a restricted
-- RPC projection so owners, emails, task notes, resource links, and internal IDs
-- are never returned to anonymous visitors.
alter table public.goals
  add column if not exists is_public boolean not null default false;

alter table public.goals
  add column if not exists public_id uuid default gen_random_uuid();

update public.goals
   set public_id = gen_random_uuid()
 where public_id is null;

alter table public.goals alter column public_id set default gen_random_uuid();
alter table public.goals alter column public_id set not null;

create unique index if not exists goals_public_id_uidx
  on public.goals (public_id);

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

drop policy if exists tasks_select_public on public.tasks;
create policy tasks_select_public on public.tasks
  for select to anon
  using (public.goal_is_public(goal_id));

create or replace function public.get_public_roadmap(p_public_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select pg_catalog.jsonb_build_object(
    'goal', pg_catalog.jsonb_build_object('name', g.name, 'public_id', g.public_id),
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

revoke select on public.goals, public.tasks from anon, public;

notify pgrst, 'reload schema';

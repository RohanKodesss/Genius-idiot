-- Add the fields used by the motivation prompt and task notes to existing projects.
-- Safe to run more than once; existing goal rows receive an empty motivation.
alter table public.goals
  add column if not exists why text not null default '';

alter table public.tasks
  add column if not exists notes text;

notify pgrst, 'reload schema';

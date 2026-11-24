-- Multi-day tasks: a task can carry a total estimate and accumulate minutes
-- across days instead of occupying exactly one day.
alter table public.tasks add column if not exists total_est_minutes integer
  check (total_est_minutes is null or total_est_minutes > 0);
alter table public.tasks add column if not exists minutes_completed integer
  not null default 0 check (minutes_completed >= 0);

notify pgrst, 'reload schema';

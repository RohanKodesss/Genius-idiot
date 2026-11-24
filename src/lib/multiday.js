// Multi-day task maths. A task with total_est_minutes spans several days at
// the goal's daily pace; a normal task is exactly one day. Pure: no clock, no
// storage, no mutation.

export const isMultiDay = (task) => task?.total_est_minutes != null;

export function remainingMinutes(task) {
  if (!isMultiDay(task)) return null;
  return Math.max(0, task.total_est_minutes - (task.minutes_completed ?? 0));
}

// Slots the task still occupies. A pending task always keeps today's slot, so
// the result is never zero even when the estimate is already met.
export function durationInDays(task, dailyMinutes) {
  const remaining = remainingMinutes(task);
  if (remaining == null || !(dailyMinutes > 0)) return 1;
  return Math.max(1, Math.ceil(remaining / dailyMinutes));
}

// One timer session never runs past the task's remaining minutes.
export function sessionMinutes(task, dailyMinutes) {
  const remaining = remainingMinutes(task);
  if (remaining == null) return dailyMinutes;
  return Math.max(1, Math.min(dailyMinutes, remaining));
}

// Task patch for a finished (or stopped) timer session. The task completes
// only when accumulated minutes reach total_est_minutes.
export function progressPatch(task, minutes, at) {
  const logged = Math.max(0, Number(minutes) || 0);
  if (!isMultiDay(task)) {
    return { completed_at: at, minutes_spent: minutes ?? task.minutes_spent };
  }

  const total = task.total_est_minutes;
  const completed = Math.min(total, (task.minutes_completed ?? 0) + logged);
  const spent = (task.minutes_spent ?? 0) + logged;
  return completed >= total
    ? { minutes_completed: total, minutes_spent: spent, completed_at: at }
    : { minutes_completed: completed, minutes_spent: spent };
}

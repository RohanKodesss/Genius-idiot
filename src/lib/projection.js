// Genius Idiot — projection (the product's engine).
//
// PRE-BUILD DECISIONS (AGENTS.md §2, PRD Appendix C, Architecture §4.6).
// Frozen before coding. Changing one requires updating the docs first.
//
// 1. `planned_date` semantics — FROZEN SNAPSHOT.
//    Assigned when a task is created or imported (start date + queue position).
//    NOT recomputed on completion, on read, at midnight, or on reorder.
//    It is the baseline for shift: shift = projected - planned_date.
//
// 2. Streak definition — see the header of streaks.js (single source of truth).
//
// 3. Shift graph data model — OPTION B: DERIVED, NO TABLE.
//    Shift history is replayed from `completed_at` over past planned dates by
//    a pure function. No `shift_snapshots` table, no cron, no writes.
//
// 4. A task is normally 1 day. A multi-day task (`total_est_minutes`) occupies
//    `ceil((total_est_minutes - minutes_completed) / daily_minutes)` slots, and
//    the next task starts after it. A multi-day task waits for its planned
//    start date when that date is still in the future (long-form tasks). Other
//    tasks keep the frozen "first pending lands today" rule. `est_minutes` stays
//    display-only.
//
// Invariants for every function in this file:
//   - Pure: `today` is a parameter, never `new Date()` inside.
//   - Returns plain objects; mutates nothing it was given.
//   - Dates are calendar days: 'YYYY-MM-DD' strings.
import { addDay, dayOf, diffDay } from './dates';
import { durationInDays } from './multiday';

// One pending task per working day per goal. Rest days pause the queue: the
// first pending task lands on the next day that is not a rest day.
const restSet = (restDays) =>
  new Set(restDays.map((restDay) => (typeof restDay === 'string' ? restDay : restDay.date)));

// Next calendar day that is not a rest day.
function advance(day, rest) {
  let next = addDay(day, 1);
  while (rest.has(next)) next = addDay(next, 1);
  return next;
}

export function computeProjection(tasks, today, restDays = [], dailyMinutes = null) {
  const rest = restSet(restDays);
  const projection = [];
  let day = today;

  [...tasks]
    .filter((task) => !task.completed_at)
    .sort((a, b) => a.order - b.order)
    .forEach((task) => {
      if (task.total_est_minutes != null && task.planned_date > day) day = task.planned_date;
      while (rest.has(day)) day = addDay(day, 1);
      const duration = durationInDays(task, dailyMinutes);
      projection.push({
        ...task,
        projected: day,
        shift: diffDay(day, task.planned_date),
        duration_in_days: duration,
      });
      // The task holds its slots; rest days pause the queue, not the task.
      for (let slot = 0; slot < duration; slot += 1) day = advance(day, rest);
    });

  return projection;
}

export function maxShift(tasks, today, restDays = [], dailyMinutes = null) {
  const projection = computeProjection(tasks, today, restDays, dailyMinutes);
  return projection.length ? Math.max(...projection.map((t) => t.shift)) : 0;
}

// The first free day after every pending task, used to seed planned_date so a
// task queued behind a multi-day task does not look behind on day one.
export function nextStartDay(tasks, today, restDays = [], dailyMinutes = null) {
  const rest = restSet(restDays);
  let day = today;
  [...tasks]
    .filter((task) => !task.completed_at)
    .sort((a, b) => a.order - b.order)
    .forEach((task) => {
      if (task.total_est_minutes != null && task.planned_date > day) day = task.planned_date;
      while (rest.has(day)) day = addDay(day, 1);
      const duration = durationInDays(task, dailyMinutes);
      for (let slot = 0; slot < duration; slot += 1) day = advance(day, rest);
    });
  while (rest.has(day)) day = addDay(day, 1);
  return day;
}


// Shift as it stood at the end of each of the last `days` days.
// A day's shift = how far the first still-pending task had slipped by then,
// counting rest days the same way the projection does.
export function computeShiftHistory(tasks, today, restDays = [], days = 30) {
  const queue = [...tasks].sort((a, b) => a.order - b.order);
  const rest = restSet(restDays);
  const history = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = addDay(today, -offset);
    const firstPending = queue.find(
      (task) => !task.completed_at || dayOf(task.completed_at) > day,
    );
    let projected = day;
    while (firstPending && rest.has(projected)) projected = addDay(projected, 1);
    history.push({
      date: day,
      shift: firstPending ? Math.max(0, diffDay(projected, firstPending.planned_date)) : 0,
    });
  }
  return history;
}

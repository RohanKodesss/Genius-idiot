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
// 4. `est_minutes` is DISPLAY-ONLY in v1.
//    Projection assumes 1 task = 1 day. `est_minutes` never affects scheduling,
//    and `daily_minutes` never caps how many tasks are projected.
//
// Invariants for every function in this file:
//   - Pure: `today` is a parameter, never `new Date()` inside.
//   - Returns plain objects; mutates nothing it was given.
//   - Dates are calendar days: 'YYYY-MM-DD' strings.
import { addDay, dayOf, diffDay } from './dates';

// One pending task per working day per goal. Rest days pause the queue: the
// first pending task lands on the next day that is not a rest day.
const restSet = (restDays) =>
  new Set(restDays.map((restDay) => (typeof restDay === 'string' ? restDay : restDay.date)));

export function computeProjection(tasks, today, restDays = []) {
  const rest = restSet(restDays);
  const projection = [];
  let day = today;

  [...tasks]
    .filter((task) => !task.completed_at)
    .sort((a, b) => a.order - b.order)
    .forEach((task) => {
      while (rest.has(day)) day = addDay(day, 1);
      projection.push({ ...task, projected: day, shift: diffDay(day, task.planned_date) });
      day = addDay(day, 1);
    });

  return projection;
}

export function maxShift(tasks, today, restDays = []) {
  const projection = computeProjection(tasks, today, restDays);
  return projection.length ? Math.max(...projection.map((t) => t.shift)) : 0;
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

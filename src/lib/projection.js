// Genius Idiot — projection (the product's engine).
//
// PRE-BUILD DECISIONS (AGENTS.md §2, PRD Appendix C, Architecture §4.6).
// Frozen before coding. Changing one requires updating the docs first.
//
// 1. `planned_date` semantics — FROZEN SNAPSHOT.
//    Assigned at roadmap creation/edit time (today + 1-based queue index).
//    NOT recomputed on completion, on read, or at midnight. Recomputed only
//    when the roadmap is explicitly edited (import, add, delete, reorder).
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

// One pending task per day per goal: projected = today + index among pending.
export function computeProjection(tasks, today) {
  return [...tasks]
    .filter((task) => !task.completed_at)
    .sort((a, b) => a.order - b.order)
    .map((task, index) => {
      const projected = addDay(today, index);
      return { ...task, projected, shift: diffDay(projected, task.planned_date) };
    });
}

export function maxShift(tasks, today) {
  const projection = computeProjection(tasks, today);
  return projection.length ? Math.max(...projection.map((t) => t.shift)) : 0;
}

// Shift as it stood at the start of each of the last `days` days.
// A day's shift = how far the first still-pending task had slipped by then.
export function computeShiftHistory(tasks, today, days = 30) {
  const queue = [...tasks].sort((a, b) => a.order - b.order);
  const history = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = addDay(today, -offset);
    const firstPending = queue.find(
      (task) => !task.completed_at || dayOf(task.completed_at) > day,
    );
    history.push({
      date: day,
      shift: firstPending ? Math.max(0, diffDay(day, firstPending.planned_date)) : 0,
    });
  }
  return history;
}

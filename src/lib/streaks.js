// Genius Idiot — streaks (computed, never stored).
//
// PRE-BUILD DECISIONS (AGENTS.md §2, PRD Appendix C, Architecture §4.6).
// Frozen before coding. Changing one requires updating the docs first.
//
// 1. `planned_date` semantics — FROZEN SNAPSHOT.
//    Assigned at creation/edit of the roadmap, never recomputed on completion
//    or on read. See projection.js.
//
// 2. STREAK DEFINITION — DECIDED HERE (this is the single source of truth).
//    - Per-goal current streak: consecutive calendar days ending today on which
//      the goal was either COMPLETED (a task has that completed_at day) or
//      marked REST. A missed day breaks it.
//    - A rest day counts as a day in the streak and breaks nothing.
//    - Overall streak: consecutive calendar days ending today on which EVERY
//      goal was completed or rested.
//    - Longest streak: the max run of such days over the goal's whole history.
//    - All of it is derived from `completed_at` + `rest_days`. No stored counter.
//
// 3. Shift graph data model — OPTION B: DERIVED, NO TABLE.
//    Replayed from `completed_at`; no `shift_snapshots` table.
//
// 4. `est_minutes` is DISPLAY-ONLY in v1 (1 task = 1 day). Irrelevant to streaks.
//
// Invariants for every function in this file:
//   - Pure: `today` is a parameter, never `new Date()` inside.
//   - Input is plain arrays (restDays as 'YYYY-MM-DD' strings or {date} rows).
//   - Output is `{ current, longest }`; nothing is persisted.
import { addDay, dayOf } from './dates';

const restDate = (restDay) => (typeof restDay === 'string' ? restDay : restDay.date);

function activeDays(tasks, restDays) {
  const days = new Set();
  tasks.forEach((task) => {
    const day = dayOf(task.completed_at);
    if (day) days.add(day);
  });
  restDays.forEach((restDay) => days.add(restDate(restDay)));
  return days;
}

// Today not being done yet must not show a zero streak all morning, so the
// current run is counted from today if today is active, else from yesterday.
function streakFromDays(days, today) {
  // Future rest days reserve a break, but must not inflate the historical best.
  const sorted = [...days].filter((day) => day <= today).sort();
  let longest = 0;
  let run = 0;
  let previous = null;
  sorted.forEach((day) => {
    run = previous && addDay(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  });

  const set = new Set(sorted);
  let cursor = set.has(today) ? today : addDay(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = addDay(cursor, -1);
  }
  return { current, longest };
}

export function computeStreak(tasks, restDays, today) {
  return streakFromDays(activeDays(tasks, restDays), today);
}

export function computeOverallStreak(goals, tasks, restDays, today) {
  if (!goals.length) return { current: 0, longest: 0 };
  const perGoal = goals.map((goal) =>
    activeDays(
      tasks.filter((task) => task.goal_id === goal.id),
      restDays.filter((restDay) => restDay.goal_id === goal.id),
    ),
  );
  const common = [...perGoal[0]].filter((day) => perGoal.every((set) => set.has(day)));
  return streakFromDays(common, today);
}

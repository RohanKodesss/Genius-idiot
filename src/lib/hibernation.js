import { addDay } from './dates';

// Build the rest-day rows that pause every goal for a bounded hibernation.
// Existing rest days are left alone so repeating the action stays idempotent.
export function buildHibernationRestDays({ goals, restDays, today, days, createId, createdAt }) {
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new RangeError('Hibernation must last between 1 and 90 whole days.');
  }
  const existing = new Set(restDays.map((row) => `${row.goal_id}:${row.date}`));
  const rows = [];
  goals.forEach((goal) => {
    for (let offset = 0; offset < days; offset += 1) {
      const date = addDay(today, offset);
      const key = `${goal.id}:${date}`;
      if (existing.has(key)) continue;
      existing.add(key);
      rows.push({ id: createId(), goal_id: goal.id, date, created_at: createdAt });
    }
  });
  return rows;
}

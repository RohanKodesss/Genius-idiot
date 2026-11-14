// Completed-task counts per calendar day. Derived from completed_at only.
import { dayOf } from './dates';

export function buildHeatmap(tasks) {
  const counts = new Map();
  tasks.forEach((task) => {
    const day = dayOf(task.completed_at);
    if (day) counts.set(day, (counts.get(day) || 0) + 1);
  });
  return counts;
}

import { dayOf } from './dates';
import { computeProjection } from './projection';

// Identify goals that had a task due yesterday and did not complete that task
// yesterday. Reconstruct the queue as it stood at the start of that day.
export function missedYesterdayCount(goals, tasksByGoal, restDaysByGoal, yesterday) {
  return goals.reduce((count, goal) => {
    const tasks = tasksByGoal[goal.id] ?? [];
    const restDays = restDaysByGoal[goal.id] ?? [];
    if (restDays.some((restDay) => restDay.date === yesterday)) return count;

    const atStartOfYesterday = tasks.map((task) =>
      dayOf(task.completed_at) && dayOf(task.completed_at) < yesterday
        ? task
        : { ...task, completed_at: null },
    );
    const dueTask = computeProjection(atStartOfYesterday, yesterday, restDays)[0];
    if (!dueTask) return count;

    const completedOnTime = tasks.some(
      (task) => task.id === dueTask.id && dayOf(task.completed_at) === yesterday,
    );
    return count + (completedOnTime ? 0 : 1);
  }, 0);
}

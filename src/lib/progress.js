// Queue progress and today's minutes. All derived, nothing stored.
import { addDay, dayOf } from './dates';

export function computeProgress(tasks, today) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed_at).length;
  const pending = total - done;
  return {
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
    eta: addDay(today, pending),
  };
}

// A goal counts for today if a task was completed today or it is a rest day.
export function computeTodayTotals(goals, tasks, restDays, today) {
  let minutesDone = 0;
  let minutesTotal = 0;
  let goalsDone = 0;

  goals.forEach((goal) => {
    minutesTotal += goal.daily_minutes;
    const completedToday = tasks.some(
      (task) => task.goal_id === goal.id && dayOf(task.completed_at) === today,
    );
    const restToday = restDays.some(
      (restDay) => restDay.goal_id === goal.id && restDay.date === today,
    );
    if (completedToday || restToday) {
      minutesDone += goal.daily_minutes;
      goalsDone += 1;
    }
  });

  return { minutesDone, minutesTotal, goalsDone, goalsTotal: goals.length };
}

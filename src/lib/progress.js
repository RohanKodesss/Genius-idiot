// Queue progress and today's minutes. All derived, nothing stored.
import { addDay, dayOf } from './dates';

const restSet = (restDays) =>
  new Set(restDays.map((restDay) => (typeof restDay === 'string' ? restDay : restDay.date)));

export function computeProgress(tasks, today, restDays = []) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed_at).length;
  const pending = total - done;

  // Finish date = today plus one working day per pending task (rest days skipped).
  const rest = restSet(restDays);
  let eta = today;
  for (let i = 0; i < pending; i += 1) {
    eta = addDay(eta, 1);
    while (rest.has(eta)) eta = addDay(eta, 1);
  }

  return {
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
    eta,
  };
}

// A goal is due today unless it is a rest day. Rest pauses it: no minutes due,
// not counted as done — but still not counted as a miss (the streak handles that).
export function computeTodayTotals(goals, tasks, restDays, today) {
  let minutesDone = 0;
  let minutesTotal = 0;
  let goalsDone = 0;
  let goalsTotal = 0;

  goals.forEach((goal) => {
    const restToday = restDays.some(
      (restDay) => restDay.goal_id === goal.id && restDay.date === today,
    );
    if (restToday) return;

    goalsTotal += 1;
    minutesTotal += goal.daily_minutes;
    const completedToday = tasks.some(
      (task) => task.goal_id === goal.id && dayOf(task.completed_at) === today,
    );
    if (completedToday) {
      minutesDone += goal.daily_minutes;
      goalsDone += 1;
    }
  });

  return { minutesDone, minutesTotal, goalsDone, goalsTotal };
}

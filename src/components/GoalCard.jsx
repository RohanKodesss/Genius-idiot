import { Link } from 'react-router-dom';
import { ExternalLink, Moon, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDay } from '../lib/dates';
import GoalTimer from './GoalTimer';
import MinutesInput from './MinutesInput';
import StreakBadge from './StreakBadge';
import TaskNote from './TaskNote';

// One goal's card on Today. A rest day pauses the queue, so `projection[0]`
// only counts as today's task when its projected date is actually today.
export default function GoalCard({ goal, projection, streak, progress, restToday, doneToday }) {
  const { today, completeTask, undoTask, updateTask, markRestDay, unmarkRestDay } = useApp();
  const task = projection[0];
  const todayTask = task?.projected === today ? task : null;

  return (
    <section
      aria-label={goal.name}
      className={`bg-parchment rounded-2xl p-5 border shadow-card flex flex-col ${
        todayTask ? 'border-sand' : 'border-sage/30 bg-sage/5'
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <Link
          to={`/goal/${goal.id}`}
          className="font-sans text-lg font-semibold text-ink leading-snug hover:text-champagne"
        >
          {goal.name}
        </Link>
        <StreakBadge days={streak.current} />
      </header>

      <div className="mt-4 flex-1">
        {restToday ? (
          <>
            <p className="font-sans text-lg font-semibold text-ink leading-snug">Rest day today</p>
            <p className="mt-1 text-sm text-slate">
              {task
                ? `Next up ${formatDay(task.projected)}: ${task.title}`
                : 'Nothing queued after today.'}
            </p>
          </>
        ) : todayTask ? (
          <>
            <p className="font-sans text-lg font-semibold text-ink leading-snug">
              {todayTask.title}
            </p>
            {todayTask.link && (
              <a
                href={todayTask.link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-slate hover:text-champagne"
              >
                Open resource <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            {todayTask.shift > 0 && (
              <p className="mt-2 text-xs text-terracotta tabular-nums">
                {todayTask.shift} day{todayTask.shift === 1 ? '' : 's'} later · was planned{' '}
                {formatDay(todayTask.planned_date)}
              </p>
            )}
            <TaskNote
              value={todayTask.notes}
              compact
              onSave={(notes) => updateTask(todayTask.id, { notes })}
            />
            <div className="mt-4">
              <GoalTimer
                goal={goal}
                task={todayTask}
                onFinish={(minutes) => completeTask(todayTask.id, minutes)}
              />
            </div>
          </>
        ) : (
          <p className="font-display text-lg text-ink">
            Everything done for today. <span className="text-slate text-base">Rest well.</span>
          </p>
        )}

        {(todayTask || restToday) && (
          <button
            type="button"
            onClick={() =>
              restToday ? unmarkRestDay(goal.id, today) : markRestDay(goal.id, today)
            }
            aria-pressed={restToday}
            className="mt-4 self-start inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-slate hover:text-ink border border-transparent hover:border-sand"
          >
            <Moon className="w-3.5 h-3.5" aria-hidden="true" />
            {restToday ? 'Resting today' : 'Mark rest day'}
          </button>
        )}
      </div>

      {doneToday && (
        <div className="mt-4 rounded-xl bg-ivory border border-sand px-3 py-2">
          <p className="text-xs text-slate">
            Done today · {doneToday.title}
            {doneToday.minutes_spent != null && (
              <span className="text-mist tabular-nums"> · {doneToday.minutes_spent} min</span>
            )}
          </p>
          {doneToday.minutes_spent == null && (
            <MinutesInput
              value=""
              onSave={(minutes) => updateTask(doneToday.id, { minutes_spent: minutes })}
            />
          )}
          <button
            type="button"
            onClick={() => undoTask(doneToday.id)}
            className="mt-1 inline-flex items-center gap-1 text-xs text-slate hover:text-ink underline underline-offset-4"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Undo
          </button>
        </div>
      )}

      <footer className="mt-4 border-t border-sand pt-3">
        {progress.total > 0 && progress.done === progress.total ? (
          <p className="text-xs text-sage tabular-nums">Roadmap complete · {progress.total} tasks</p>
        ) : (
          <p className="text-xs text-mist tabular-nums">
            {progress.done} / {progress.total} tasks · est. finish {formatDay(progress.eta)}
          </p>
        )}
      </footer>
    </section>
  );
}

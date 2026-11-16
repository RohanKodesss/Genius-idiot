import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, ExternalLink, Flame, Moon, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDay } from '../lib/dates';
import { Badge, Button, Card, EmptyState } from '../components/ui';
import ShiftNotice from '../components/ShiftNotice';
import SmartCalendar from '../components/SmartCalendar';
import ShiftGraph from '../components/ShiftGraph';
import HeatMap from '../components/HeatMap';
import RoadmapList from '../components/RoadmapList';
import HealthWarning from '../components/HealthWarning';
import GoalTimer from '../components/GoalTimer';

function MiniStat({ icon: Icon, label, value, hint }) {
  return (
    <div className="min-w-0 rounded-2xl border border-sand bg-parchment p-4 shadow-card">
      <div className="flex items-center gap-2 text-mist">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-2 break-words font-display text-2xl leading-none tabular-nums text-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-mist">{hint}</p>}
    </div>
  );
}

export default function GoalDashboard() {
  const { goalId } = useParams();
  const [searchParams] = useSearchParams();
  const {
    goals,
    today,
    tasksByGoal,
    restDaysByGoal,
    projectionByGoal,
    streaksByGoal,
    progressByGoal,
    heatmapByGoal,
    shiftHistoryByGoal,
    maxShiftByGoal,
    markRestDay,
    unmarkRestDay,
    completeTask,
    trimLast,
    notify,
  } = useApp();

  const [accepted, setAccepted] = useState(false);
  const goal = goals.find((row) => row.id === goalId);

  if (!goal) {
    return (
      <EmptyState
        headline="Goal not found"
        helper="It may have been deleted."
        action={
          <Link to="/">
            <Button variant="secondary">Back to today</Button>
          </Link>
        }
      />
    );
  }

  const tasks = tasksByGoal[goal.id] ?? [];
  const projection = projectionByGoal[goal.id] ?? [];
  const streak = streaksByGoal[goal.id] ?? { current: 0, longest: 0 };
  const progress = progressByGoal[goal.id] ?? { done: 0, total: 0, pct: 0, eta: today };
  const restToday = (restDaysByGoal[goal.id] ?? []).some((restDay) => restDay.date === today);
  const shift = maxShiftByGoal[goal.id] ?? 0;
  // Same rule as the dashboard card: only a task projected for today can be timed.
  const todayTask = projection[0]?.projected === today ? projection[0] : null;

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Today
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              {goal.name}
            </h1>
            <p className="mt-2 text-sm text-slate tabular-nums">
              {goal.daily_minutes} min/day · {progress.done} / {progress.total} tasks · est. finish{' '}
              {format(fromDay(progress.eta), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {shift > 0 && <Badge tone="terracotta">+{shift} days behind</Badge>}
            <Button
              variant="secondary"
              onClick={() =>
                restToday ? unmarkRestDay(goal.id, today) : markRestDay(goal.id, today)
              }
              aria-pressed={restToday}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              {restToday ? 'Rest day today' : 'Mark rest day'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MiniStat
          icon={Flame}
          label="Streak"
          value={`${streak.current} day${streak.current === 1 ? '' : 's'}`}
          hint={`Best ${streak.longest} days`}
        />
        <MiniStat
          icon={Target}
          label="Progress"
          value={`${progress.pct}%`}
          hint={`${progress.done} of ${progress.total} tasks`}
        />
        <MiniStat
          icon={Target}
          label="Shift"
          value={shift > 0 ? `+${shift} days` : 'On track'}
          hint="Against the plan"
        />
        <MiniStat
          icon={CalendarDays}
          label="Finish"
          value={format(fromDay(progress.eta), 'MMM d')}
          hint="Estimated date"
        />
      </div>

      {restToday && (
        <div className="flex items-center gap-2 rounded-xl border border-champagne/30 bg-champagne/10 px-4 py-3">
          <Moon className="h-4 w-4 text-champagne" aria-hidden="true" />
          <p className="text-sm text-ink">
            Rest day today. Nothing is due — the queue resumes tomorrow.
          </p>
        </div>
      )}

      {todayTask && !restToday && (
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">
            Today's task
          </h2>
          <p className="mt-2 break-words font-display text-2xl text-ink">{todayTask.title}</p>
          {todayTask.link && (
            <a
              href={todayTask.link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-slate hover:text-champagne"
            >
              <span className="min-w-0 break-words">Open resource</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          )}
          <div className="mt-4">
            <GoalTimer
              goal={goal}
              task={todayTask}
              autoStart={searchParams.get('focus') === 'start'}
              onFinish={(minutes) => completeTask(todayTask.id, minutes)}
            />
          </div>
        </Card>
      )}

      {shift > 14 && !accepted && (
        <HealthWarning
          goalId={goal.id}
          shift={shift}
          pendingTasks={projection}
          onTrim={(count) => trimLast(goal.id, count)}
          onAccept={() => {
            setAccepted(true);
            notify('Finish date accepted. The queue keeps moving one day at a time.', 'info');
          }}
        />
      )}

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="grid min-w-0 content-start gap-6 lg:col-span-2">
          <Card>
            <h2 className="font-display text-xl text-ink">Next 7 tasks</h2>
            <p className="mt-1 mb-4 text-sm text-slate">
              When each task was planned, and when it now happens.
            </p>
            <SmartCalendar projection={projection} today={today} />
          </Card>

          <Card>
            <h2 className="font-display text-xl text-ink">Roadmap</h2>
            <p className="mt-1 mb-4 text-sm text-slate">
              One task per day. Tasks complete when their timer finishes; reordering changes what
              comes next, not the daily load.
            </p>
            {tasks.length ? (
              <RoadmapList goalId={goal.id} tasks={tasks} />
            ) : (
              <p className="text-sm text-slate">No tasks yet. Add the first one below.</p>
            )}
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <h2 className="font-display text-xl text-ink">Shift over time</h2>
            <p className="mt-1 mb-4 text-sm text-slate">How far the queue had slipped, day by day.</p>
            <ShiftGraph history={shiftHistoryByGoal[goal.id] ?? []} />
          </Card>

          <Card>
            <h2 className="font-display text-xl text-ink">Completed days</h2>
            <p className="mt-1 mb-4 text-sm text-slate">
              One square per day, from completed tasks.
            </p>
            <HeatMap counts={heatmapByGoal[goal.id] ?? new Map()} today={today} />
          </Card>
        </div>
      </div>

      <ShiftNotice projection={projection} />
    </div>
  );
}

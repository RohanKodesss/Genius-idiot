import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDay } from '../lib/dates';
import { Badge, Button, Card, EmptyState } from '../components/ui';
import StreakPanel from '../components/StreakPanel';
import ShiftNotice from '../components/ShiftNotice';
import SmartCalendar from '../components/SmartCalendar';
import ShiftGraph from '../components/ShiftGraph';
import HeatMap from '../components/HeatMap';
import RoadmapList from '../components/RoadmapList';
import HealthWarning from '../components/HealthWarning';

export default function GoalDashboard() {
  const { goalId } = useParams();
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

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Today
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-ink">{goal.name}</h1>
            <p className="mt-1 text-sm text-slate tabular-nums">
              {goal.daily_minutes} min/day · {progress.done} / {progress.total} tasks · est. finish{' '}
              {format(fromDay(progress.eta), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {shift > 0 && <Badge tone="terracotta">+{shift} days behind</Badge>}
            <Button
              variant="secondary"
              onClick={() => (restToday ? unmarkRestDay(goal.id, today) : markRestDay(goal.id, today))}
              aria-pressed={restToday}
            >
              <Moon className="w-4 h-4" aria-hidden="true" />
              {restToday ? 'Rest day today' : 'Mark rest day'}
            </Button>
          </div>
        </div>
      </div>

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

      <StreakPanel streak={streak} />

      <ShiftNotice projection={projection} />

      <Card>
        <h2 className="font-display text-xl text-ink">Next 7 tasks</h2>
        <p className="mt-1 mb-4 text-sm text-slate">Planned date versus what actually happens.</p>
        <SmartCalendar projection={projection} today={today} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-xl text-ink">Shift over time</h2>
          <p className="mt-1 mb-4 text-sm text-slate">
            How far the queue had slipped, day by day.
          </p>
          <ShiftGraph history={shiftHistoryByGoal[goal.id] ?? []} />
        </Card>

        <Card>
          <h2 className="font-display text-xl text-ink">Completed days</h2>
          <p className="mt-1 mb-4 text-sm text-slate">One square per day, from completed tasks.</p>
          <HeatMap counts={heatmapByGoal[goal.id] ?? new Map()} today={today} />
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-xl text-ink">Roadmap</h2>
        <p className="mt-1 mb-4 text-sm text-slate">
          One task per day. Reordering changes what comes next, not the daily load.
        </p>
        {tasks.length ? (
          <RoadmapList goalId={goal.id} tasks={tasks} />
        ) : (
          <p className="text-sm text-slate">No tasks yet. Add the first one below.</p>
        )}
      </Card>
    </div>
  );
}

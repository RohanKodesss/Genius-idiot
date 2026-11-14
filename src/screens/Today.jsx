import { format } from 'date-fns';
import { CheckCircle2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fromDay, dayOf } from '../lib/dates';
import { Badge, Button, Card, EmptyState, Skeleton } from '../components/ui';
import GoalCard from '../components/GoalCard';
import ProgressRing from '../components/ProgressRing';
import StreakBadge from '../components/StreakBadge';

export default function Today() {
  const {
    loading,
    today,
    goals,
    totals,
    overallStreak,
    tasksByGoal,
    restDaysByGoal,
    projectionByGoal,
    streaksByGoal,
    progressByGoal,
  } = useApp();

  const doneToday = (goalId) =>
    (tasksByGoal[goalId] ?? []).find((task) => dayOf(task.completed_at) === today) ?? null;

  const allDone = goals.length > 0 && totals.goalsTotal > 0 && totals.goalsDone === totals.goalsTotal;

  if (loading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-36" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-slate">
            {format(fromDay(today), 'EEEE, MMMM d')}
          </p>
          <h1 className="font-display text-3xl text-ink mt-1">Today</h1>
        </div>
        <StreakBadge days={overallStreak.current} label="day streak" />
      </header>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-[13px] font-medium text-slate">Today's load</p>
          <p className="mt-1 font-sans text-2xl font-semibold tabular-nums text-ink">
            {totals.minutesDone} <span className="text-slate text-base font-normal">/ {totals.minutesTotal} min</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={allDone ? 'sage' : 'neutral'}>
              {totals.goalsTotal
                ? `${totals.goalsDone} / ${totals.goalsTotal} goals`
                : 'Rest day'}
            </Badge>
            {overallStreak.longest > 0 && (
              <Badge tone="neutral">best {overallStreak.longest}d</Badge>
            )}
          </div>
        </div>
        <ProgressRing value={totals.minutesDone} max={totals.minutesTotal} label="Today's minutes" />
      </Card>

      {allDone && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-sage/30 bg-sage/5 px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-sage" aria-hidden="true" />
          <p className="text-sm text-ink">
            Everything for today is done. Rest is part of the plan.
          </p>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          headline="No goals yet"
          helper="Create a goal and import its roadmap to see today's task."
          action={
            <Link to="/setup">
              <Button>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Set up a goal
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              projection={projectionByGoal[goal.id] ?? []}
              streak={streaksByGoal[goal.id] ?? { current: 0, longest: 0 }}
              progress={progressByGoal[goal.id] ?? { done: 0, total: 0, pct: 0, eta: today }}
              restToday={(restDaysByGoal[goal.id] ?? []).some((restDay) => restDay.date === today)}
              doneToday={doneToday(goal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

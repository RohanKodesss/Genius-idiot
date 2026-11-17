import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Check, CheckCircle2, Circle, Flame, Target } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { Button } from '../components/ui';
import { dayOf, fromDay, formatDay, todayOf } from '../lib/dates';
import { computeProgress } from '../lib/progress';
import { computeStreak } from '../lib/streaks';
import { getPublicGoalByPublicId } from '../lib/repository';

function StatePage({ title, body, action }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-5 py-12">
      <section className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">{body}</p>
        {action && <div className="mt-6">{action}</div>}
      </section>
    </main>
  );
}

export default function PublicRoadmap() {
  const { publicId } = useParams();
  const [request, setRequest] = useState({ status: 'loading', data: null });
  const [attempt, setAttempt] = useState(0);
  const today = todayOf(new Date());

  useEffect(() => {
    let current = true;
    setRequest({ status: 'loading', data: null });
    getPublicGoalByPublicId(publicId).then((result) => {
      if (!current) return;
      if (result.ok) setRequest({ status: 'ready', data: result.data });
      else if (result.status === 404) setRequest({ status: 'not-found', data: null });
      else setRequest({ status: 'error', data: null });
    }).catch(() => {
      if (current) setRequest({ status: 'error', data: null });
    });
    return () => { current = false; };
  }, [publicId, attempt]);

  useEffect(() => {
    if (request.status === 'ready') {
      document.title = `${request.data.goal.name} · Public roadmap | Genius Idiot`;
    }
  }, [request]);

  if (request.status === 'loading') {
    return <StatePage title="Loading roadmap" body="Getting the latest public progress…" />;
  }
  if (request.status === 'not-found') {
    return <StatePage title="Roadmap not found" body="This public link may be incorrect or sharing may have been turned off." action={<Link to="/"><Button>Start your own roadmap</Button></Link>} />;
  }
  if (request.status === 'error') {
    return <StatePage title="Roadmap unavailable" body="We couldn't load this roadmap right now." action={<Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Try again</Button>} />;
  }

  const { goal, tasks } = request.data;
  const orderedTasks = [...tasks].sort((a, b) => a.order - b.order);
  const progress = computeProgress(orderedTasks, today);
  const streak = computeStreak(orderedTasks, [], today);
  const completed = progress.done === progress.total && progress.total > 0;

  return (
    <main className="min-h-dvh bg-ivory px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center gap-3 border-b border-sand pb-5">
          <BrandLogo className="h-9 w-9 rounded-lg bg-white" />
          <span className="font-display text-lg text-ink">Genius Idiot</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-sand bg-parchment px-3 py-1 text-xs text-slate">
            <CheckCircle2 className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
            Public roadmap
          </span>
        </header>

        <section className="py-8 sm:py-12">
          <h1 className="max-w-2xl break-words font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
            {goal.name}
          </h1>
          <p className="mt-3 text-sm text-slate">A learning roadmap, shared in public.</p>
        </section>

        <section aria-label="Roadmap progress" className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-sand bg-parchment p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate">
              <Target className="h-4 w-4 text-champagne" aria-hidden="true" />
              Progress
            </div>
            <p className="mt-3 font-display text-3xl text-ink">{progress.pct}%</p>
            <p className="mt-1 text-xs text-mist">{progress.done} of {progress.total} tasks complete</p>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand"
              role="progressbar"
              aria-label="Roadmap progress"
              aria-valuenow={progress.pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-sage transition-[width] duration-300" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-sand bg-parchment p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate">
              <Flame className="h-4 w-4 text-terracotta" aria-hidden="true" />
              Current streak
            </div>
            <p className="mt-3 font-display text-3xl text-ink">{streak.current} <span className="font-sans text-base text-slate">days</span></p>
            <p className="mt-1 text-xs text-mist">From completed tasks</p>
          </div>
          <div className="rounded-2xl border border-sand bg-parchment p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate">
              <CheckCircle2 className="h-4 w-4 text-sage" aria-hidden="true" />
              Projected finish
            </div>
            <p className="mt-3 break-words font-display text-2xl text-ink">
              {completed ? 'Complete' : format(fromDay(progress.eta), 'MMM d, yyyy')}
            </p>
            <p className="mt-1 text-xs text-mist">Based on remaining tasks</p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-sand bg-parchment">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-sand px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-2xl text-ink">The roadmap</h2>
              <p className="mt-1 text-sm text-slate">One task at a time.</p>
            </div>
            <span className="text-xs tabular-nums text-mist">{progress.done}/{progress.total}</span>
          </div>
          <ol className="divide-y divide-sand">
            {orderedTasks.map((task) => {
              const done = Boolean(task.completed_at);
              const completedDay = dayOf(task.completed_at);
              return (
                <li key={`${task.order}-${task.title}`} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? 'bg-sage text-white' : 'border border-sand text-mist'}`} aria-hidden="true">
                    {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`break-words text-sm font-medium ${done ? 'text-slate' : 'text-ink'}`}>{task.title}</p>
                    {done && completedDay && <p className="mt-1 text-xs text-mist">Completed {formatDay(completedDay)}</p>}
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs tabular-nums text-mist">{String(task.order).padStart(2, '0')}</span>
                </li>
              );
            })}
            {orderedTasks.length === 0 && <li className="px-5 py-8 text-sm text-slate sm:px-6">This roadmap has no tasks yet.</li>}
          </ol>
        </section>

        <section className="mt-8 rounded-2xl bg-obsidian px-5 py-7 text-linen sm:px-8 sm:py-9">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl leading-tight sm:text-3xl">Want to track your own goals without the overdue anxiety?</h2>
            <p className="mt-3 text-sm leading-relaxed text-linen/70">Build a steady queue, make progress visible, and take breaks without guilt.</p>
            <Link to="/" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-champagne px-5 py-2.5 text-sm font-semibold text-parchment transition hover:bg-champagne-light">
              Create your free tracker <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-mist">Shared with Genius Idiot</footer>
      </div>
    </main>
  );
}

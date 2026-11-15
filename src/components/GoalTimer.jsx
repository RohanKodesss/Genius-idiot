// Goal timer: countdown to the goal's daily minutes. The task is completed only
// when the clock reaches zero. State survives reloads via localStorage.
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { elapsedMs, formatClock, minutesFrom } from '../lib/timer';

const storageKey = (goalId) => `gi:timer:${goalId}`;

function load(goalId, taskId) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(goalId)));
    return saved && saved.taskId === taskId ? saved : null;
  } catch {
    return null;
  }
}

function save(goalId, state) {
  try {
    localStorage.setItem(storageKey(goalId), JSON.stringify(state));
  } catch {
    /* storage full or disabled: the timer still works for this session */
  }
}

function drop(goalId) {
  try {
    localStorage.removeItem(storageKey(goalId));
  } catch {
    /* ignore */
  }
}

export default function GoalTimer({ goal, task, onFinish }) {
  const targetMs = goal.daily_minutes * 60_000;
  const [state, setState] = useState(() => load(goal.id, task.id));
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);

  // A different task means a different session.
  useEffect(() => {
    setState(load(goal.id, task.id));
    finishedRef.current = false;
  }, [goal.id, task.id]);

  useEffect(() => {
    if (!state?.running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.running]);

  const elapsed = state ? elapsedMs(state, now) : 0;
  const remaining = Math.max(0, targetMs - elapsed);
  const pct = targetMs ? Math.min(elapsed / targetMs, 1) : 0;

  // shortcut: wall-clock elapsed, so time away from the tab counts toward the
  // goal. Upgrade to pause-on-unload if that ever matters.
  useEffect(() => {
    if (!state?.running || finishedRef.current || elapsed < targetMs) return;
    finishedRef.current = true;
    drop(goal.id);
    setState(null);
    onFinish(goal.daily_minutes);
  }, [elapsed, targetMs, state, goal.id, goal.daily_minutes, onFinish]);

  const begin = (carryMs = 0) => {
    const next = {
      taskId: task.id,
      elapsedMs: carryMs,
      running: true,
      updatedAt: Date.now(),
    };
    save(goal.id, next);
    setNow(Date.now());
    setState(next);
  };

  const pause = () => {
    const next = { ...state, elapsedMs: elapsed, running: false, updatedAt: Date.now() };
    save(goal.id, next);
    setState(next);
  };

  const reset = () => {
    drop(goal.id);
    finishedRef.current = false;
    setState(null);
  };

  if (!state) {
    return (
      <button
        type="button"
        onClick={() => begin(0)}
        className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-3 sm:py-2.5 font-medium text-parchment hover:bg-champagne-light active:scale-[0.98] transition"
      >
        <Play className="w-4 h-4" aria-hidden="true" />
        Start · {goal.daily_minutes} min
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-sand bg-ivory p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span
          role="timer"
          aria-label={`${Math.ceil(remaining / 60_000)} minutes left`}
          className="font-mono text-2xl font-semibold tabular-nums text-ink"
        >
          {formatClock(remaining)}
        </span>
        <span className="text-xs text-mist tabular-nums">
          {Math.floor(elapsed / 60_000)} / {goal.daily_minutes} min
        </span>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-champagne transition-all" style={{ width: `${pct * 100}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state.running ? (
          <button
            type="button"
            onClick={pause}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sand px-3 py-2.5 text-sm text-ink hover:border-ink sm:py-1.5"
          >
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={() => begin(elapsed)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-champagne px-3 py-2.5 text-sm font-medium text-parchment hover:bg-champagne-light sm:py-1.5"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            Resume
          </button>
        )}

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-1 py-2 text-xs text-slate hover:text-ink underline underline-offset-4"
        >
          <RotateCcw className="w-3 h-3" aria-hidden="true" />
          Reset
        </button>

        {elapsed > 0 && (
          <button
            type="button"
            onClick={() => {
              const minutes = minutesFrom(elapsed);
              drop(goal.id);
              setState(null);
              onFinish(minutes);
            }}
            className="ml-auto py-2 text-xs text-slate hover:text-ink underline underline-offset-4"
          >
            Finish early
          </button>
        )}
      </div>
    </div>
  );
}

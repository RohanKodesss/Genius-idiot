// P1 unit tests for derived progress and today's totals.
import { describe, expect, it } from 'vitest';
import { computeProgress, computeTodayTotals } from '../lib/progress';

const today = '2026-11-13';

describe('computeProgress', () => {
  it('counts done, total, pct and the finish date', () => {
    const tasks = [
      { completed_at: '2026-11-01T10:00:00' },
      { completed_at: null },
      { completed_at: null },
    ];
    expect(computeProgress(tasks, today)).toEqual({
      done: 1,
      total: 3,
      pct: 33,
      eta: '2026-11-15',
    });
    expect(computeProgress([], today)).toMatchObject({ done: 0, total: 0, pct: 0, eta: today });
  });

  it('skips rest days when estimating the finish date', () => {
    const tasks = [{ completed_at: null }, { completed_at: null }];
    expect(computeProgress(tasks, today, ['2026-11-14']).eta).toBe('2026-11-16');
  });
});

describe('computeTodayTotals', () => {
  it('counts completed goals; a rest day pauses a goal instead of marking it done', () => {
    const goals = [
      { id: 'a', daily_minutes: 60 },
      { id: 'b', daily_minutes: 40 },
      { id: 'c', daily_minutes: 30 },
    ];
    const tasks = [{ goal_id: 'a', completed_at: `${today}T09:00:00` }];
    const restDays = [{ goal_id: 'b', date: today }];
    expect(computeTodayTotals(goals, tasks, restDays, today)).toEqual({
      minutesDone: 60,
      minutesTotal: 90,
      goalsDone: 1,
      goalsTotal: 2,
    });
  });
});

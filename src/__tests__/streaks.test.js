// P0 unit tests for streaks (TESTING §2.3). `today` is a local day string.
import { describe, expect, it } from 'vitest';
import { computeOverallStreak, computeStreak } from '../lib/streaks';

const today = '2026-11-13';
const done = (day) => ({ completed_at: `${day}T20:00:00` });

describe('computeStreak', () => {
  it('P0: counts consecutive days of completions ending today', () => {
    const tasks = [done('2026-11-11'), done('2026-11-12'), done('2026-11-13')];
    expect(computeStreak(tasks, [], today).current).toBe(3);
  });

  it('P0: a missed day breaks the streak', () => {
    const tasks = [done('2026-11-10'), done('2026-11-11'), done('2026-11-13')];
    expect(computeStreak(tasks, [], today).current).toBe(1);
  });

  it('P0: a rest day does NOT break the streak', () => {
    const tasks = [done('2026-11-11'), done('2026-11-12')];
    expect(computeStreak(tasks, ['2026-11-13'], today).current).toBe(3);
    expect(computeStreak(tasks, [{ date: '2026-11-13' }], today).current).toBe(3);
  });

  it('P0: today not being done yet does not show a zero streak', () => {
    const tasks = [done('2026-11-11'), done('2026-11-12')];
    expect(computeStreak(tasks, [], today).current).toBe(2);
  });

  it('P1: longest streak survives the current streak breaking', () => {
    const days = [
      '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05',
      '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13',
    ];
    const result = computeStreak(days.map(done), [], today);
    expect(result.current).toBe(4);
    expect(result.longest).toBe(5);
  });

  it('P1: two tasks on one day count once', () => {
    const tasks = [done('2026-11-13'), done('2026-11-13')];
    expect(computeStreak(tasks, [], today).current).toBe(1);
  });
});

describe('computeOverallStreak', () => {
  const goals = [{ id: 'a' }, { id: 'b' }];

  it('P0: overall needs every goal completed or rested', () => {
    const tasks = [
      { goal_id: 'a', ...done('2026-11-12') },
      { goal_id: 'a', ...done('2026-11-13') },
      { goal_id: 'b', ...done('2026-11-12') },
    ];
    // b is only rested on 11-13
    const restDays = [{ goal_id: 'b', date: '2026-11-13' }];
    expect(computeOverallStreak(goals, tasks, restDays, today).current).toBe(2);
  });

  it('P1: a goal that never started breaks the overall streak', () => {
    const tasks = [{ goal_id: 'a', ...done('2026-11-13') }];
    expect(computeOverallStreak(goals, tasks, [], today).current).toBe(0);
  });
});

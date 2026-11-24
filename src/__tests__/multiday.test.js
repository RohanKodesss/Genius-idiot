// P0 unit tests for multi-day task maths.
import { describe, expect, it } from 'vitest';
import {
  durationInDays,
  progressPatch,
  remainingMinutes,
  sessionMinutes,
} from '../lib/multiday';

const longTask = (overrides = {}) => ({
  total_est_minutes: 900,
  minutes_completed: 0,
  minutes_spent: null,
  ...overrides,
});

describe('durationInDays', () => {
  it('P0: a normal task is one day', () => {
    expect(durationInDays({ total_est_minutes: null }, 60)).toBe(1);
  });

  it('P0: splits the remaining estimate at the daily pace', () => {
    expect(durationInDays(longTask(), 60)).toBe(15);
    expect(durationInDays(longTask({ minutes_completed: 300 }), 60)).toBe(10);
    expect(durationInDays(longTask({ minutes_completed: 900 }), 60)).toBe(1);
  });

  it('P1: rounds a partial day up and tolerates a missing goal pace', () => {
    expect(durationInDays(longTask({ total_est_minutes: 70 }), 60)).toBe(2);
    expect(durationInDays(longTask(), null)).toBe(1);
  });
});

describe('sessionMinutes', () => {
  it('P1: never runs past the task remaining minutes', () => {
    expect(sessionMinutes(longTask(), 60)).toBe(60);
    expect(sessionMinutes(longTask({ minutes_completed: 870 }), 60)).toBe(30);
    expect(sessionMinutes({ total_est_minutes: null }, 60)).toBe(60);
    expect(remainingMinutes(longTask())).toBe(900);
  });
});

describe('progressPatch', () => {
  const at = '2026-11-24T10:00:00.000Z';

  it('P0: keeps a multi-day task pending until the total is reached', () => {
    expect(progressPatch(longTask(), 60, at)).toEqual({
      minutes_completed: 60,
      minutes_spent: 60,
    });
    expect(progressPatch(longTask({ minutes_completed: 60 }), 60, at)).toEqual({
      minutes_completed: 120,
      minutes_spent: 60,
    });
  });

  it('P0: completes the task when the total is reached or passed', () => {
    expect(progressPatch(longTask({ minutes_completed: 870 }), 60, at)).toEqual({
      minutes_completed: 900,
      minutes_spent: 60,
      completed_at: at,
    });
  });

  it('P1: a normal task still completes in one session', () => {
    expect(progressPatch({ total_est_minutes: null, minutes_spent: null }, 45, at)).toEqual({
      completed_at: at,
      minutes_spent: 45,
    });
  });
});

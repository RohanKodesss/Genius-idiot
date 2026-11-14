// Unit tests for the timer maths.
import { describe, expect, it } from 'vitest';
import { elapsedMs, formatClock, isFinished, minutesFrom } from '../lib/timer';

describe('formatClock', () => {
  it('formats mm:ss and clamps negatives', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(1_000)).toBe('00:01');
    expect(formatClock(59_000)).toBe('00:59');
    expect(formatClock(60_000)).toBe('01:00');
    expect(formatClock(3_600_000)).toBe('60:00');
    expect(formatClock(-5_000)).toBe('00:00');
  });
});

describe('elapsedMs', () => {
  it('adds wall-clock time only while running', () => {
    const running = { elapsedMs: 10_000, running: true, updatedAt: 1_000 };
    expect(elapsedMs(running, 6_000)).toBe(15_000);

    const paused = { elapsedMs: 10_000, running: false, updatedAt: 1_000 };
    expect(elapsedMs(paused, 60_000)).toBe(10_000);
  });

  it('treats a clock that went backwards as no progress', () => {
    const running = { elapsedMs: 10_000, running: true, updatedAt: 5_000 };
    expect(elapsedMs(running, 1_000)).toBe(10_000);
  });
});

describe('isFinished', () => {
  it('finishes at the target, not before', () => {
    const target = 60 * 60_000;
    expect(isFinished({ elapsedMs: 3_599_000, running: false, updatedAt: 0 }, 0, target)).toBe(false);
    expect(isFinished({ elapsedMs: 3_600_000, running: false, updatedAt: 0 }, 0, target)).toBe(true);
  });
});

describe('minutesFrom', () => {
  it('logs at least one minute', () => {
    expect(minutesFrom(20_000)).toBe(1);
    expect(minutesFrom(35 * 60_000)).toBe(35);
  });
});

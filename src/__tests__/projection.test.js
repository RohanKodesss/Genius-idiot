// P0 unit tests for the product's engine (TESTING §2.2).
// `today` is a local 'YYYY-MM-DD' string, per the pre-build decision.
import { describe, expect, it } from 'vitest';
import { computeProjection, computeShiftHistory, maxShift, nextStartDay } from '../lib/projection';

const today = '2026-11-13';

describe('computeProjection', () => {
  it('P0: projects the first pending task to today', () => {
    const tasks = [
      { order: 1, completed_at: null, planned_date: '2026-11-01' },
      { order: 2, completed_at: null, planned_date: '2026-11-02' },
    ];
    const result = computeProjection(tasks, today);
    expect(result[0].projected).toBe('2026-11-13');
    expect(result[0].shift).toBe(12);
  });

  it('P0: skips completed tasks and projects the next pending to today', () => {
    const tasks = [
      { order: 1, completed_at: '2026-11-01T10:00:00', planned_date: '2026-11-01' },
      { order: 2, completed_at: null, planned_date: '2026-11-02' },
    ];
    const result = computeProjection(tasks, today);
    expect(result).toHaveLength(1);
    expect(result[0].order).toBe(2);
    expect(result[0].projected).toBe('2026-11-13');
  });

  it('P0: shift = projected - planned for every pending task', () => {
    const tasks = [
      { order: 1, completed_at: '2026-11-01T10:00:00', planned_date: '2026-11-01' },
      { order: 2, completed_at: '2026-11-02T10:00:00', planned_date: '2026-11-02' },
      { order: 3, completed_at: null, planned_date: '2026-11-03' },
      { order: 4, completed_at: null, planned_date: '2026-11-04' },
    ];
    const result = computeProjection(tasks, today);
    expect(result[0].shift).toBe(10);
    expect(result[1].shift).toBe(10);
    expect(result[1].projected).toBe('2026-11-14');
  });

  it('P0: daily load never doubles — each pending task gets a unique day', () => {
    const tasks = [1, 2, 3].map((order) => ({
      order,
      completed_at: null,
      planned_date: `2026-11-0${order}`,
    }));
    const result = computeProjection(tasks, today);
    expect(new Set(result.map((task) => task.projected)).size).toBe(3);
  });

  it('P0: a rest day pauses the queue — today rest means the next task lands tomorrow', () => {
    const tasks = [
      { order: 1, completed_at: null, planned_date: '2026-11-13' },
      { order: 2, completed_at: null, planned_date: '2026-11-14' },
    ];
    const restDays = [{ date: today }, { date: '2026-11-15' }];
    const result = computeProjection(tasks, today, restDays);
    expect(result.map((task) => task.projected)).toEqual(['2026-11-14', '2026-11-16']);
    expect(result[0].shift).toBe(1);
  });

  it('P0: a missed day shifts only its own goal', () => {
    const dsa = [
      { order: 1, completed_at: '2026-11-12T20:00:00', planned_date: '2026-11-12' },
      { order: 2, completed_at: null, planned_date: '2026-11-13' },
    ];
    const web = [
      { order: 1, completed_at: null, planned_date: '2026-11-13' },
    ];
    expect(computeProjection(dsa, today)[0].shift).toBe(0);
    expect(computeProjection(web, today)[0].shift).toBe(0);
    // Move today forward one day without touching web: only dsa shifts.
    const tomorrow = '2026-11-14';
    expect(computeProjection(dsa, tomorrow)[0].shift).toBe(1);
    expect(computeProjection(web, tomorrow)[0].shift).toBe(1);
  });

  it('P1: empty and fully-complete queues project nothing', () => {
    expect(computeProjection([], today)).toEqual([]);
    expect(
      computeProjection(
        [{ order: 1, completed_at: '2026-11-01T10:00:00', planned_date: '2026-11-01' }],
        today,
      ),
    ).toEqual([]);
  });

  it('P1: maxShift reads the worst pending task', () => {
    const tasks = [
      { order: 1, completed_at: null, planned_date: '2026-11-10' },
      { order: 2, completed_at: null, planned_date: '2026-11-11' },
    ];
    expect(maxShift(tasks, today)).toBe(3);
    expect(maxShift([], today)).toBe(0);
  });
});

describe('computeShiftHistory', () => {
  it('P1: replays one point per day, ending today', () => {
    const tasks = [
      { order: 1, completed_at: '2026-11-11T20:00:00', planned_date: '2026-11-11' },
      { order: 2, completed_at: null, planned_date: '2026-11-12' },
    ];
    const history = computeShiftHistory(tasks, today, [], 3);
    expect(history.map((point) => point.date)).toEqual(['2026-11-11', '2026-11-12', '2026-11-13']);
    // 11-11: task 2 was still upcoming, planned 11-12 → 0
    expect(history[0].shift).toBe(0);
    expect(history[1].shift).toBe(0);
    expect(history[2].shift).toBe(1);
  });

  it('P1: a missed day raises the final shift point', () => {
    const tasks = [{ order: 1, completed_at: null, planned_date: '2026-11-12' }];
    const history = computeShiftHistory(tasks, today, [], 2);
    expect(history.map((point) => point.shift)).toEqual([0, 1]);
  });

  it('P1: rest days raise the shift exactly like the projection', () => {
    const tasks = [{ order: 1, completed_at: null, planned_date: today }];
    const restDays = [{ date: today }, { date: '2026-11-14' }];
    const history = computeShiftHistory(tasks, today, restDays, 1);
    expect(history[0].shift).toBe(computeProjection(tasks, today, restDays)[0].shift);
    expect(history[0].shift).toBe(2);
  });
});

describe('multi-day tasks', () => {
  const longTask = {
    order: 1,
    completed_at: null,
    planned_date: today,
    total_est_minutes: 900,
    minutes_completed: 0,
  };
  const nextTask = { order: 2, completed_at: null, planned_date: '2026-11-28' };

  it('P0: a long task holds its remaining slots and the next task starts after it', () => {
    const result = computeProjection([longTask, nextTask], today, [], 60);
    expect(result[0]).toMatchObject({ projected: today, duration_in_days: 15 });
    expect(result[1].projected).toBe('2026-11-28');
  });

  it('P0: completed minutes shorten the remaining duration', () => {
    const result = computeProjection(
      [{ ...longTask, minutes_completed: 300 }, nextTask],
      today,
      [],
      60,
    );
    expect(result[0].duration_in_days).toBe(10);
    expect(result[1].projected).toBe('2026-11-23');
  });

  it('P0: a missed day shifts the long task and the rest of the queue by one day', () => {
    const tomorrow = '2026-11-14';
    const result = computeProjection([longTask, nextTask], tomorrow, [], 60);
    expect(result[0].shift).toBe(1);
    expect(result[1].shift).toBe(1);
  });

  it('P1: rest days pause a multi-day task instead of consuming a slot', () => {
    const restDays = [{ date: '2026-11-14' }];
    const result = computeProjection([longTask, nextTask], today, restDays, 60);
    expect(result[0].duration_in_days).toBe(15);
    expect(result[1].projected).toBe('2026-11-29');
  });

  it('P1: nextStartDay seeds a new task after the whole existing queue', () => {
    expect(nextStartDay([longTask], today, [], 60)).toBe('2026-11-28');
    expect(nextStartDay([longTask], today, [{ date: '2026-11-14' }], 60)).toBe('2026-11-29');
    expect(nextStartDay([longTask], today, [{ date: '2026-11-28' }], 60)).toBe('2026-11-29');
  });

  it('P0: a long-form task waits for a future start date', () => {
    const future = { ...longTask, planned_date: '2026-12-05' };
    const result = computeProjection(
      [future, { ...nextTask, planned_date: '2026-12-20' }],
      today,
      [],
      60,
    );
    expect(result[0].projected).toBe('2026-12-05');
    expect(result[0].shift).toBe(0);
    expect(result[1].projected).toBe('2026-12-20');
    expect(nextStartDay([future], today, [], 60)).toBe('2026-12-20');
  });
});

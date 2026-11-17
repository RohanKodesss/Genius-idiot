import { describe, expect, it } from 'vitest';
import { buildHibernationRestDays } from '../lib/hibernation';
import { computeProjection } from '../lib/projection';

const today = '2026-11-17';
const makeRows = (overrides = {}) => buildHibernationRestDays({
  goals: [{ id: 'a' }, { id: 'b' }],
  restDays: [],
  today,
  days: 3,
  createId: (() => { let id = 0; return () => `r${++id}`; })(),
  createdAt: '2026-11-17T12:00:00.000Z',
  ...overrides,
});

describe('buildHibernationRestDays', () => {
  it('pauses all goals for the requested consecutive days', () => {
    const rows = makeRows();
    expect(rows).toHaveLength(6);
    expect(rows.filter((row) => row.goal_id === 'a').map((row) => row.date)).toEqual([
      '2026-11-17', '2026-11-18', '2026-11-19',
    ]);
    const queue = [{ id: 't1', order: 1, planned_date: today }];
    expect(computeProjection(queue, today, rows)[0].projected).toBe('2026-11-20');
  });

  it('keeps existing rest days and does not create duplicates', () => {
    const rows = makeRows({ restDays: [{ goal_id: 'a', date: today }] });
    expect(rows).toHaveLength(5);
    expect(rows.some((row) => row.goal_id === 'a' && row.date === today)).toBe(false);
  });

  it.each([0, -1, 1.5, 91])('rejects invalid durations (%s)', (days) => {
    expect(() => makeRows({ days })).toThrow(RangeError);
  });
});

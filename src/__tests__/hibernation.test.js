import { describe, expect, it } from 'vitest';
import { buildHibernationRestDays, listActiveHibernations } from '../lib/hibernation';
import { computeProjection } from '../lib/projection';

const today = '2026-11-17';
const makeRows = (overrides = {}) => buildHibernationRestDays({
  goals: [{ id: 'a' }, { id: 'b' }],
  restDays: [],
  today,
  days: 3,
  createId: (() => { let id = 0; return () => `r${++id}`; })(),
  createdAt: '2026-11-17T12:00:00.000Z',
  hibernationId: 'session-a',
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

  it('lists active sessions by goal and resume date, ignoring manual and past rest days', () => {
    const sessions = listActiveHibernations([
      { goal_id: 'a', date: '2026-11-16', hibernation_id: 'past' },
      { goal_id: 'a', date: '2026-11-17', hibernation_id: 'session-a' },
      { goal_id: 'b', date: '2026-11-19', hibernation_id: 'session-a' },
      { goal_id: 'b', date: '2026-11-20', hibernation_id: null },
    ], [{ id: 'a', name: 'DSA' }, { id: 'b', name: 'Writing' }], today);
    expect(sessions).toEqual([{
      id: 'session-a', goalIds: ['a', 'b'], resumeAfter: '2026-11-19', names: ['DSA', 'Writing'],
    }]);
  });

  it.each([0, -1, 1.5, 91])('rejects invalid durations (%s)', (days) => {
    expect(() => makeRows({ days })).toThrow(RangeError);
  });
});

// Unit tests for the card builder's date sequencing and validation.
import { describe, expect, it } from 'vitest';
import { buildTaskRows } from '../lib/roadmap';

const card = (title, extra = {}) => ({ title, link: '', est_minutes: '', ...extra });

describe('buildTaskRows', () => {
  it('P0: one card per day, starting at the chosen start date', () => {
    const { tasks, errors } = buildTaskRows(
      [card('Arrays'), card('Two pointers'), card('Sliding window')],
      '2026-11-14',
    );
    expect(errors).toHaveLength(0);
    expect(tasks.map((task) => task.planned_date)).toEqual([
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
    ]);
    expect(tasks[0]).toMatchObject({ title: 'Arrays', link: null, est_minutes: null });
  });

  it('P1: blank cards are skipped and do not consume a day', () => {
    const { tasks } = buildTaskRows(
      [card('Arrays'), card('   '), card('Trees')],
      '2026-11-14',
    );
    expect(tasks.map((task) => task.planned_date)).toEqual(['2026-11-14', '2026-11-15']);
  });

  it('P1: keeps a valid link and minutes estimate', () => {
    const { tasks } = buildTaskRows(
      [card('Arrays', { link: 'https://example.com/a', est_minutes: '45' })],
      '2026-11-14',
    );
    expect(tasks[0]).toMatchObject({ link: 'https://example.com/a', est_minutes: 45 });
  });

  it('P1: rejects a non-http link and bad minutes', () => {
    const badLink = buildTaskRows([card('Arrays', { link: 'example.com' })], '2026-11-14');
    expect(badLink.tasks).toHaveLength(0);
    expect(badLink.errors[0].message).toMatch(/http/i);

    const badMinutes = buildTaskRows([card('Arrays', { est_minutes: '0' })], '2026-11-14');
    expect(badMinutes.errors[0].message).toMatch(/positive/i);
  });
});

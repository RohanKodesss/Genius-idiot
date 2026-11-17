import { beforeEach, describe, expect, it } from 'vitest';
import * as local from '../lib/localRepository';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('demo repository persistence for new features', () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
    local.resetDemoData();
  });

  it('saves and reloads a goal Why', async () => {
    const goal = {
      id: 'goal-why', user_id: 'demo', name: 'Study', daily_minutes: 45,
      why: 'Build a career I care about.', created_at: '2026-11-17T12:00:00.000Z',
    };
    expect((await local.createGoal(goal)).ok).toBe(true);
    expect((await local.fetchAll()).data.goals.find((row) => row.id === goal.id).why).toBe(goal.why);
  });

  it('saves a task note', async () => {
    const { data } = await local.fetchAll();
    const task = data.tasks[0];
    const note = 'Review the second example.';
    expect((await local.updateTask(task.id, { notes: note })).ok).toBe(true);
    const refreshed = await local.fetchAll();
    expect(refreshed.data.tasks.find((row) => row.id === task.id).notes).toBe(note);
  });

  it('pulls a task forward without changing its planned dates', async () => {
    const { data } = await local.fetchAll();
    const queue = data.tasks.filter((row) => row.goal_id === data.goals[0].id).sort((a, b) => a.order - b.order);
    const next = queue[1];
    const planned = next.planned_date;
    expect((await local.reorderTask(next.id, 1)).ok).toBe(true);
    const refreshed = await local.fetchAll();
    const reordered = refreshed.data.tasks.filter((row) => row.goal_id === data.goals[0].id).sort((a, b) => a.order - b.order);
    expect(reordered[0].id).toBe(next.id);
    expect(reordered[0].planned_date).toBe(planned);
  });

  it('persists hibernation rest days', async () => {
    const { data } = await local.fetchAll();
    await Promise.all(data.goals.map((goal) => local.markRestDay(goal.id, '2026-11-17')));
    const refreshed = await local.fetchAll();
    expect(refreshed.data.restDays.filter((row) => row.date === '2026-11-17')).toHaveLength(data.goals.length);
  });

  it('cancels only current and future rows owned by a hibernation', async () => {
    const goalId = 'hibernate-test';
    await local.markRestDay(goalId, '2026-11-17');
    await local.markRestDay(goalId, '2026-11-16', 'session-a');
    await local.markRestDay(goalId, '2026-11-18', 'session-a');
    expect((await local.cancelHibernation('session-a', '2026-11-17')).ok).toBe(true);
    const remaining = (await local.fetchAll()).data.restDays.filter((row) => row.goal_id === goalId);
    expect(remaining.sort((a, b) => a.date.localeCompare(b.date)).map((row) => [row.date, row.hibernation_id])).toEqual([
      ['2026-11-16', 'session-a'],
      ['2026-11-17', null],
    ]);
  });
});

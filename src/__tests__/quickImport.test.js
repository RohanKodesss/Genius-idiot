// Unit tests for the forgiving text importer (CSV/TSV, lists, checklists).
import { describe, expect, it } from 'vitest';
import { parseQuickImport } from '../lib/quickImport';

describe('parseQuickImport', () => {
  it('P0: CSV with a header row', () => {
    const { tasks, errors } = parseQuickImport(
      'title,link,minutes\nArrays basics,https://example.com/a,45\nTwo pointers,,',
    );
    expect(errors).toHaveLength(0);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toEqual({
      title: 'Arrays basics',
      link: 'https://example.com/a',
      est_minutes: 45,
    });
    expect(tasks[1]).toMatchObject({ title: 'Two pointers', link: null, est_minutes: null });
  });

  it('P0: TSV rows', () => {
    const { tasks } = parseQuickImport('Arrays\thttps://example.com/a\t45');
    expect(tasks[0]).toMatchObject({ title: 'Arrays', est_minutes: 45 });
  });

  it('P0: bullet lists, numbered lists and checklists', () => {
    const { tasks } = parseQuickImport(
      ['- Arrays basics', '1. Two pointers', '- [ ] Sliding window | 45', '* Recursion'].join('\n'),
    );
    expect(tasks.map((task) => task.title)).toEqual([
      'Arrays basics',
      'Two pointers',
      'Sliding window',
      'Recursion',
    ]);
    expect(tasks[2].est_minutes).toBe(45);
  });

  it('P1: a comma inside a title is not treated as a column split', () => {
    const { tasks, errors } = parseQuickImport('Two pointers, sliding window');
    expect(errors).toHaveLength(0);
    expect(tasks[0].title).toBe('Two pointers, sliding window');
  });

  it('P1: quoted CSV cells keep their commas', () => {
    const { tasks } = parseQuickImport('"Arrays, basics", https://example.com/a, 45');
    expect(tasks[0].title).toBe('Arrays, basics');
  });

  it('P1: reports the bad line number', () => {
    const { tasks, errors } = parseQuickImport('Good task\nBad link | example.com');
    expect(tasks).toHaveLength(1);
    expect(errors[0].line).toBe(2);
    expect(errors[0].message).toMatch(/http/i);
  });

  it('P2: empty input reports no tasks', () => {
    const { tasks, errors } = parseQuickImport('   \n\n');
    expect(tasks).toHaveLength(0);
    expect(errors[0].message).toMatch(/no tasks/i);
  });
});

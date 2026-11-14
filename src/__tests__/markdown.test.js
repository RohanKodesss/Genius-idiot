// P0 unit tests for the Markdown roadmap parser (TESTING §2.4).
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../lib/markdown';

describe('parseMarkdown', () => {
  it('P0: parses the happy-path format', () => {
    const md = `# DSA
- [ ] Arrays basics | https://example.com/arrays
- [ ] Two pointers
- [ ] Sliding window | 45`;
    const result = parseMarkdown(md);
    expect(result.goalName).toBe('DSA');
    expect(result.tasks).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
    expect(result.tasks[0]).toMatchObject({
      title: 'Arrays basics',
      link: 'https://example.com/arrays',
    });
    expect(result.tasks[2].est_minutes).toBe(45);
  });

  it('P1: reports malformed lines with line numbers', () => {
    const md = `# DSA
- [ ] Good task
Bad line here
- [ ] Another good one`;
    const result = parseMarkdown(md);
    expect(result.tasks).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(3);
  });

  it('P1: rejects a missing goal heading', () => {
    const result = parseMarkdown('- [ ] Task without heading');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('P1: rejects an empty task title', () => {
    const result = parseMarkdown('# DSA\n- [ ]');
    expect(result.errors[0].message).toMatch(/empty/i);
  });

  it('P2: empty input returns errors, no crash', () => {
    expect(() => parseMarkdown('')).not.toThrow();
    expect(parseMarkdown('').errors.length).toBeGreaterThan(0);
  });
});

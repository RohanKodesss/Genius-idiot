import { describe, expect, it } from 'vitest';
import { resolveTheme } from '../lib/theme';

describe('resolveTheme', () => {
  it('prefers a saved theme over the OS preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('falls back to the OS preference when nothing is saved', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
  });
});

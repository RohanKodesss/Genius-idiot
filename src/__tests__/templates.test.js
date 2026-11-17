import { describe, expect, it } from 'vitest';
import { roadmapTemplates } from '../lib/templates';

const addedTemplates = [
  'git-and-github',
  'figma-ui-ux',
  'html-css-responsive',
  'javascript-essentials',
  'react-foundations',
  'python-programming',
  'sql-database-basics',
  'data-analysis-pandas',
  'technical-writing',
  'ux-research-product-design',
];

describe('roadmap templates', () => {
  it('adds ten distinct roadmaps', () => {
    const ids = roadmapTemplates.map((template) => template.id);
    expect(roadmapTemplates).toHaveLength(14);
    expect(new Set(ids).size).toBe(ids.length);
    addedTemplates.forEach((id) => expect(ids).toContain(id));
  });

  it('keeps each previewable roadmap complete and ordered', () => {
    roadmapTemplates.forEach((template) => {
      expect(template.title.trim()).not.toBe('');
      expect(template.description.trim()).not.toBe('');
      expect(template.daily_minutes).toBeGreaterThan(0);
      expect(template.tasks.length).toBeGreaterThan(0);
      template.tasks.forEach((task) => {
        expect(task.title.trim()).not.toBe('');
        expect(task.est_minutes).toBeGreaterThan(0);
        expect(new URL(task.link).protocol).toBe('https:');
      });
    });
  });
});

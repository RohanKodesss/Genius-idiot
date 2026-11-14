// Strict Markdown roadmap format (PRD §9.8). Pure: string in, plain data out.
//
//   # Goal name
//   - [ ] Task title | https://example.com/link | 45
//
// Output: { goalName, tasks: [{title, link, est_minutes}], errors: [{line, message}] }
const TASK_PREFIX = '- [ ]';

export function parseMarkdown(text) {
  const errors = [];
  const tasks = [];
  let goalName = null;

  String(text ?? '')
    .split(/\r?\n/)
    .forEach((raw, index) => {
      const line = raw.trim();
      const lineNumber = index + 1;
      if (!line) return;

      if (line.startsWith('# ')) {
        if (!goalName) goalName = line.slice(2).trim();
        return;
      }

      if (!line.startsWith(TASK_PREFIX)) {
        errors.push({
          line: lineNumber,
          message: `Expected "${TASK_PREFIX}" at the start of the line.`,
        });
        return;
      }

      const body = line.slice(TASK_PREFIX.length).trim();
      if (!body) {
        errors.push({ line: lineNumber, message: 'Task title is empty.' });
        return;
      }

      const [title, ...meta] = body.split('|').map((part) => part.trim());
      let link = null;
      let estMinutes = null;

      meta.filter(Boolean).forEach((part) => {
        if (/^https?:\/\//i.test(part)) {
          link = part;
        } else if (/^\d+$/.test(part) && Number(part) > 0) {
          estMinutes = Number(part);
        } else {
          errors.push({
            line: lineNumber,
            message: `Unrecognised "${part}" — use a link (http…) or minutes.`,
          });
        }
      });

      tasks.push({ title, link, est_minutes: estMinutes });
    });

  if (!goalName) {
    errors.unshift({ line: 1, message: 'Missing "# Goal name" heading.' });
  }
  if (!tasks.length && !errors.length) {
    errors.push({ line: 1, message: 'No tasks found.' });
  }

  return { goalName, tasks, errors };
}

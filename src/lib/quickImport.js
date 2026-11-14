// Forgiving text import: CSV/TSV rows, bullet lists, or pasted checklists.
// Pure: string in, plain task rows out (no dates — the caller adds those).
import { validateTaskFields } from './roadmap';

const LIST_MARKER = /^(?:[-*+]\s*\[[ xX]?\]\s*|[-*+]\s+|\d+[.)]\s+)/;

function splitCells(line) {
  const delimiter = line.includes('\t') ? '\t' : ',';
  const cells = [];
  let cell = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(cell);
      cell = '';
      continue;
    }
    cell += char;
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

// "Arrays basics, https://x, 45" is a row; "Two pointers, sliding window" is a title.
function looksLikeRow(line) {
  if (line.includes('\t')) return true;
  if (!line.includes(',')) return false;
  const second = splitCells(line)[1] ?? '';
  return second === '' || /^https?:\/\//i.test(second) || /^\d+$/.test(second);
}

export function parseQuickImport(text) {
  const tasks = [];
  const errors = [];

  String(text ?? '')
    .split(/\r?\n/)
    .forEach((raw, index) => {
      const line = raw.trim();
      const lineNumber = index + 1;
      if (!line || line.startsWith('#') || line.startsWith('```')) return;
      // Spreadsheet header row.
      if (/^"?title"?\s*[,\t]/i.test(line)) return;

      const cells = looksLikeRow(line)
        ? splitCells(line)
        : line.replace(LIST_MARKER, '').split('|').map((part) => part.trim());

      // Fields after the title are recognised by shape, so "title | 45" works.
      const [title, ...extra] = cells;
      let link = '';
      let minutes = '';
      let unknown = '';
      extra.forEach((cell) => {
        if (!cell) return;
        if (/^https?:\/\//i.test(cell)) link = cell;
        else if (/^\d+$/.test(cell)) minutes = cell;
        else unknown = cell;
      });

      if (unknown) {
        errors.push({
          line: lineNumber,
          message: `Unrecognised "${unknown}" — use a link (http…) or minutes.`,
        });
        return;
      }

      const result = validateTaskFields({ title, link, est_minutes: minutes });
      if (result.error) {
        errors.push({ line: lineNumber, message: result.error });
        return;
      }
      tasks.push(result.task);
    });

  if (!tasks.length && !errors.length) {
    errors.push({ line: 1, message: 'No tasks found.' });
  }

  return { tasks, errors };
}

// Card-builder -> task rows. Pure: no Date.now(), `startDay` is a day string.
// One card = one day. Blank cards are ignored and do not consume a day.
import { addDay } from './dates';

const isUrl = (value) => /^https?:\/\//i.test(value);

// Shared by every importer: title required, link must be http(s), minutes > 0.
export function validateTaskFields({ title, link, est_minutes }) {
  const cleanTitle = String(title ?? '').trim();
  if (!cleanTitle) return { error: 'Task title is empty.' };

  const cleanLink = String(link ?? '').trim();
  if (cleanLink && !isUrl(cleanLink)) {
    return { error: 'Link must start with http:// or https://' };
  }

  const rawMinutes = est_minutes === '' || est_minutes == null ? null : Number(est_minutes);
  if (rawMinutes != null && (!Number.isInteger(rawMinutes) || rawMinutes <= 0)) {
    return { error: 'Minutes must be a positive whole number' };
  }

  return { task: { title: cleanTitle, link: cleanLink || null, est_minutes: rawMinutes } };
}

export function buildTaskRows(cards, startDay) {
  const tasks = [];
  const errors = [];

  cards.forEach((card, index) => {
    if (!String(card.title ?? '').trim()) return;
    const result = validateTaskFields(card);
    if (result.error) {
      errors.push({ index, message: result.error });
      return;
    }
    tasks.push({ ...result.task, planned_date: addDay(startDay, tasks.length) });
  });

  return { tasks, errors };
}

// Card-builder -> task rows. Pure: no Date.now(), `startDay` is a day string.
// One card = one day. Blank cards are ignored and do not consume a day.
import { addDay } from './dates';

const isUrl = (value) => /^https?:\/\//i.test(value);

export function buildTaskRows(cards, startDay) {
  const tasks = [];
  const errors = [];

  cards.forEach((card, index) => {
    const title = String(card.title ?? '').trim();
    if (!title) return;

    const link = String(card.link ?? '').trim();
    if (link && !isUrl(link)) {
      errors.push({ index, message: 'Link must start with http:// or https://' });
      return;
    }

    const rawMinutes = card.est_minutes;
    const minutes = rawMinutes === '' || rawMinutes == null ? null : Number(rawMinutes);
    if (minutes != null && (!Number.isInteger(minutes) || minutes <= 0)) {
      errors.push({ index, message: 'Minutes must be a positive whole number' });
      return;
    }

    tasks.push({
      title,
      link: link || null,
      est_minutes: minutes,
      planned_date: addDay(startDay, tasks.length),
    });
  });

  return { tasks, errors };
}

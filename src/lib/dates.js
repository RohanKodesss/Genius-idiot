// Calendar-day helpers. One rule: a "day" is a local 'YYYY-MM-DD' string.
// planned_date is a date, completed_at is a timestamptz — never swap them.
import { addDays, differenceInCalendarDays, format } from 'date-fns';

export const toDay = (date) => format(date, 'yyyy-MM-dd');
export const fromDay = (day) => new Date(`${day}T00:00:00`);
export const addDay = (day, n) => toDay(addDays(fromDay(day), n));
export const diffDay = (a, b) => differenceInCalendarDays(fromDay(a), fromDay(b));
export const todayOf = (now = new Date()) => toDay(now);

// completed_at (moment) -> the local calendar day it happened on.
export const dayOf = (iso) => (iso ? toDay(new Date(iso)) : null);

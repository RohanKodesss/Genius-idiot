// Popup calendar for a long-form task's start and end day.
import { useMemo, useState } from 'react';
import { addDays, addMonths, format, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { diffDay, formatDay, fromDay, toDay } from '../lib/dates';
import { Button } from './ui';
import Modal from './Modal';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function DateRangePicker({ start, end, onChange }) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [view, setView] = useState(() => startOfMonth(fromDay(start)));

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(view), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, index) => toDay(addDays(first, index)));
  }, [view]);

  const openPicker = () => {
    setDraftStart(start);
    setDraftEnd(end);
    setView(startOfMonth(fromDay(start)));
    setOpen(true);
  };

  const pick = (day) => {
    if (!draftStart || draftEnd) {
      setDraftStart(day);
      setDraftEnd(null);
      return;
    }
    if (diffDay(day, draftStart) < 0) {
      setDraftStart(day);
      setDraftEnd(draftStart);
      return;
    }
    setDraftEnd(day);
  };

  const confirm = () => {
    if (!draftStart || !draftEnd) return;
    onChange({ start: draftStart, end: draftEnd });
    setOpen(false);
  };

  const dayCount = start && end ? diffDay(end, start) + 1 : 0;
  const monthKey = toDay(view).slice(0, 7);

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border border-sand bg-ivory px-4 py-2.5 text-left text-sm text-ink transition hover:border-ink"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
          <span className="truncate">
            {start && end
              ? `${formatDay(start)} → ${formatDay(end)}`
              : 'Choose the task dates'}
          </span>
        </span>
        {dayCount > 0 && (
          <span className="shrink-0 text-xs tabular-nums text-mist">
            {dayCount} day{dayCount === 1 ? '' : 's'}
          </span>
        )}
      </button>

      {open && (
        <Modal
          title="Choose task dates"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirm} disabled={!draftStart || !draftEnd}>
                Use these dates
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate">
            Pick the first day, then the last day. Same day twice means a one-day task.
          </p>

          <div className="mt-4 rounded-xl border border-sand bg-ivory p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setView(addMonths(view, -1))}
                aria-label="Previous month"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate hover:bg-parchment hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="text-sm font-medium text-ink">{format(fromDay(toDay(view)), 'MMMM yyyy')}</p>
              <button
                type="button"
                onClick={() => setView(addMonths(view, 1))}
                aria-label="Next month"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate hover:bg-parchment hover:text-ink"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-mist">
              {WEEKDAYS.map((label) => (
                <span key={label} className="py-1">{label}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const isStart = day === draftStart;
                const isEnd = day === draftEnd;
                const inRange = Boolean(
                  draftStart && draftEnd && day > draftStart && day < draftEnd,
                );
                const outside = day.slice(0, 7) !== monthKey;
                const tone = isStart || isEnd
                  ? 'bg-champagne text-parchment'
                  : inRange
                    ? 'bg-champagne/15 text-ink'
                    : outside
                      ? 'text-mist/50 hover:bg-parchment'
                      : 'text-ink hover:bg-parchment';
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => pick(day)}
                    aria-label={formatDay(day)}
                    aria-pressed={isStart || isEnd}
                    className={`grid h-9 place-items-center rounded-lg text-sm tabular-nums transition ${tone}`}
                  >
                    {Number(day.slice(-2))}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-xs text-mist">
            {draftStart && draftEnd
              ? `${format(fromDay(draftStart), 'MMM d, yyyy')} → ${format(fromDay(draftEnd), 'MMM d, yyyy')} · ${diffDay(draftEnd, draftStart) + 1} days`
              : draftStart
                ? 'Now pick the last day.'
                : 'Pick the first day.'}
          </p>
        </Modal>
      )}
    </>
  );
}

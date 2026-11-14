import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { fromDay } from '../lib/dates';

// Planned vs projected for the next 7 pending tasks. Shifted cells get a
// champagne border + arrow, so status is never conveyed by color alone.
export default function SmartCalendar({ projection, today }) {
  const cells = projection.slice(0, 7);
  if (!cells.length) {
    return <p className="text-sm text-slate">Nothing left to schedule. The queue is empty.</p>;
  }

  const weekday = (day) => format(fromDay(day), 'EEE');

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-cols-[64px_repeat(7,minmax(88px,1fr))] gap-1 min-w-full text-xs">
        <span />
        {cells.map((task) => (
          <span key={`w-${task.id}`} className="text-center text-mist">
            {weekday(task.projected)}
          </span>
        ))}

        <span className="text-slate py-2">Planned</span>
        {cells.map((task) => (
          <div key={`p-${task.id}`} className="rounded-lg bg-ivory border border-sand px-2 py-2">
            <p className="text-slate tabular-nums">{format(fromDay(task.planned_date), 'MMM d')}</p>
            <p className="truncate text-mist">{task.title}</p>
          </div>
        ))}

        <span className="text-slate py-2">Projected</span>
        {cells.map((task) => {
          const shifted = task.shift > 0;
          const isToday = task.projected === today;
          return (
            <div
              key={`j-${task.id}`}
              className={`rounded-lg px-2 py-2 ${
                isToday ? 'bg-champagne/5' : 'bg-parchment'
              } ${shifted ? 'border-2 border-champagne' : 'border border-sand'}`}
            >
              <p className="flex items-center gap-1 text-ink tabular-nums">
                {format(fromDay(task.projected), 'MMM d')}
                {shifted && <ArrowRight className="w-3 h-3 text-champagne" aria-hidden="true" />}
              </p>
              <p className="truncate text-slate">{task.title}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-mist">
        Champagne outline = shifted. Today's column is tinted.
      </p>
    </div>
  );
}

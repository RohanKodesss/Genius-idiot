import { formatDay } from '../lib/dates';

// Each task as one line: when it was planned, and when it now lands.
export default function SmartCalendar({ projection, today }) {
  const cells = projection.slice(0, 7);
  if (!cells.length) {
    return <p className="text-sm text-slate">Nothing left to schedule. The queue is empty.</p>;
  }

  return (
    <div>
      <ul className="space-y-1.5">
        {cells.map((task) => {
          const shifted = task.shift > 0;
          const isToday = task.projected === today;
          return (
            <li
              key={task.id}
              className={`flex flex-wrap items-baseline justify-between gap-x-3 rounded-lg px-3 py-2 ${
                isToday ? 'bg-champagne/5' : 'bg-parchment'
              } ${shifted ? 'border border-champagne' : 'border border-sand'}`}
            >
              <p className="truncate text-sm text-ink">
                {isToday && <span className="text-xs text-champagne mr-2">Today</span>}
                {task.title}
              </p>
              <p className="text-xs shrink-0">
                {shifted ? (
                  <span className="text-slate">
                    was {formatDay(task.planned_date)} →{' '}
                    <span className="text-ink">now {formatDay(task.projected)}</span>
                  </span>
                ) : (
                  <span className="text-slate">{formatDay(task.projected)}</span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-mist">Highlighted tasks now land later than planned.</p>
    </div>
  );
}

import { format } from 'date-fns';
import { addDay, fromDay } from '../lib/dates';

const WEEKS = 26;

// CSS-grid heatmap of completed days. No library (PRD §11).
export default function HeatMap({ counts, today }) {
  const start = addDay(today, -(WEEKS * 7 - 1));
  const days = Array.from({ length: WEEKS * 7 }, (_, index) => addDay(start, index));

  return (
    <div className="min-w-0">
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
          gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
          gridAutoFlow: 'column',
        }}
      >
        {days.map((day) => {
          const count = counts.get(day) ?? 0;
          const future = day > today;
          return (
            <div
              key={day}
              role="img"
              aria-label={`${format(fromDay(day), 'MMM d, yyyy')}: ${count} task${
                count === 1 ? '' : 's'
              } completed`}
              title={`${format(fromDay(day), 'MMM d')} · ${count} task${count === 1 ? '' : 's'}`}
              className={`aspect-square w-full rounded-[2px] ${
                future ? 'bg-transparent' : count > 0 ? 'bg-sage' : 'bg-sand/40'
              }`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-mist">
        <span className="w-3 h-3 rounded-sm bg-sand/40" aria-hidden="true" /> none
        <span className="w-3 h-3 rounded-sm bg-sage" aria-hidden="true" /> completed
        <span className="ml-auto">last {WEEKS} weeks</span>
      </div>
    </div>
  );
}

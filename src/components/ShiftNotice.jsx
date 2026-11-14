import { AlertTriangle, ArrowRight } from 'lucide-react';
import { formatDay } from '../lib/dates';

// "Landing copy moved from Fri, Nov 13 → Sat, Nov 14 (+1 day). All later tasks shifted."
export default function ShiftNotice({ projection }) {
  const shifted = projection.filter((task) => task.shift > 0);
  if (!shifted.length) return null;

  return (
    <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-terracotta">
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        {shifted.length} task{shifted.length === 1 ? '' : 's'} shifted
      </p>
      <ul className="mt-2 space-y-1">
        {shifted.slice(0, 3).map((task) => (
          <li key={task.id} className="text-sm">
            <span className="text-ink">{task.title}</span>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate">
              <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
              {formatDay(task.planned_date)} → {formatDay(task.projected)}
              <span className="text-terracotta">
                ({task.shift} day{task.shift === 1 ? '' : 's'} later)
              </span>
            </span>
          </li>
        ))}
      </ul>
      {shifted.length > 3 && (
        <p className="mt-2 text-xs text-slate">…and {shifted.length - 3} more</p>
      )}
      <p className="mt-2 text-xs text-slate">
        Daily load stays the same. Only the finish date moved.
      </p>
    </div>
  );
}

import { AlertTriangle, ArrowRight } from 'lucide-react';

// "Task 8 moved from Nov 8 → Nov 9 (+1 day). All later tasks shifted."
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
          <li key={task.id} className="flex items-center gap-1.5 text-sm text-ink">
            <span className="truncate">{task.title}</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate tabular-nums shrink-0">
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
              {task.planned_date} → {task.projected} (+{task.shift} day{task.shift === 1 ? '' : 's'})
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

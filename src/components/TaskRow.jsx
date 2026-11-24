import { ArrowDown, ArrowUp, Check, Circle, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { formatDay } from '../lib/dates';
import TaskNote from './TaskNote';

// One roadmap line: status, title, link, edit/reorder/delete.
export default function TaskRow({
  task,
  onUndo,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onNote,
  isFirst,
  isLast,
}) {
  const done = Boolean(task.completed_at);
  return (
    <li className="group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 py-3 border-b border-sand last:border-b-0 sm:flex sm:gap-3 sm:py-2.5">
      {/* Completion is timer-only; the circle is a status marker except for undo. */}
      <button
        type="button"
        onClick={() => onUndo(task.id)}
        disabled={!done}
        aria-label={done ? `Undo ${task.title}` : `${task.title} — completes when its timer finishes`}
        title={done ? undefined : 'Completes when its timer finishes'}
        className="-ml-1.5 -mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate hover:text-champagne disabled:cursor-default disabled:hover:text-slate lg:ml-0 lg:mt-0 lg:h-6 lg:w-6"
      >
        {done ? (
          <Check className="w-4 h-4 text-sage" aria-hidden="true" />
        ) : (
          <Circle className="w-4 h-4" aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`break-words text-[15px] leading-snug ${done ? 'text-slate line-through decoration-sand' : 'text-ink'}`}>
          <span className="text-mist tabular-nums text-xs mr-2">{task.order}</span>
          {task.title}
        </p>
        <p className="break-words text-xs text-mist mt-0.5">
          Planned {formatDay(task.planned_date)}
          {task.est_minutes ? ` · ${task.est_minutes} min` : ''}
          {task.total_est_minutes != null
            ? ` · ${task.minutes_completed ?? 0} / ${task.total_est_minutes} min (multi-day)`
            : ''}
          {done && task.minutes_spent != null ? ` · logged ${task.minutes_spent} min` : ''}
        </p>
        {task.link && (
          <a
            href={task.link}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-slate hover:text-champagne"
          >
            <span className="min-w-0 break-words">Open link</span>
            <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
          </a>
        )}
        {onNote && (
          <TaskNote
            value={task.notes}
            compact
            onSave={(notes) => onNote(task.id, notes)}
          />
        )}
      </div>

      <div className="task-actions col-span-2 mt-1 flex justify-end gap-0.5 sm:col-span-1 sm:mt-0 sm:shrink-0 sm:items-center">
        <button
          type="button"
          onClick={() => onMoveUp(task)}
          disabled={isFirst}
          aria-label={`Move ${task.title} up`}
          className="h-11 w-11 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-ivory disabled:opacity-30 lg:h-9 lg:w-9"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(task)}
          disabled={isLast}
          aria-label={`Move ${task.title} down`}
          className="h-11 w-11 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-ivory disabled:opacity-30 lg:h-9 lg:w-9"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className="h-11 w-11 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-ivory lg:h-9 lg:w-9"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className="h-11 w-11 rounded-lg flex items-center justify-center text-bordeaux hover:bg-bordeaux/5 lg:h-9 lg:w-9"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}

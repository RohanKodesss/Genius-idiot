import { ArrowDown, ArrowUp, Check, Circle, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { formatDay } from '../lib/dates';

// One roadmap line: status, title, link, edit/reorder/delete.
export default function TaskRow({
  task,
  onUndo,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) {
  const done = Boolean(task.completed_at);
  return (
    <li className="group flex items-start gap-3 py-2.5 border-b border-sand last:border-b-0">
      {/* Completion is timer-only; the circle is a status marker except for undo. */}
      <button
        type="button"
        onClick={() => onUndo(task.id)}
        disabled={!done}
        aria-label={done ? `Undo ${task.title}` : `${task.title} — completes when its timer finishes`}
        title={done ? undefined : 'Completes when its timer finishes'}
        className="mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-slate hover:text-champagne disabled:cursor-default disabled:hover:text-slate"
      >
        {done ? (
          <Check className="w-4 h-4 text-sage" aria-hidden="true" />
        ) : (
          <Circle className="w-4 h-4" aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-[15px] leading-snug ${done ? 'text-slate line-through decoration-sand' : 'text-ink'}`}>
          <span className="text-mist tabular-nums text-xs mr-2">{task.order}</span>
          {task.title}
        </p>
        <p className="text-xs text-mist mt-0.5">
          Planned {formatDay(task.planned_date)}
          {task.est_minutes ? ` · ${task.est_minutes} min` : ''}
          {done && task.minutes_spent != null ? ` · logged ${task.minutes_spent} min` : ''}
        </p>
        {task.link && (
          <a
            href={task.link}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-slate hover:text-champagne"
          >
            Open link <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition">
        <button
          type="button"
          onClick={() => onMoveUp(task)}
          disabled={isFirst}
          aria-label={`Move ${task.title} up`}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-ivory disabled:opacity-30"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(task)}
          disabled={isLast}
          aria-label={`Move ${task.title} down`}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-ivory disabled:opacity-30"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-ivory"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-bordeaux hover:bg-bordeaux/5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}

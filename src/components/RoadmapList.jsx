import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { durationInDays } from '../lib/multiday';
import { Button, Input } from './ui';
import TaskRow from './TaskRow';

const emptyDraft = () => ({
  title: '',
  link: '',
  est_minutes: '',
  multi_day: false,
  total_est_minutes: '',
});

// Shared by the add and edit forms: the toggle plus a day preview.
function MultiDayFields({ draft, setDraft, dailyMinutes }) {
  const total = Number(draft.total_est_minutes);
  const days = total > 0 ? durationInDays({ total_est_minutes: total }, dailyMinutes) : 0;

  return (
    <div className="grid gap-3 rounded-xl border border-sand bg-parchment p-3">
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] text-slate">
        <input
          type="checkbox"
          checked={draft.multi_day}
          onChange={(event) => setDraft({ ...draft, multi_day: event.target.checked })}
          className="h-4 w-4 rounded border-sand accent-champagne"
        />
        Is this a multi-day task?
      </label>
      {draft.multi_day && (
        <>
          <Input
            label="Total minutes"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder="900"
            value={draft.total_est_minutes}
            onChange={(event) => setDraft({ ...draft, total_est_minutes: event.target.value })}
          />
          <p className="text-xs text-mist">
            {days > 0
              ? `This will take ${days} day${days === 1 ? '' : 's'} at ${dailyMinutes} mins/day.`
              : 'Enter the total minutes for this task.'}
          </p>
        </>
      )}
    </div>
  );
}

export default function RoadmapList({ goalId, tasks }) {
  const { undoTask, updateTask, deleteTask, reorderTask, addTask, goals } = useApp();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [adding, setAdding] = useState(false);
  const dailyMinutes = goals.find((goal) => goal.id === goalId)?.daily_minutes ?? 60;
  const totalMinutes = (draft) =>
    draft.multi_day && Number(draft.total_est_minutes) > 0
      ? Number(draft.total_est_minutes)
      : null;

  const ordered = [...tasks].sort((a, b) => a.order - b.order);

  const move = (task, direction) => {
    const index = ordered.findIndex((row) => row.id === task.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    reorderTask(task.id, target + 1);
  };

  return (
    <div>
      <ul className="divide-y divide-sand">
        {ordered.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            isFirst={index === 0}
            isLast={index === ordered.length - 1}
            onUndo={undoTask}
            onNote={(taskId, notes) => updateTask(taskId, { notes })}
            onMoveUp={(row) => move(row, -1)}
            onMoveDown={(row) => move(row, 1)}
            onDelete={(row) => {
              if (window.confirm(`Delete “${row.title}”?`)) deleteTask(row.id);
            }}
            onEdit={(row) => {
              setEditing(row.id);
              setDraft({
                title: row.title,
                link: row.link ?? '',
                est_minutes: row.est_minutes ?? '',
                multi_day: row.total_est_minutes != null,
                total_est_minutes: row.total_est_minutes ?? '',
              });
            }}
          />
        ))}
      </ul>

      {editing && (
        <form
          className="mt-4 grid gap-3 rounded-xl border border-sand bg-ivory p-4"
          onSubmit={(event) => {
            event.preventDefault();
            updateTask(editing, {
              title: draft.title.trim(),
              link: draft.link.trim() || null,
              est_minutes: draft.est_minutes === '' ? null : Number(draft.est_minutes),
              total_est_minutes: totalMinutes(draft),
            });
            setEditing(null);
          }}
        >
          <Input
            label="Task title"
            value={draft.title}
            required
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
          <Input
            label="Link (optional)"
            type="url"
            value={draft.link}
            onChange={(event) => setDraft({ ...draft, link: event.target.value })}
          />
          <Input
            label="Estimate minutes (optional)"
            type="number"
            min="1"
            value={draft.est_minutes}
            onChange={(event) => setDraft({ ...draft, est_minutes: event.target.value })}
          />
          <MultiDayFields draft={draft} setDraft={setDraft} dailyMinutes={dailyMinutes} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit">Save task</Button>
          </div>
        </form>
      )}

      {adding ? (
        <form
          className="mt-4 grid gap-3 rounded-xl border border-sand bg-ivory p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await addTask(goalId, {
              title: draft.title,
              link: draft.link,
              est_minutes: draft.est_minutes === '' ? null : Number(draft.est_minutes),
              total_est_minutes: totalMinutes(draft),
            });
            setDraft(emptyDraft());
            setAdding(false);
          }}
        >
          <Input
            label="New task title"
            value={draft.title}
            required
            autoFocus
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
          <Input
            label="Link (optional)"
            type="url"
            value={draft.link}
            onChange={(event) => setDraft({ ...draft, link: event.target.value })}
          />
          <MultiDayFields draft={draft} setDraft={setDraft} dailyMinutes={dailyMinutes} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={draft.multi_day && !(Number(draft.total_est_minutes) > 0)}
            >
              Add task
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(emptyDraft());
            setAdding(true);
          }}
          className="mt-4 inline-flex items-center gap-2 text-sm text-slate hover:text-ink max-lg:min-h-[44px]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add task
        </button>
      )}
    </div>
  );
}

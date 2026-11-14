import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Input } from './ui';
import TaskRow from './TaskRow';

export default function RoadmapList({ goalId, tasks }) {
  const { undoTask, updateTask, deleteTask, reorderTask, addTask } = useApp();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ title: '', link: '', est_minutes: '' });
  const [adding, setAdding] = useState(false);

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
            });
            setDraft({ title: '', link: '', est_minutes: '' });
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
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit">Add task</Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft({ title: '', link: '', est_minutes: '' });
            setAdding(true);
          }}
          className="mt-4 inline-flex items-center gap-2 text-sm text-slate hover:text-ink"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add task
        </button>
      )}
    </div>
  );
}

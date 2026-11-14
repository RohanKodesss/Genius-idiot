import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Input } from './ui';
import Modal from './Modal';

// Shown when a roadmap slips past 14 days (PRD FR-N2). Trim or accept.
export default function HealthWarning({ goalId, shift, pendingTasks, onTrim, onAccept }) {
  const [trimCount, setTrimCount] = useState(Math.max(1, shift - 14));
  const [open, setOpen] = useState(false);

  const toTrim = [...pendingTasks].sort((a, b) => b.order - a.order).slice(0, trimCount);

  return (
    <>
      <div className="rounded-xl border border-bordeaux/30 bg-bordeaux/5 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-bordeaux">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          This roadmap is {shift} days behind.
        </p>
        <p className="mt-1 text-sm text-slate">
          Daily load has stayed the same, but the finish date moved. Trim the tail, or accept the
          new finish date.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Trim last {Math.max(1, shift - 14)}
          </Button>
          <Button variant="ghost" onClick={onAccept}>
            Accept new finish date
          </Button>
        </div>
      </div>

      {open && (
        <Modal
          title="Trim the tail"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await onTrim(trimCount);
                  setOpen(false);
                }}
              >
                Remove {trimCount} task{trimCount === 1 ? '' : 's'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate">
            These tasks will be deleted from the end of the queue. Completed work is never touched.
          </p>
          <div className="mt-4">
            <Input
              label="How many to remove"
              type="number"
              min="1"
              max={pendingTasks.length}
              value={trimCount}
              onChange={(event) => setTrimCount(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
          <ul className="mt-4 space-y-1 text-sm text-ink">
            {toTrim.map((task) => (
              <li key={task.id} className="truncate">
                <span className="text-mist tabular-nums mr-2">{task.order}</span>
                {task.title}
              </li>
            ))}
            {toTrim.length === 0 && <li className="text-slate">Nothing pending to trim.</li>}
          </ul>
          <p className="mt-3 text-xs text-mist">Goal {goalId.slice(0, 8)} · this cannot be undone.</p>
        </Modal>
      )}
    </>
  );
}

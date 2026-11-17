import { useId, useState } from 'react';
import { Pause, Snowflake } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui';
import Modal from './Modal';

export default function HibernationControl() {
  const { goals, hibernate } = useApp();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState('5');
  const [busy, setBusy] = useState(false);
  const inputId = useId();

  const enable = async () => {
    if (busy || !goals.length || Number(days) < 1 || Number(days) > 90) return;
    setBusy(true);
    const result = await hibernate(Number(days));
    setBusy(false);
    if (result?.ok) setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={!goals.length}
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate hover:bg-ivory hover:text-ink disabled:opacity-40"
      >
        <Snowflake className="h-4 w-4 shrink-0" aria-hidden="true" />
        Hibernate queues
      </button>
      {open && (
        <Modal
          title="Let your queues hibernate"
          onClose={() => { if (!busy) setOpen(false); }}
          footer={
            <>
              <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={busy || Number(days) < 1 || Number(days) > 90} onClick={enable}>
                <Pause className="h-4 w-4" aria-hidden="true" />
                {busy ? 'Pausing…' : 'Hibernate queues'}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-slate">
            Hibernation marks each selected day as a rest day for every goal. Your queue waits, your streak is protected, and the next task is ready when you return. The estimated finish date moves forward by the time away; your daily workload stays the same.
          </p>
          <label htmlFor={inputId} className="mt-5 block text-[13px] font-medium text-slate">How many days away?</label>
          <input
            id={inputId}
            type="number"
            min="1"
            max="90"
            required
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-sand bg-ivory px-4 py-2.5 text-base text-ink focus:border-champagne focus:ring-2 focus:ring-champagne/20"
          />
          <p className="mt-2 text-xs text-mist">Applies to all {goals.length} goal{goals.length === 1 ? '' : 's'}, starting today. You can still use the app while they rest.</p>
        </Modal>
      )}
    </>
  );
}

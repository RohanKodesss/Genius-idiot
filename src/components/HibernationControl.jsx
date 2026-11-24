import { useId, useState } from 'react';
import { addDay, formatDay } from '../lib/dates';
import { listActiveHibernations } from '../lib/hibernation';
import { useApp } from '../context/AppContext';
import { Button, Select } from './ui';
import Modal from './Modal';
import { Pause, Snowflake } from 'lucide-react';

export default function HibernationControl() {
  const { goals, restDays, today, hibernate, cancelHibernation } = useApp();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState('5');
  const [target, setTarget] = useState('all');
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const id = useId();
  const sessions = listActiveHibernations(restDays, goals, today);
  const activeGoals = new Set(sessions.flatMap((session) => session.goalIds));
  const eligibleGoals = goals.filter((goal) => !activeGoals.has(goal.id));
  const canHibernate = target === 'all'
    ? goals.length > 0 && activeGoals.size === 0
    : eligibleGoals.some((goal) => goal.id === target);

  const enable = async () => {
    const goalIds = target === 'all' ? goals.map((goal) => goal.id) : [target];
    if (busy || !canHibernate || Number(days) < 1 || Number(days) > 90) return;
    setBusy(true);
    const result = await hibernate({ days: Number(days), goalIds });
    setBusy(false);
    if (result?.ok) setOpen(false);
  };

  const cancel = async (sessionId) => {
    setCancelling(sessionId);
    const result = await cancelHibernation(sessionId);
    setCancelling(null);
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
        Hibernation
        {sessions.length > 0 && <span className="ml-auto rounded-full bg-champagne/10 px-2 py-0.5 text-[11px] text-champagne">{sessions.length} active</span>}
      </button>
      {open && (
        <Modal
          title={sessions.length ? 'Manage hibernation' : 'Hibernate a goal'}
          onClose={() => { if (!busy && !cancelling) setOpen(false); }}
          footer={
            <>
              <Button variant="secondary" disabled={busy || Boolean(cancelling)} onClick={() => setOpen(false)}>Close</Button>
              <Button disabled={busy || !canHibernate || Number(days) < 1 || Number(days) > 90} onClick={enable}>
                <Pause className="h-4 w-4" aria-hidden="true" />
                {busy ? 'Pausing…' : 'Start hibernation'}
              </Button>
            </>
          }
        >
          {sessions.map((session) => (
            <div key={session.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand bg-ivory p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{session.names.join(', ')}</p>
                <p className="mt-1 text-xs text-slate">Resumes {formatDay(addDay(session.resumeAfter, 1))}</p>
              </div>
              <Button variant="secondary" disabled={busy || Boolean(cancelling)} onClick={() => cancel(session.id)}>
                {cancelling === session.id ? 'Cancelling…' : 'Cancel hibernation'}
              </Button>
            </div>
          ))}

          <p className="text-sm leading-relaxed text-slate">
            Hibernation marks selected days as rest days. Your queue waits and your streak is protected. Cancelling removes only the rest days created by that hibernation; manually marked rest days stay in place.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Select label="Which goals?" id={`hibernate-target-${id}`} value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="all" disabled={activeGoals.size > 0}>All goals</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id} disabled={activeGoals.has(goal.id)}>
                  {goal.name}{activeGoals.has(goal.id) ? ' · already resting' : ''}
                </option>
              ))}
            </Select>
            <div>
              <label htmlFor={`hibernate-days-${id}`} className="block text-[13px] font-medium text-slate">How many days away?</label>
              <input
                id={`hibernate-days-${id}`}
                type="number"
                min="1"
                max="90"
                required
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-sand bg-ivory px-4 py-2.5 text-base text-ink focus:border-champagne focus:ring-2 focus:ring-champagne/20"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-mist">Starts today. The estimated finish date moves forward by the time away; the daily workload stays the same.</p>
        </Modal>
      )}
    </>
  );
}

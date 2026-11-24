// Long-form task entry for onboarding: one task that spans a date range.
import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { diffDay, formatDay } from '../lib/dates';
import { Button, Input } from './ui';
import DateRangePicker from './DateRangePicker';

export default function LongFormTaskForm({ goal }) {
  const { today, tasksByGoal, addTask, notify } = useApp();
  const notesId = useId();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [range, setRange] = useState({ start: today, end: today });
  const [busy, setBusy] = useState(false);

  const days = range.start && range.end ? diffDay(range.end, range.start) + 1 : 0;
  const totalMinutes = days * goal.daily_minutes;
  const hasTasks = (tasksByGoal[goal.id] ?? []).length > 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || days < 1 || busy) return;
    setBusy(true);
    const res = await addTask(goal.id, {
      title,
      link,
      notes,
      total_est_minutes: totalMinutes,
      planned_date: range.start,
    });
    setBusy(false);
    if (!res?.ok) return;
    notify(
      `“${title.trim()}” added: ${days} day${days === 1 ? '' : 's'} at ${goal.daily_minutes} min/day.`,
      'success',
    );
    setTitle('');
    setLink('');
    setNotes('');
    setRange({ start: today, end: today });
  };

  return (
    <form className="mt-5 grid gap-3" onSubmit={submit}>
      <Input
        label="Task title"
        placeholder="15-hour video course"
        required
        maxLength={140}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Input
        label="Resource link (optional)"
        type="url"
        placeholder="https://…"
        value={link}
        onChange={(event) => setLink(event.target.value)}
      />

      <div>
        <p className="mb-1.5 block text-[13px] font-medium text-slate">Task dates</p>
        <DateRangePicker
          start={range.start}
          end={range.end}
          onChange={setRange}
        />
      </div>

      <div>
        <label htmlFor={notesId} className="mb-1.5 block text-[13px] font-medium text-slate">
          Notes (optional)
        </label>
        <textarea
          id={notesId}
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What to focus on, where to start, how you will measure progress…"
          className="w-full rounded-xl border border-sand bg-ivory px-4 py-2.5 text-base text-ink placeholder:text-mist transition focus:border-champagne focus:ring-2 focus:ring-champagne/20 sm:text-[15px]"
        />
      </div>

      <p className="rounded-xl border border-sand bg-parchment px-3 py-2.5 text-xs leading-relaxed text-slate">
        {days > 0
          ? `This task takes ${days} day${days === 1 ? '' : 's'} · ${totalMinutes} total minutes at ${goal.daily_minutes} min/day.`
          : 'Choose a start and end date.'}
        {' '}It starts on the first free day on or after {formatDay(range.start)}.
        {hasTasks && ' It is added after the tasks already in this goal.'}
      </p>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy || !title.trim() || days < 1}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add long-form task
        </Button>
      </div>
    </form>
  );
}

// Kanban-style roadmap entry: one card per task, a start date seeds the queue.
import { useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import { addDay, formatDay } from '../lib/dates';
import { buildTaskRows } from '../lib/roadmap';
import { Button, Input } from './ui';

const blankCard = () => ({
  key: globalThis.crypto?.randomUUID?.() ?? `card-${Math.random().toString(36).slice(2)}`,
  title: '',
  link: '',
  est_minutes: '',
});

export default function TaskCardBuilder({ startDay, onImport, importLabel = 'Add tasks' }) {
  const [start, setStart] = useState(startDay);
  const [cards, setCards] = useState([blankCard()]);
  const [busy, setBusy] = useState(false);

  const update = (key, patch) =>
    setCards((current) => current.map((card) => (card.key === key ? { ...card, ...patch } : card)));

  const remove = (key) =>
    setCards((current) => (current.length === 1 ? [blankCard()] : current.filter((card) => card.key !== key)));

  const { tasks, errors: validationErrors } = buildTaskRows(cards, start);

  const submit = async () => {
    if (!start || validationErrors.length || !tasks.length) return;
    setBusy(true);
    const res = await onImport(tasks);
    setBusy(false);
    if (res?.ok) {
      setCards([blankCard()]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Start date"
          type="date"
          required
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="w-44"
        />
        <p className="text-xs text-mist pb-3">
          Card 1 lands on this day, card 2 the next, and so on — one task per day.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const error = validationErrors.find((row) => row.index === index);
          const date = start ? addDay(start, index) : null;
          return (
            <div
              key={card.key}
              className={`rounded-xl border bg-ivory p-3 flex flex-col gap-2 ${
                error ? 'border-bordeaux/50' : 'border-sand'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-champagne">
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                  {date ? formatDay(date) : 'No start date'}
                </span>
                <button
                  type="button"
                  onClick={() => remove(card.key)}
                  aria-label={`Remove card ${index + 1}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-parchment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                value={card.title}
                onChange={(event) => update(card.key, { title: event.target.value })}
                placeholder="Task title"
                aria-label={`Task ${index + 1} title`}
                className="w-full bg-parchment border border-sand rounded-lg px-2.5 py-2 text-sm text-ink placeholder:text-mist focus:border-champagne"
              />
              <input
                value={card.link}
                onChange={(event) => update(card.key, { link: event.target.value })}
                placeholder="https://resource (optional)"
                aria-label={`Task ${index + 1} link`}
                className="w-full bg-parchment border border-sand rounded-lg px-2.5 py-2 text-xs text-ink placeholder:text-mist focus:border-champagne"
              />
              <input
                value={card.est_minutes}
                onChange={(event) => update(card.key, { est_minutes: event.target.value })}
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="minutes (optional)"
                aria-label={`Task ${index + 1} estimate in minutes`}
                className="w-full bg-parchment border border-sand rounded-lg px-2.5 py-2 text-xs text-ink placeholder:text-mist focus:border-champagne"
              />

              {error && <p className="text-xs text-bordeaux">{error.message}</p>}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setCards((current) => [...current, blankCard()])}
          className="min-h-[132px] rounded-xl border border-dashed border-sand text-slate hover:text-ink hover:border-champagne flex flex-col items-center justify-center gap-1 text-sm"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add card
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-mist">
          {tasks.length
            ? `${tasks.length} task${tasks.length === 1 ? '' : 's'} ready · ${formatDay(
                tasks[0].planned_date,
              )} → ${formatDay(tasks[tasks.length - 1].planned_date)}`
            : 'Add at least one task title.'}
        </p>
        <Button onClick={submit} disabled={busy || !tasks.length || validationErrors.length > 0 || !start}>
          {importLabel}
        </Button>
      </div>
    </div>
  );
}

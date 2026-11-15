import { useId, useState } from 'react';
import { Pencil, StickyNote } from 'lucide-react';

// One free-text note per task: what you learned, where you stopped, what to
// revisit. Display-only until the user opens it, so a card stays quiet.
export default function TaskNote({ value = '', onSave, compact = false }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [busy, setBusy] = useState(false);

  const start = () => {
    setDraft(value ?? '');
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    await onSave(draft.trim() ? draft.trim() : null);
    setBusy(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="mt-2">
        <label htmlFor={id} className="block text-xs font-medium text-slate mb-1">
          Note
        </label>
        <textarea
          id={id}
          autoFocus
          rows={compact ? 2 : 3}
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What you learned, where you stopped, what to revisit…"
          className="w-full rounded-xl border border-sand bg-ivory px-3 py-2 text-sm text-ink placeholder:text-mist focus:border-champagne focus:ring-2 focus:ring-champagne/20"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-lg border border-sand px-3 py-1 text-xs font-medium text-ink hover:border-ink hover:bg-parchment disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save note'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-slate hover:text-ink underline underline-offset-4"
          >
            Cancel
          </button>
          <span className="ml-auto text-[11px] text-mist tabular-nums">{draft.length}/2000</span>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <div className="mt-2 rounded-xl border border-sand bg-ivory px-3 py-2">
        <div className="flex items-start gap-2">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" aria-hidden="true" />
          <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-slate">{value}</p>
          <button
            type="button"
            onClick={start}
            aria-label="Edit note"
            className="shrink-0 grid h-7 w-7 place-items-center rounded-lg text-mist hover:bg-parchment hover:text-ink focus-visible:outline-champagne"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="mt-1 inline-flex min-h-[32px] items-center gap-1.5 py-1 text-xs text-mist hover:text-ink focus-visible:outline-champagne"
    >
      <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
      Add note
    </button>
  );
}

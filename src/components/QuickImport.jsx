// Paste anything: CSV/TSV rows, bullet lists, or a checklist. Plus file drop.
import { useMemo, useState } from 'react';
import { Check, Upload } from 'lucide-react';
import { addDay } from '../lib/dates';
import { parseQuickImport } from '../lib/quickImport';
import { Button, Input } from './ui';

const EXAMPLE = `Arrays basics, https://example.com/arrays, 45
Two pointers
- Sliding window | 45
1. Binary search`;

export default function QuickImport({ startDay, onImport, importLabel = 'Import tasks' }) {
  const [text, setText] = useState('');
  const [start, setStart] = useState(startDay ?? '');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const parsed = useMemo(() => parseQuickImport(text), [text]);
  const clean = parsed.tasks.length > 0 && parsed.errors.length === 0;

  const readFile = async (file) => {
    if (!file) return;
    setText(await file.text());
  };

  const submit = async () => {
    if (!start || !clean) return;
    setBusy(true);
    await onImport(
      parsed.tasks.map((task, index) => ({ ...task, planned_date: addDay(start, index) })),
    );
    setBusy(false);
    setText('');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <Input
          label="Start date"
          type="date"
          required
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="w-44"
        />
        <p className="mt-1 mb-4 text-xs text-mist">
          Task 1 lands on this day, task 2 the next, and so on — one task per day.
        </p>

        <label htmlFor="quick-import" className="block text-[13px] font-medium text-slate mb-1.5">
          Paste tasks, or drop a .txt / .md / .csv / .tsv file
        </label>
        <textarea
          id="quick-import"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            readFile(event.dataTransfer.files?.[0]);
          }}
          placeholder={EXAMPLE}
          spellCheck={false}
          className={`w-full font-mono text-sm bg-ivory border rounded-xl p-4 min-h-[200px] text-ink placeholder:text-mist focus:border-champagne focus:ring-2 focus:ring-champagne/20 ${
            dragging ? 'border-champagne bg-champagne/5' : 'border-sand'
          }`}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate hover:text-ink">
            <Upload className="w-4 h-4" aria-hidden="true" />
            Choose file
            <input
              type="file"
              accept=".txt,.md,.csv,.tsv,text/*"
              className="sr-only"
              onChange={(event) => readFile(event.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            className="text-xs text-slate hover:text-ink underline underline-offset-4"
            onClick={() => setText(EXAMPLE)}
          >
            Use example
          </button>
        </div>
      </div>

      <div className="bg-parchment rounded-xl p-5 border border-sand">
        {!text.trim() && (
          <p className="text-sm text-slate">
            One task per line. A row can be <code className="text-xs">title, link, minutes</code> —
            commas, tabs or <code className="text-xs">|</code> all work.
          </p>
        )}

        {text.trim() && (
          <>
            <p className="text-[13px] font-medium text-slate">
              {parsed.tasks.length} task{parsed.tasks.length === 1 ? '' : 's'} detected
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink max-h-56 overflow-y-auto">
              {parsed.tasks.map((task, index) => (
                <li key={`${task.title}-${index}`} className="truncate">
                  <span className="text-mist tabular-nums mr-2">
                    {start ? addDay(start, index) : index + 1}
                  </span>
                  {task.title}
                  {task.link && <span className="text-mist"> · link</span>}
                  {task.est_minutes && <span className="text-mist"> · {task.est_minutes} min</span>}
                </li>
              ))}
            </ul>

            {parsed.errors.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {parsed.errors.map((error) => (
                  <li
                    key={`${error.line}-${error.message}`}
                    className="border-l-2 border-bordeaux pl-3 text-sm text-bordeaux"
                  >
                    Line {error.line}: {error.message}
                  </li>
                ))}
              </ul>
            ) : start ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-sage">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Ready · {start} → {addDay(start, parsed.tasks.length - 1)}
              </p>
            ) : (
              <p className="mt-3 text-xs text-mist">Pick a start date to import.</p>
            )}

            <Button className="mt-4 w-full" disabled={!clean || busy || !start} onClick={submit}>
              {importLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Check } from 'lucide-react';
import { parseMarkdown } from '../lib/markdown';
import { addDay } from '../lib/dates';
import { Button, Input } from './ui';

const EXAMPLE = `# DSA
- [ ] Arrays basics | https://example.com/arrays
- [ ] Two pointers
- [ ] Sliding window | 45`;

// Textarea -> parse -> preview -> confirm. Never saves a file with errors.
export default function MarkdownImporter({ onImport, importLabel = 'Import roadmap', startDay }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [start, setStart] = useState(startDay ?? '');
  const [busy, setBusy] = useState(false);

  const preview = () => setParsed(parseMarkdown(text));
  const clean = parsed && parsed.errors.length === 0 && parsed.tasks.length > 0;
  const lastDay = clean && start ? addDay(start, parsed.tasks.length - 1) : null;

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

        <label htmlFor="roadmap-md" className="block text-[13px] font-medium text-slate mb-1.5">
          Roadmap Markdown
        </label>
        <textarea
          id="roadmap-md"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setParsed(null);
          }}
          placeholder={EXAMPLE}
          spellCheck={false}
          className="w-full font-mono text-sm bg-ivory border border-sand rounded-xl p-4 min-h-[200px] text-ink placeholder:text-mist focus:border-champagne focus:ring-2 focus:ring-champagne/20"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={preview} disabled={!text.trim()}>
            Parse preview
          </Button>
          <button
            type="button"
            className="text-xs text-slate hover:text-ink underline underline-offset-4"
            onClick={() => {
              setText(EXAMPLE);
              setParsed(null);
            }}
          >
            Use example
          </button>
        </div>
      </div>

      <div className="bg-parchment rounded-xl p-5 border border-sand">
        {!parsed && <p className="text-sm text-slate">Paste your roadmap, then parse a preview.</p>}

        {parsed && (
          <>
            <p className="text-[13px] font-medium text-slate">{parsed.goalName ?? 'No heading found'}</p>
            <ul className="mt-2 space-y-1 text-sm text-ink max-h-56 overflow-y-auto">
              {parsed.tasks.map((task, index) => (
                <li key={`${task.title}-${index}`} className="truncate">
                  <span className="text-mist tabular-nums mr-2">{index + 1}</span>
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
            ) : (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-sage">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                {parsed.tasks.length} task{parsed.tasks.length === 1 ? '' : 's'} parsed
                {lastDay && ` · ${start} → ${lastDay}`}
              </p>
            )}

            <Button
              className="mt-4 w-full"
              disabled={!clean || busy || !start}
              onClick={async () => {
                setBusy(true);
                await onImport(
                  parsed.tasks.map((task, index) => ({
                    ...task,
                    planned_date: addDay(start, index),
                  })),
                );
                setBusy(false);
                setText('');
                setParsed(null);
              }}
            >
              {importLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

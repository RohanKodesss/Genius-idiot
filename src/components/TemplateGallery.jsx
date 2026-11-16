import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { roadmapTemplates } from '../lib/templates';
import { useApp } from '../context/AppContext';
import { Button } from './ui';
import Modal from './Modal';

export default function TemplateGallery({ className = '' }) {
  const { createGoalFromTemplate, notify } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirmTemplate = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const result = await createGoalFromTemplate(selected);
    setBusy(false);
    if (!result?.ok) return;
    notify(`${selected.title} is ready with ${selected.tasks.length} tasks.`, 'success');
    setSelected(null);
    navigate(`/goal/${result.data.id}`);
  };

  return (
    <section id="templates" className={className}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne">
          Start with a roadmap
        </p>
        <h2 className="mt-1 font-display text-2xl text-ink">
          Or start with a proven template:
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate">
          A clear first step, a steady daily pace, and room to adjust as you go.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roadmapTemplates.map((template, index) => (
          <article
            key={template.id}
            className="surface-card surface-card--interactive flex min-w-0 flex-col rounded-2xl p-4 sm:p-5"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${index % 2 ? 'bg-sage/10 text-sage' : 'bg-champagne/10 text-champagne'}`}>
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 break-words font-display text-xl leading-tight text-ink">
              {template.title}
            </h3>
            <p className="mt-2 min-h-10 text-sm leading-relaxed text-slate">
              {template.description}
            </p>
            <p className="mt-4 text-xs tabular-nums text-mist">
              {template.tasks.length} tasks · {template.daily_minutes} min/day
            </p>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => setSelected(template)}>
              Use template <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </article>
        ))}
      </div>

      {selected && (
        <Modal
          title={`Start “${selected.title}”?`}
          onClose={() => { if (!busy) setSelected(null); }}
          footer={
            <>
              <Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button disabled={busy} onClick={confirmTemplate}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                {busy ? 'Adding roadmap…' : 'Create roadmap'}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-slate">
            This will add 1 goal and {selected.tasks.length} tasks to your dashboard.
          </p>
          <p className="mt-3 rounded-xl bg-ivory px-3 py-2.5 text-xs text-mist">
            Your first task starts today. The rest follow one per day.
          </p>
        </Modal>
      )}
    </section>
  );
}

import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { roadmapTemplates } from '../lib/templates';
import { useApp } from '../context/AppContext';
import { Button } from './ui';
import Modal from './Modal';
import ScrollReveal from './motion/ScrollReveal';

export default function TemplateGallery({ className = '', vertical = false }) {
  const { createGoalFromTemplate, notify } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [why, setWhy] = useState('');
  const whyInputId = useId();

  const confirmTemplate = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const result = await createGoalFromTemplate(selected, why);
    setBusy(false);
    if (!result?.ok) return;
    notify(`${selected.title} is ready with ${selected.tasks.length} tasks.`, 'success');
    setSelected(null);
    setWhy('');
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

      <div className={`grid gap-3 ${vertical ? '' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
        {roadmapTemplates.map((template, index) => (
          <ScrollReveal key={template.id} delay={index * 0.08}>
            <article
              className="surface-card surface-card--interactive flex min-w-0 h-full flex-col rounded-2xl p-4 sm:p-5"
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
          </ScrollReveal>
        ))}
      </div>

      {selected && (
        <Modal
          title={`Preview ${selected.title}`}
          onClose={() => { if (!busy) { setSelected(null); setWhy(''); } }}
          footer={
            <>
              <Button variant="secondary" disabled={busy} onClick={() => { setSelected(null); setWhy(''); }}>
                Cancel
              </Button>
              <Button disabled={busy || !why.trim()} onClick={confirmTemplate}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                {busy ? 'Adding roadmap…' : 'Add roadmap'}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-slate">
            {selected.description} This roadmap has {selected.tasks.length} daily tasks at {selected.daily_minutes} minutes per day.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-sand">
            <div className="flex items-center justify-between gap-3 border-b border-sand bg-ivory px-3 py-2.5">
              <h3 className="text-sm font-semibold text-ink">Roadmap preview</h3>
              <span className="text-xs tabular-nums text-mist">{selected.tasks.length} days</span>
            </div>
            <ol className="max-h-64 divide-y divide-sand overflow-y-auto px-3">
              {selected.tasks.map((task, index) => (
                <li key={`${selected.id}-${task.title}`} className="grid grid-cols-[3.5rem_minmax(0,1fr)_3rem] items-start gap-2 py-2.5">
                  <span className="pt-0.5 text-xs tabular-nums text-mist">Day {index + 1}</span>
                  <span className="break-words text-sm text-ink">{task.title}</span>
                  <span className="pt-0.5 text-right text-[11px] tabular-nums text-mist">{task.est_minutes ? `${task.est_minutes}m` : '—'}</span>
                </li>
              ))}
            </ol>
          </div>
          <label className="mt-4 block text-[13px] font-medium text-slate" htmlFor={whyInputId}>Why does this goal matter to you?</label>
          <textarea id={whyInputId} required maxLength={180} value={why} onChange={(event) => setWhy(event.target.value)} placeholder="To build a career I care about." className="mt-1.5 w-full rounded-xl border border-sand bg-ivory px-4 py-3 text-sm text-ink focus:border-champagne focus:ring-2 focus:ring-champagne/20" />
          <p className="mt-2 text-xs text-mist">The first task starts today. You can edit the roadmap after adding it.</p>
        </Modal>
      )}
    </section>
  );
}

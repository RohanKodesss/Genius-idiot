// Link-out only: feedback opens GitHub Issues in a new tab. No backend, no
// database, no login inside the app.
import { Bug, Heart, Lightbulb } from 'lucide-react';
import Modal from './Modal';

const ISSUES = 'https://github.com/SidhCodez/Genius-idiot/issues/new';

const links = [
  {
    href: `${ISSUES}?template=bug_report.md`,
    icon: Bug,
    label: 'Report a bug',
    hint: 'Something broke or behaves oddly.',
  },
  {
    href: `${ISSUES}?template=feature_request.md`,
    icon: Lightbulb,
    label: 'Request a feature',
    hint: 'Tell us what would make this better.',
  },
  {
    href: ISSUES,
    icon: Heart,
    label: 'Just say thanks / general feedback',
    hint: 'Kind words or an open-ended thought.',
  },
];

export default function FeedbackIssues({ open, onClose }) {
  if (!open) return null;

  return (
    <Modal title="Feedback & Issues" onClose={onClose}>
      <p className="text-sm leading-relaxed text-slate">
        Found a bug or have an idea? Open an issue on GitHub — it takes a moment and helps
        everyone using Genius Idiot.
      </p>
      <ul className="mt-4 grid gap-2">
        {links.map(({ href, icon: Icon, label, hint }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-sand bg-ivory px-3 py-3 transition hover:border-champagne/60 hover:bg-parchment"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-champagne/10 text-champagne">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block break-words text-sm font-medium text-ink">{label}</span>
                <span className="mt-0.5 block break-words text-xs text-mist">{hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-mist">
        Your feedback is public and helps improve the app!
      </p>
    </Modal>
  );
}

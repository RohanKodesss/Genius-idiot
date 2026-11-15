import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  GitBranch,
  Github,
  History,
  Linkedin,
  ListChecks,
  MessageCircle,
  Moon,
  ShieldCheck,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';
import { useApp } from '../context/AppContext';
import { hasSeenGuide, markGuideSeen } from '../lib/guide';

// A plain-language guide for someone who just signed up. No state, no data:
// it explains the model, not the user's numbers.
const SOURCE_URL = 'https://github.com/SidhCodez/Genius-idiot';
const LINKEDIN_URL = 'https://www.linkedin.com/in/siddiq-dev';
const DISCORD_HANDLE = 'sidhdev';
const steps = [
  {
    icon: ListChecks,
    title: 'Make a goal',
    body: 'One goal per thing you are learning or building — DSA, Web Development, Content Writing. Give it a daily minute budget. Each goal keeps its own queue, so one slipping never drags the others.',
  },
  {
    icon: CalendarClock,
    title: 'Add its roadmap',
    body: 'A roadmap is an ordered list of tasks, one per day. Build cards, paste a Markdown checklist, or paste any list or spreadsheet column. Every method asks for a start date and places task 1 there, task 2 the next day, and so on.',
  },
  {
    icon: Timer,
    title: 'Do one task a day',
    body: 'Today shows one card per goal. Start the timer, and the task completes when it reaches 00:00. Pause, reload, or leave the tab — elapsed time is kept. Finishing early from a paused timer logs what you actually spent.',
  },
  {
    icon: CalendarClock,
    title: 'Miss a day? It slides',
    body: 'Nothing becomes overdue. The task moves to tomorrow and everything behind it moves with it. You still do one task that day. Only the finish date changes, never the size of the day.',
  },
];

const facts = [
  {
    icon: Flame,
    title: 'Streaks',
    body: 'A day counts when the goal was completed or marked as rest. A missed day breaks it. Today does not count against you until it is over, so the streak is measured from yesterday until you finish.',
  },
  {
    icon: Moon,
    title: 'Rest days',
    body: 'A rest day protects the streak and pauses that goal for the day. The queue does not move — the next task simply waits for tomorrow.',
  },
  {
    icon: History,
    title: 'Shift',
    body: 'Shift is how many days later than planned a task now sits. The graph on a goal page shows it over the last 30 days, rebuilt from your completions — nothing extra is stored.',
  },
  {
    icon: TriangleAlert,
    title: 'The honest warning',
    body: 'When a queue falls more than 14 days behind, the goal page offers two real choices: trim the last few pending tasks, or accept the new finish date. It will not nag you forever.',
  },
];

export default function HowItWorks() {
  const { authUser } = useApp();
  const navigate = useNavigate();
  // The gate opens after this is set; AuthGuard re-checks it on the next route.
  const [read, setRead] = useState(() => hasSeenGuide(authUser?.id));

  const [copied, setCopied] = useState(false);

  const confirm = () => {
    if (authUser?.id) markGuideSeen(authUser.id);
    setRead(true);
    navigate('/', { replace: true });
  };

  const copyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(DISCORD_HANDLE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the handle is visible either way.
    }
  };

  return (
    <div className="grid gap-8">
      <header>
        <Badge tone="champagne">How it works</Badge>
        <h1 className="mt-3 font-display text-3xl text-ink">
          A missed day never becomes overdue debt.
        </h1>
        <p className="mt-2 text-sm text-slate max-w-2xl">
          Most trackers turn a skipped day into a pile of red. This one moves the queue: what you
          did not do today becomes tomorrow's task, and everything behind it slides one day later.
          The daily load never grows. That is the whole idea — the rest of the app exists to keep
          that promise honest.
        </p>
      </header>

      <section aria-labelledby="how-to-start" className="grid gap-4">
        <h2 id="how-to-start" className="font-display text-xl text-ink">
          Getting started
        </h2>

        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="flex gap-4 sm:gap-5">
                <span
                  aria-hidden="true"
                  className="shrink-0 w-9 h-9 rounded-full border border-sand bg-ivory flex items-center justify-center text-sm font-semibold text-slate tabular-nums"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 font-display text-lg text-ink">
                    <step.icon className="w-4 h-4 text-champagne" aria-hidden="true" />
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate">{step.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="how-daily" className="grid gap-4">
        <h2 id="how-daily" className="font-display text-xl text-ink">
          A normal day
        </h2>

        <Card>
          <ol className="grid gap-3 text-sm text-slate">
            {[
              'Open Today. The top card is your load: minutes done out of minutes planned, and goals done out of goals.',
              'Each goal card shows its one task for today, the streak, and how far the queue has slipped.',
              'Press Start on a card. The countdown is that goal’s daily minutes. Pause and resume freely.',
              'At 00:00 the task completes itself. Press Undo if you need to put it back.',
              'Not feeling it? Mark a rest day instead — the streak survives and the queue waits.',
              'Open a goal from the sidebar for its roadmap, the next 7 days, the shift graph and the heatmap.',
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sage shrink-0 mt-0.5" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section aria-labelledby="how-parts" className="grid gap-4">
        <h2 id="how-parts" className="font-display text-xl text-ink">
          The parts you will see
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <Card key={fact.title}>
              <h3 className="flex items-center gap-2 font-display text-lg text-ink">
                <fact.icon className="w-4 h-4 text-champagne" aria-hidden="true" />
                {fact.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate">{fact.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-data" className="grid gap-4">
        <h2 id="how-data" className="font-display text-xl text-ink">
          Your data
        </h2>
        <Card>
          <div className="flex gap-4">
            <ShieldCheck className="w-5 h-5 text-sage shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-slate grid gap-2">
              <p>
                Goals, tasks and rest days are stored privately against your account. Only you can
                read them — the database enforces it row by row, not the interface.
              </p>
              <p>
                Streaks, progress, the shift graph and the heatmap are never stored. They are
                recalculated from the tasks you completed, so they can never disagree with your
                history.
              </p>
              <p>
                You can export everything as JSON from Settings at any time. Tasks you complete are
                history: they stay in the queue and are never deleted by a shift.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="how-contribute" className="grid gap-4">
        <h2 id="how-contribute" className="font-display text-xl text-ink">
          Contribute
        </h2>
        <Card>
          <div className="flex gap-4">
            <GitBranch className="w-5 h-5 text-champagne shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 grid gap-4">
              <p className="text-sm text-slate">
                Genius Idiot is built in the open. If it saved you a bad week, the best way to say
                thanks is to send something back — a fix, a clearer paragraph, or a roadmap import
                that failed for you. The contributor guide covers the layering rules and the
                scheduling decisions that must not move.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sand px-4 py-2.5 font-medium text-ink transition hover:border-ink hover:bg-parchment"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  View the source
                </a>

                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sand px-4 py-2.5 font-medium text-ink transition hover:border-ink hover:bg-parchment"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-5 w-5 place-items-center rounded-md bg-[#0A66C2] text-white"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </span>
                  Connect on LinkedIn
                </a>

                <span className="inline-flex items-center gap-2 rounded-xl border border-sand px-3 py-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="grid h-5 w-5 place-items-center rounded-md bg-[#5865F2] text-white"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-slate">Discord</span>
                  <code className="font-mono text-[13px] text-ink">{DISCORD_HANDLE}</code>
                  <button
                    type="button"
                    onClick={copyDiscord}
                    aria-label={`Copy Discord username ${DISCORD_HANDLE}`}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate transition hover:bg-ivory hover:text-ink"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                  <span aria-live="polite" className="sr-only">
                    {copied ? 'Discord username copied' : ''}
                  </span>
                </span>
              </div>

              <p className="text-xs text-mist">
                Built by{' '}
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate underline underline-offset-4 hover:text-ink"
                >
                  Siddiq
                </a>
                . Questions, ideas or a broken import — find me on Discord at{' '}
                <span className="text-slate">{DISCORD_HANDLE}</span>.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {read ? (
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/">
            <Button>
              Go to today
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link
            to="/setup"
            className="text-sm text-slate hover:text-ink underline underline-offset-4"
          >
            Add another goal
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-champagne/40 bg-champagne/10 p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Read it? This screen only appears once.</p>
            <p className="mt-1 text-xs text-slate">
              Mark it as read to continue — you can reopen it any time from the menu.
            </p>
          </div>
          <Button onClick={confirm}>
            Mark as read and continue
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}

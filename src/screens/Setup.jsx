import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card, Input } from '../components/ui';
import MarkdownImporter from '../components/MarkdownImporter';
import TaskCardBuilder from '../components/TaskCardBuilder';
import QuickImport from '../components/QuickImport';
import ThemeToggle from '../components/ThemeToggle';

// Onboarding: create goals, import a roadmap for each, then continue.
export default function Setup() {
  const { authUser, goals, tasksByGoal, addGoal, importRoadmap, notify, today } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [selected, setSelected] = useState(goals[0]?.id ?? null);
  const [method, setMethod] = useState('cards');
  const [busy, setBusy] = useState(false);

  const selectedGoal = goals.find((goal) => goal.id === selected) ?? goals[0];
  const taskCount = (goalId) => tasksByGoal[goalId]?.length ?? 0;
  const ready = goals.length > 0 && goals.every((goal) => taskCount(goal.id) > 0);

  // Escape hatch: leave onboarding without adding any tasks.
  const later = () => {
    skipSetup(authUser.id);
    navigate('/');
  };

  const handleImport = async (tasks) => {
    if (!selectedGoal) return { ok: false };
    const res = await importRoadmap(selectedGoal.id, tasks);
    if (res.ok) {
      notify(
        `${tasks.length} task${tasks.length === 1 ? '' : 's'} added to ${selectedGoal.name}.`,
        'success',
      );
    }
    return res;
  };

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    const res = await addGoal({ name, daily_minutes: Number(minutes) });
    setBusy(false);
    if (res.ok) {
      setName('');
      setMinutes('60');
      setSelected(res.data.id);
    }
  };

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 lg:py-14">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-2xl text-ink tracking-tight">GENIUS IDIOT</p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={later}
              className="mt-1 text-xs text-slate hover:text-ink underline underline-offset-4 shrink-0"
            >
              Set up later
            </button>
          </div>
        </div>
        <h1 className="mt-6 font-display text-3xl text-ink">Set up your library</h1>
        <p className="mt-2 text-sm text-slate max-w-xl">
          One goal, one queue. Create a goal and import its roadmap — one task per day, no
          deadlines. You can add more goals later.
        </p>

        <Card className="mt-8">
          <form onSubmit={create} className="grid sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
            <Input
              label="Goal name"
              placeholder="DSA"
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              label="Daily minutes"
              type="number"
              min="5"
              max="600"
              required
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
            <Button type="submit" disabled={busy || !name.trim()}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add goal
            </Button>
          </form>
        </Card>

        {goals.length > 0 && (
          <Card className="mt-6">
            <h2 className="font-display text-xl text-ink">Import a roadmap</h2>
            <p className="mt-1 text-sm text-slate">
              Pick a goal, then build cards, paste Markdown, or paste any list. Every method uses a
              start date and one task per day.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {goals.map((goal) => {
                const active = selectedGoal?.id === goal.id;
                const done = taskCount(goal.id) > 0;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelected(goal.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition ${
                      active
                        ? 'bg-sand text-ink border-sand'
                        : 'bg-ivory text-ink border-sand hover:border-ink'
                    }`}
                  >
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-sage" aria-hidden="true" />}
                    {goal.name}
                    <span className="text-mist">
                      {taskCount(goal.id)}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedGoal && (
              <div className="mt-6">
                <div
                  role="tablist"
                  aria-label="Roadmap entry method"
                  className="mb-5 inline-flex gap-1 rounded-xl border border-sand bg-ivory p-1"
                >
                  {[
                    { id: 'cards', label: 'Card builder' },
                    { id: 'markdown', label: 'Markdown' },
                    { id: 'paste', label: 'Quick paste' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={method === tab.id}
                      onClick={() => setMethod(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition ${
                        method === tab.id
                          ? 'bg-sand text-ink'
                          : 'text-slate hover:text-ink'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {method === 'cards' && (
                  <TaskCardBuilder
                    key={`cards-${selectedGoal.id}`}
                    startDay={today}
                    importLabel={`Add to ${selectedGoal.name}`}
                    onImport={handleImport}
                  />
                )}
                {method === 'markdown' && (
                  <MarkdownImporter
                    key={`md-${selectedGoal.id}`}
                    startDay={today}
                    importLabel={`Import into ${selectedGoal.name}`}
                    onImport={handleImport}
                  />
                )}
                {method === 'paste' && (
                  <QuickImport
                    key={`paste-${selectedGoal.id}`}
                    startDay={today}
                    importLabel={`Add to ${selectedGoal.name}`}
                    onImport={handleImport}
                  />
                )}
              </div>
            )}
          </Card>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-mist">
            {ready
              ? 'Every goal has a roadmap. You are ready.'
              : 'Every goal needs at least one task before you continue.'}
          </p>
          <Button disabled={!ready} onClick={() => navigate('/')}>
            Go to today
          </Button>
        </div>
      </div>
    </main>
  );
}

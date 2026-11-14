import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card, Input } from '../components/ui';
import MarkdownImporter from '../components/MarkdownImporter';

// Onboarding: create goals, import a roadmap for each, then continue.
export default function Setup() {
  const { goals, tasksByGoal, addGoal, importRoadmap, notify } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [selected, setSelected] = useState(goals[0]?.id ?? null);
  const [busy, setBusy] = useState(false);

  const selectedGoal = goals.find((goal) => goal.id === selected) ?? goals[0];
  const taskCount = (goalId) => tasksByGoal[goalId]?.length ?? 0;
  const ready = goals.length > 0 && goals.every((goal) => taskCount(goal.id) > 0);

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
        <p className="font-display text-2xl text-ink tracking-tight">GENIUS IDIOT</p>
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
              Pick a goal, paste its Markdown, preview, then import.
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
                <MarkdownImporter
                  key={selectedGoal.id}
                  importLabel={`Import into ${selectedGoal.name}`}
                  onImport={async (tasks) => {
                    const res = await importRoadmap(selectedGoal.id, tasks);
                    if (res.ok) {
                      notify(
                        `${tasks.length} task${tasks.length === 1 ? '' : 's'} added to ${selectedGoal.name}.`,
                        'success',
                      );
                    }
                  }}
                />
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

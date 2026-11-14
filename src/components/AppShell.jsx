import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Flame, LogOut, Menu, Plus, Settings, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

function GoalNavItem({ goal, streak, onNavigate }) {
  return (
    <NavLink
      to={`/goal/${goal.id}`}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition ${
          isActive ? 'bg-sand text-ink' : 'text-ink hover:bg-parchment'
        }`
      }
    >
      <span className="truncate">{goal.name}</span>
      {streak?.current > 0 && (
        <span className="inline-flex items-center gap-0.5 text-xs tabular-nums text-champagne shrink-0">
          <Flame className="w-3 h-3" aria-hidden="true" />
          {streak.current}
        </span>
      )}
    </NavLink>
  );
}

function SidePanel({ onNavigate }) {
  const { goals, streaksByGoal, overallStreak } = useApp();
  return (
    <div className="flex flex-col gap-4 h-full">
      <nav aria-label="Goals" className="flex flex-col gap-1">
        {goals.length === 0 ? (
          <p className="text-sm text-slate px-3 py-2">No goals yet.</p>
        ) : (
          goals.map((goal) => (
            <GoalNavItem
              key={goal.id}
              goal={goal}
              streak={streaksByGoal[goal.id]}
              onNavigate={onNavigate}
            />
          ))
        )}
      </nav>

      <Link
        to="/setup"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate hover:text-ink"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        New goal
      </Link>

      <div className="mt-auto border-t border-sand pt-4">
        <p className="text-[13px] font-medium text-slate mb-1">Overall streak</p>
        <p className="inline-flex items-center gap-1.5 text-sm text-ink tabular-nums">
          <Flame className="w-4 h-4 text-champagne" aria-hidden="true" />
          {overallStreak.current} day{overallStreak.current === 1 ? '' : 's'}
          <span className="text-mist text-xs">· best {overallStreak.longest}</span>
        </p>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { authUser, demoMode, logOut } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setDrawerOpen(false);

  return (
    <div className="min-h-screen bg-ivory">
      <header className="h-16 sticky top-0 z-30 border-b border-sand bg-ivory/80 backdrop-blur">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-11 h-11 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-parchment"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="font-display text-lg text-ink tracking-tight">
              GENIUS IDIOT
            </Link>
            {demoMode && (
              <span className="hidden sm:inline text-[11px] uppercase tracking-wide text-mist">
                demo
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="hidden sm:block text-xs text-mist mr-2 max-w-[180px] truncate">
              {authUser?.email}
            </span>
            <Link
              to="/settings"
              aria-label="Settings"
              className="w-11 h-11 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-parchment"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logOut();
                navigate('/login');
              }}
              aria-label="Log out"
              className="w-11 h-11 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-parchment"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-sand min-h-[calc(100vh-4rem)] p-4">
          <SidePanel />
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-obsidian/40" onClick={close} />
            <div className="absolute inset-y-0 left-0 w-4/5 max-w-xs bg-ivory border-r border-sand p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-lg text-ink">GENIUS IDIOT</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-slate hover:text-ink hover:bg-parchment"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidePanel onNavigate={close} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:px-12 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

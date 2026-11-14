import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDay } from '../lib/dates';
import ThemeToggle from './ThemeToggle';

function MenuItem({ to, icon: Icon, label, onNavigate, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-obsidian text-linen shadow-card'
            : 'text-slate hover:bg-ivory hover:text-ink'
        }`
      }
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

function GoalNavItem({ goal, streak, onNavigate }) {
  return (
    <NavLink
      to={`/goal/${goal.id}`}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition ${
          isActive ? 'bg-ivory font-medium text-ink' : 'text-slate hover:bg-ivory hover:text-ink'
        }`
      }
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-sand bg-parchment text-[10px] font-semibold uppercase text-champagne">
        {goal.name.slice(0, 2)}
      </span>
      <span className="truncate">{goal.name}</span>
      {streak?.current > 0 && (
        <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-xs tabular-nums text-champagne">
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
    <div className="flex h-full min-h-0 flex-col gap-6">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-obsidian font-display text-lg text-linen">
          G
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg leading-tight text-ink">Genius Idiot</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-mist">
            Private library
          </span>
        </span>
      </Link>

      <nav aria-label="Main">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist">Menu</p>
        <div className="mt-2 grid gap-1">
          <MenuItem to="/" icon={LayoutDashboard} label="Dashboard" onNavigate={onNavigate} end />
          <MenuItem to="/setup" icon={Plus} label="New goal" onNavigate={onNavigate} />
          <MenuItem to="/settings" icon={Settings} label="Settings" onNavigate={onNavigate} />
        </div>
      </nav>

      <nav aria-label="Goals" className="flex min-h-0 flex-1 flex-col">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist">
          Your goals
        </p>
        <div className="mt-2 grid gap-1 overflow-y-auto pr-0.5">
          {goals.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-mist">No goals yet.</p>
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
        </div>
      </nav>

      <div className="mt-auto rounded-2xl bg-obsidian p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-linen/50">
            Overall streak
          </span>
          <Flame className="h-4 w-4 text-linen" aria-hidden="true" />
        </div>
        <p className="mt-2 font-display text-3xl leading-none text-linen tabular-nums">
          {overallStreak.current}
          <span className="ml-1 font-sans text-xs text-linen/50">
            day{overallStreak.current === 1 ? '' : 's'}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-linen/50">Best {overallStreak.longest} days</p>
        <p className="mt-3 border-t border-linen/10 pt-3 text-[11px] leading-relaxed text-linen/60">
          Missed days never become overdue debt.
        </p>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { authUser, demoMode, logOut, today } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setDrawerOpen(false);
  const initial = authUser?.email?.[0]?.toUpperCase() ?? 'G';

  return (
    <div className="min-h-screen bg-parchment">
      <div className="flex min-h-screen w-full flex-col bg-parchment sm:flex-row">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sand bg-parchment p-5 lg:flex xl:w-[272px]">
          <SidePanel />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-sand bg-parchment px-4 py-3 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden items-center gap-2 rounded-xl border border-sand bg-ivory px-3 py-2 sm:flex">
              <CalendarDays className="h-4 w-4 text-champagne" aria-hidden="true" />
              <span className="text-[13px] font-medium text-slate">{formatDay(today)}</span>
            </div>

            {demoMode && (
              <span className="rounded-full border border-champagne/40 bg-champagne/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-champagne">
                Demo
              </span>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <Link
                to="/settings"
                aria-label="Settings"
                className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink"
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
                className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="ml-1 flex items-center gap-2 rounded-full border border-sand bg-ivory py-1 pl-1 pr-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-obsidian text-[11px] font-semibold text-linen">
                  {initial}
                </span>
                <span className="hidden max-w-[150px] truncate text-xs text-slate md:block">
                  {authUser?.email}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-ivory">
            <div className="w-full px-4 py-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-obsidian/40" onClick={close} />
          <div className="absolute inset-y-0 left-0 w-4/5 max-w-xs border-r border-sand bg-parchment p-5">
            <div className="mb-4 flex items-center justify-end">
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(100vh-5.5rem)]">
              <SidePanel onNavigate={close} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

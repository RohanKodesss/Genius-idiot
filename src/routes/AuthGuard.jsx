import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BootLoader } from '../components/ui';
import { hasSkippedSetup } from '../lib/setupGate';
import { hasSeenGuide } from '../lib/guide';
import { Button } from '../components/ui';

function RecoveryScreen({ error, onRetry, data = false }) {
  const code = error?.code;
  const schemaMissing = ['PGRST205', 'PGRST204', '42P01', '42703'].includes(code);
  const detail = schemaMissing
    ? 'The Supabase database schema is missing or out of date. Run supabase/schema.sql in the Supabase SQL editor, then retry.'
    : error?.status === 401 || error?.status === 403
      ? 'Your session could not be verified. Try again, or sign in again if the problem continues.'
      : 'Check your connection and Supabase project settings, then try again.';

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ivory px-4 py-10">
      <section className="app-card w-full max-w-lg rounded-2xl p-6 sm:p-8" role="alert">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-bordeaux">
          {data ? 'Data unavailable' : 'Connection problem'}
        </p>
        <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">
          {schemaMissing ? 'Database setup needs attention' : 'We could not connect'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate">{detail}</p>
        {error?.message && !schemaMissing && (
          <p className="mt-3 break-words rounded-lg bg-ivory px-3 py-2 text-xs text-mist">
            {error.message}
          </p>
        )}
        {code && <p className="mt-2 font-mono text-xs text-mist">Error code: {code}</p>}
        <Button className="mt-6 w-full sm:w-auto" onClick={onRetry}>Try again</Button>
      </section>
    </main>
  );
}

// Boot loader while the session is unknown, /login when signed out, the guide
// for a user who has never read it, then the setup gate when a goal still has
// no roadmap (AGENTS.md §3 step 6). "Set up later" opts a user out of the gate
// for good; the guide only appears until it is marked as read.
export default function AuthGuard({ allowSetup = false }) {
  const {
    authUser,
    authLoadError,
    dataLoadError,
    loading,
    retrySession,
    reload,
    goals,
    tasksByGoal,
  } = useApp();
  const { pathname } = useLocation();

  if (authUser === undefined && authLoadError) {
    return <RecoveryScreen error={authLoadError} onRetry={retrySession} />;
  }
  if (authUser === undefined || (authUser && loading)) return <BootLoader />;
  if (!authUser) return <Navigate to="/welcome" replace />;
  if (dataLoadError) {
    return <RecoveryScreen error={dataLoadError} data onRetry={reload} />;
  }

  if (!hasSeenGuide(authUser.id) && pathname !== '/how-it-works') {
    return <Navigate to="/how-it-works" replace />;
  }

  const needsSetup =
    goals.length === 0 || goals.some((goal) => !(tasksByGoal[goal.id]?.length > 0));

  if (!allowSetup && needsSetup && !hasSkippedSetup(authUser.id)) {
    return <Navigate to="/setup" replace />;
  }
  return <Outlet />;
}

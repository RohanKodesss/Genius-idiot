import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BootLoader } from '../components/ui';
import { hasSkippedSetup } from '../lib/setupGate';
import { hasSeenGuide } from '../lib/guide';

// Boot loader while the session is unknown, /login when signed out, the guide
// for a user who has never read it, then the setup gate when a goal still has
// no roadmap (AGENTS.md §3 step 6). "Set up later" opts a user out of the gate
// for good; the guide only appears until it is marked as read.
export default function AuthGuard({ allowSetup = false }) {
  const { authUser, loading, goals, tasksByGoal } = useApp();
  const { pathname } = useLocation();

  if (authUser === undefined || (authUser && loading)) return <BootLoader />;
  if (!authUser) return <Navigate to="/login" replace />;

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

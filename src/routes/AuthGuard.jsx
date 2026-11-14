import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BootLoader } from '../components/ui';

// Boot loader while the session is unknown, /login when signed out, and the
// setup gate when a goal still has no roadmap (AGENTS.md §3 step 6).
export default function AuthGuard({ allowSetup = false }) {
  const { authUser, loading, goals, tasksByGoal } = useApp();

  if (authUser === undefined || (authUser && loading)) return <BootLoader />;
  if (!authUser) return <Navigate to="/login" replace />;

  const needsSetup =
    goals.length === 0 || goals.some((goal) => !(tasksByGoal[goal.id]?.length > 0));

  if (!allowSetup && needsSetup) return <Navigate to="/setup" replace />;
  return <Outlet />;
}

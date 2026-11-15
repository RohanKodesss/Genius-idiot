import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ToastViewport from './components/Toast';
import AuthGuard from './routes/AuthGuard';
import Login from './screens/Login';
import Setup from './screens/Setup';
import Today from './screens/Today';
import GoalDashboard from './screens/GoalDashboard';
import HowItWorks from './screens/HowItWorks';
import ResetPassword from './screens/ResetPassword';
import Settings from './screens/Settings';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<AuthGuard allowSetup />}>
          <Route path="/setup" element={<Setup />} />
          {/* Reachable before setup finishes, so new users can read it. */}
          <Route element={<AppShell />}>
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Route>
        </Route>

        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<Today />} />
            <Route path="/goal/:goalId" element={<GoalDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastViewport />
    </>
  );
}

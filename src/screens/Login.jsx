import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button, Input, Spinner } from '../components/ui';

export default function Login() {
  const { authUser, logIn, signUp } = useApp();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (authUser) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    const res = mode === 'login' ? await logIn(email, password) : await signUp(email, password);
    setBusy(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (res.needsConfirmation) {
      setNotice('Check your email to confirm the account, then log in.');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl text-ink tracking-tight text-center">
          GENIUS IDIOT
        </p>
        <p className="mt-2 text-sm text-slate text-center">
          Missed days never become overdue debt.
        </p>

        <form onSubmit={submit} className="mt-8 bg-parchment border border-sand rounded-2xl p-6 shadow-card grid gap-4">
          <h1 className="font-display text-xl text-ink">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <p role="alert" className="text-sm text-bordeaux">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-sage">
              {notice}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? <Spinner label="Working…" /> : mode === 'login' ? 'Log in' : 'Sign up'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
              setNotice('');
            }}
            className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
          </button>
        </form>
      </div>
    </main>
  );
}

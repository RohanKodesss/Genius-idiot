import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Input, Spinner } from '../components/ui';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const { authUser, logIn, signUp, resendConfirmation, demoMode } = useApp();
  // Account creation comes first: no account, no entry.
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  // Set after a signup that still needs the email confirmed.
  const [pendingEmail, setPendingEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

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
      if (res.needsConfirmation) setPendingEmail(email.trim());
      return;
    }
    if (res.needsConfirmation) {
      setPendingEmail(email.trim());
      return;
    }
    navigate('/', { replace: true });
  };

  const resend = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const res = await resendConfirmation(pendingEmail);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setCooldown(60);
    setNotice('New confirmation email sent.');
  };

  return (
    <main className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="fixed right-4 top-4">
        <ThemeToggle className="border-sand bg-parchment" />
      </div>
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl text-ink tracking-tight text-center">
          GENIUS IDIOT
        </p>
        <p className="mt-2 text-sm text-slate text-center">
          Missed days never become overdue debt.
        </p>

        {demoMode && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-xs text-terracotta text-center"
          >
            Demo mode — no real account is created and data stays in this browser.
          </p>
        )}

        {pendingEmail ? (
          <div className="mt-8 bg-parchment border border-sand rounded-2xl p-6 shadow-card grid gap-4">
            <MailCheck className="w-8 h-8 text-champagne" aria-hidden="true" />
            <h1 className="font-display text-xl text-ink">Confirm your email</h1>
            <p className="text-sm text-slate">
              We sent a confirmation link to <span className="text-ink">{pendingEmail}</span>. Open
              it to activate the account — until then the app will not let you in.
            </p>
            <p className="text-xs text-mist">
              Nothing arrived? Check spam, or send it again. Confirmation emails are limited to a
              couple per hour.
            </p>

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

            <Button type="button" onClick={resend} disabled={busy || cooldown > 0}>
              {busy ? (
                <Spinner label="Sending…" />
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                'Resend confirmation email'
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setPendingEmail('');
                setMode('login');
                setPassword('');
                setError('');
                setNotice('');
              }}
              className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              I confirmed it — log in
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingEmail('');
                setError('');
                setNotice('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              <ArrowLeft className="w-3 h-3" aria-hidden="true" />
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-8 bg-parchment border border-sand rounded-2xl p-6 shadow-card grid gap-4"
          >
            <h1 className="font-display text-xl text-ink">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-slate">
              {mode === 'signup'
                ? 'One account per email. You can only enter after you confirm the address.'
                : 'Log in with a confirmed account.'}
            </p>

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
            {mode === 'signup' && (
              <p className="text-xs text-mist -mt-2">At least 6 characters.</p>
            )}

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
              {busy ? (
                <Spinner label="Working…" />
              ) : mode === 'login' ? (
                'Log in'
              ) : (
                'Create account'
              )}
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
              {mode === 'login'
                ? 'Need an account? Create one'
                : 'Already have an account? Log in'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

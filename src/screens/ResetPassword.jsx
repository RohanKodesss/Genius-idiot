import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BootLoader, Button, Input, Spinner } from '../components/ui';

// Landing page for the Supabase recovery link. The link signs the user in with a
// short-lived recovery session, so a session is the proof that the link is valid.
export default function ResetPassword() {
  const { authUser, loading, demoMode, updatePassword } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  if (authUser === undefined || (authUser && loading)) return <BootLoader />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDone(true);
  };

  return (
    <main className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl text-ink tracking-tight text-center">GENIUS IDIOT</p>

        {!authUser ? (
          <div className="mt-8 bg-parchment border border-sand rounded-2xl p-6 shadow-card grid gap-4">
            <MailCheck className="w-8 h-8 text-champagne" aria-hidden="true" />
            <h1 className="font-display text-xl text-ink">Link expired or already used</h1>
            <p className="text-sm text-slate">
              This reset link is no longer valid. Reset links work once and expire quickly — request
              a fresh one and open it in this browser.
            </p>
            <Link to="/login">
              <Button className="w-full">Request a new link</Button>
            </Link>
          </div>
        ) : done ? (
          <div className="mt-8 bg-parchment border border-sand rounded-2xl p-6 shadow-card grid gap-4">
            <KeyRound className="w-8 h-8 text-sage" aria-hidden="true" />
            <h1 className="font-display text-xl text-ink">Password updated</h1>
            <p className="text-sm text-slate">
              {demoMode
                ? 'Demo mode accepts any password, so nothing was stored. The flow is here so you can see what a real project does.'
                : 'Use your new password the next time you log in. You are still signed in on this device.'}
            </p>
            <Button onClick={() => navigate('/', { replace: true })}>Go to today</Button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-8 bg-parchment border border-sand rounded-2xl p-6 shadow-card grid gap-4"
          >
            <h1 className="font-display text-xl text-ink">Set a new password</h1>
            <p className="text-sm text-slate">
              Signed in as <span className="text-ink">{authUser.email}</span>. Choose a password you
              have not used here before.
            </p>

            {demoMode && (
              <p
                role="status"
                className="rounded-xl border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-xs text-terracotta"
              >
                Demo mode — no real account exists, so no password is changed.
              </p>
            )}

            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            <p className="text-xs text-mist -mt-2">At least 6 characters.</p>

            {error && (
              <p role="alert" className="text-sm text-bordeaux">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy}>
              {busy ? <Spinner label="Saving…" /> : 'Update password'}
            </Button>

            <Link
              to="/login"
              className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              Back to log in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}

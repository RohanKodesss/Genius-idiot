import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BootLoader, Button, Input, Spinner } from '../components/ui';
import AuthLayout from '../components/AuthLayout';

// Landing page for the Supabase recovery link. The link arrives as a PKCE code,
// a token hash, or implicit tokens in the hash — `completePasswordRecovery`
// turns whichever one it is into a session, and that session is what unlocks the
// form below. A link with no session left is genuinely dead.
export default function ResetPassword() {
  const { authUser, loading, demoMode, completePasswordRecovery, updatePassword } = useApp();
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (authUser) {
      setChecking(false);
      return () => {
        active = false;
      };
    }
    (async () => {
      const res = await completePasswordRecovery();
      if (!active) return;
      if (!res.ok) setLinkError(res.message ?? '');
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [authUser, completePasswordRecovery]);

  if (authUser === undefined || (authUser && loading) || checking) return <BootLoader />;

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
    <AuthLayout>
        {!authUser ? (
          <div className="app-card mt-8 grid gap-4 rounded-2xl p-6 sm:p-7">
            <MailCheck className="w-8 h-8 text-champagne" aria-hidden="true" />
            <h1 className="font-display text-xl text-ink">This link is not active</h1>
            <p className="text-sm text-slate">
              {linkError ||
                'The reset link is no longer valid. Links work once and expire quickly.'}
            </p>
            <p className="text-xs text-mist">
              Reset links only work in the browser you requested them from, and only until they are
              used. Request a fresh one and open it in this same browser.
            </p>
            <Link to="/login?mode=login">
              <Button className="w-full">Request a new link</Button>
            </Link>
          </div>
        ) : done ? (
          <div className="app-card mt-8 grid gap-4 rounded-2xl p-6 sm:p-7">
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
            className="app-card mt-8 grid gap-4 rounded-2xl p-6 sm:p-7"
          >
            <h1 className="font-display text-2xl tracking-tight text-ink sm:text-[28px]">Set a new password</h1>
            <p className="text-[15px] leading-6 text-slate">
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
              to="/login?mode=login"
              className="text-xs text-slate hover:text-ink underline underline-offset-4 justify-self-center"
            >
              Back to log in
            </Link>
          </form>
        )}
    </AuthLayout>
  );
}

import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';

const promises = [
  'One clear task for each goal',
  'Missed days move the queue forward',
  'Rest days can count toward your streak',
];

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-ivory lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(460px,0.92fr)]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-obsidian px-10 py-10 text-linen lg:flex xl:px-16 xl:py-12">
        <div className="absolute -bottom-40 -right-32 h-[540px] w-[540px] rounded-full border border-linen/10" aria-hidden="true">
          <div className="absolute inset-12 rounded-full border border-linen/10" />
          <div className="absolute inset-24 rounded-full border border-linen/10" />
          <div className="absolute inset-[42%] rounded-full bg-champagne/20" />
        </div>
        <Link to="/welcome" className="relative flex items-center gap-3 group">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white transition group-hover:scale-[1.02]">
            <BrandLogo className="h-full w-full" />
          </span>
          <span className="font-display text-xl tracking-tight text-linen">Genius Idiot</span>
        </Link>
        <div className="relative max-w-[620px] py-16">
          <p className="text-sm font-semibold tracking-wide text-linen/60">A learning library for the long game</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.06] tracking-tight text-linen xl:text-6xl">
            Keep learning,<br />one day at a time.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-linen/70">
            Build a routine that keeps its shape when life gets busy. Your goals stay separate, and your daily load stays manageable.
          </p>
          <ul className="mt-9 grid gap-4">
            {promises.map((promise) => (
              <li key={promise} className="flex items-center gap-3 text-sm text-linen/85">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-linen/20 bg-linen/8 text-linen">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {promise}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-linen/45">Private by design · Built for steady progress</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-8 lg:px-12">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle className="border-sand bg-parchment" />
        </div>
        <div className="w-full max-w-[440px]">
          <div className="mb-8 text-center lg:hidden">
            <div className="flex items-center justify-center gap-2">
              <BrandLogo className="h-9 w-9 rounded-lg bg-white" />
              <p className="font-display text-2xl tracking-tight text-ink">Genius Idiot</p>
            </div>
            <p className="mt-1 text-sm text-slate">Keep learning, one day at a time.</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

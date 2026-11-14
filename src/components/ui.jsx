// Shared primitives (UI_SPEC §2.2, §9). Dumb components: props only.
import { Loader2 } from 'lucide-react';

export function Button({ variant = 'primary', className = '', children, ...props }) {
  const styles = {
    primary:
      'bg-champagne text-parchment hover:bg-champagne-light active:scale-[0.98]',
    secondary:
      'bg-transparent text-ink border border-sand hover:border-ink hover:bg-ivory',
    ghost: 'text-slate text-sm hover:text-ink underline-offset-4 hover:underline',
    danger:
      'bg-transparent text-bordeaux border border-bordeaux/30 hover:bg-bordeaux/5',
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, id, className = '', ...props }) {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-slate mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={`w-full bg-ivory border border-sand rounded-xl px-4 py-2.5 text-[15px] text-ink placeholder:text-mist focus:border-champagne focus:ring-2 focus:ring-champagne/20 transition ${
          error ? 'border-bordeaux' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-err`} className="text-xs text-bordeaux mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({ label, id, children, ...props }) {
  const selectId = id ?? `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="block text-[13px] font-medium text-slate mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="w-full bg-ivory border border-sand rounded-xl px-3 py-2.5 text-[15px] text-ink focus:border-champagne focus:ring-2 focus:ring-champagne/20"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Card({ className = '', children }) {
  return (
    <div className={`bg-parchment rounded-2xl p-6 border border-sand shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-sand/60 ${className}`} />;
}

export function EmptyState({ icon: Icon, headline, helper, action, tone = 'default' }) {
  return (
    <div className="text-center py-16">
      {Icon && (
        <div
          className={`w-12 h-12 mx-auto rounded-full border flex items-center justify-center ${
            tone === 'error'
              ? 'bg-bordeaux/10 border-bordeaux/30 text-bordeaux'
              : 'bg-parchment border-sand text-slate'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      {headline && <h2 className="font-display text-xl text-ink mt-4">{headline}</h2>}
      {helper && <p className="text-sm text-slate max-w-sm mx-auto mt-2">{helper}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    champagne: 'bg-champagne/15 text-champagne',
    sage: 'bg-sage/10 text-sage',
    terracotta: 'bg-terracotta/10 text-terracotta',
    bordeaux: 'bg-bordeaux/10 text-bordeaux',
    neutral: 'bg-sand/60 text-slate',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Divider() {
  return <hr className="border-0 border-t border-sand" />;
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

export function BootLoader() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center gap-6">
      <p className="font-display text-2xl text-ink tracking-tight">GENIUS IDIOT</p>
      <div className="flex gap-1.5" role="status" aria-label="Loading">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-champagne animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

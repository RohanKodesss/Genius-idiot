import { Flame } from 'lucide-react';

export default function StreakBadge({ days, label = 'days' }) {
  if (!days) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/25 bg-terracotta/10 px-2.5 py-1 text-xs font-medium tabular-nums text-terracotta">
      <Flame className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
      {days} {label}
    </span>
  );
}

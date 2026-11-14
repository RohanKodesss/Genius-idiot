import { Flame } from 'lucide-react';

export default function StreakBadge({ days, label = 'days' }) {
  if (!days) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-champagne/15 text-champagne px-2.5 py-1 text-xs font-medium tabular-nums">
      <Flame className="w-3 h-3" aria-hidden="true" />
      {days} {label}
    </span>
  );
}

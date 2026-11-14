// Circular progress for today's minutes (SVG, no library).
export default function ProgressRing({ value, max, size = 96, label, tone = 'light' }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const palette =
    tone === 'dark'
      ? { track: 'rgba(255,255,255,0.18)', stroke: '#8FD6AE', text: 'text-parchment' }
      : { track: '#E6E7E3', stroke: '#1F6A4C', text: 'text-ink' };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? `${value} of ${max} minutes`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={palette.track} strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className="transition-all duration-500"
        />
      </svg>
      <span className={`absolute font-sans text-sm font-semibold tabular-nums ${palette.text}`}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

// Circular progress for today's minutes (SVG, no library).
export default function ProgressRing({ value, max, size = 96, label }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;

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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2E2E35" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#C6A55C"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute font-sans text-sm font-semibold tabular-nums text-ink">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

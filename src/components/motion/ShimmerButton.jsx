/** CTA with a single, restrained highlight on hover. */
export default function ShimmerButton({
  children,
  onClick,
  disabled = false,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.18)',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-champagne px-7 py-3.5 font-semibold text-parchment shadow-card transition duration-200 hover:-translate-y-0.5 hover:bg-champagne-light active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-full -translate-x-full rotate-12 transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:transition-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

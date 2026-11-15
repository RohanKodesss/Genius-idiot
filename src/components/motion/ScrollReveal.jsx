/** Keeps the existing page composition wrapper without hiding content during scroll. */
export default function ScrollReveal({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

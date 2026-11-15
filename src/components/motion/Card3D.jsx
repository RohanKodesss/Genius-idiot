/** Stable surface wrapper retained for existing imports; cards stay flat and still. */
export default function Card3D({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

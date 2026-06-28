export default function HypometroIcon({ variant = 'ok', size = 32 }) {
  return (
    <span className={`hypo-icon ${variant}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img" focusable="false">
        <g className="sofa-base" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 35V25c0-5 4-9 9-9h14c5 0 9 4 9 9v10" />
          <path d="M13 35h38c3 0 5 2 5 5v8H8v-8c0-3 2-5 5-5Z" />
          <path d="M15 48v5" />
          <path d="M49 48v5" />
          <path d="M22 35v-6" />
          <path d="M42 35v-6" />
        </g>

        {variant === 'galactico' && (
          <g className="hypo-mark" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 18c12-10 30-10 42 0" strokeWidth="2.5" opacity="0.95" />
            <path d="M18 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" fill="currentColor" strokeWidth="0" />
            <circle cx="50" cy="15" r="3" fill="currentColor" strokeWidth="0" />
          </g>
        )}

        {variant === 'quente' && (
          <g className="hypo-mark" fill="none" stroke="currentColor" strokeLinecap="round">
            <path d="M22 12h20" strokeWidth="3" />
            <path d="M16 18h32" strokeWidth="2.5" opacity="0.85" />
            <path d="M28 8h8" strokeWidth="3" opacity="0.75" />
          </g>
        )}

        {variant === 'ok' && (
          <g className="hypo-mark" fill="none" stroke="currentColor" strokeLinecap="round">
            <path d="M23 14h18" strokeWidth="3" opacity="0.9" />
            <path d="M27 20h10" strokeWidth="2.5" opacity="0.65" />
          </g>
        )}

        {variant === 'frio' && (
          <g className="hypo-mark" fill="none" stroke="currentColor" strokeLinecap="round">
            <path d="M18 18h28" strokeWidth="3" opacity="0.42" />
            <path d="M24 24h16" strokeWidth="2.5" opacity="0.30" />
            <path d="M17 54h30" strokeWidth="3" opacity="0.45" />
          </g>
        )}
      </svg>
    </span>
  );
}

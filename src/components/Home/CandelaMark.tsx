// Projeto Candela's mark, redrawn: a light bulb with a gold crystal inside.
export default function CandelaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g stroke="#c9a54a" strokeWidth="2.4" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="8" />
        <line x1="17" y1="8" x2="19.5" y2="12" />
        <line x1="47" y1="8" x2="44.5" y2="12" />
        <line x1="7" y1="19" x2="11.5" y2="21" />
        <line x1="57" y1="19" x2="52.5" y2="21" />
        <line x1="5" y1="32" x2="10" y2="32" />
        <line x1="59" y1="32" x2="54" y2="32" />
      </g>
      <path
        d="M27 37 L27.5 27 L29.5 30 L31 18.5 L33 27.5 L35 22.5 L36.5 31 L37 37 Z"
        fill="#d8b65a"
        stroke="#a8842e"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M26 44 C26 39 19 36.5 19 27 A13 13 0 1 1 45 27 C45 36.5 38 39 38 44 Z" />
        <line x1="26.5" y1="48" x2="37.5" y2="48" />
        <line x1="26.5" y1="52" x2="37.5" y2="52" />
        <line x1="28.5" y1="56" x2="35.5" y2="56" />
      </g>
    </svg>
  );
}

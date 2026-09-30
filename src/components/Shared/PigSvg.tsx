// Merlita. Drawn once, walked on /story (the porca figure) and, when someone
// types her name, across the whole site.
function PigSvg() {
  return (
    <svg viewBox="0 0 140 90" className="pig__svg" aria-hidden="true">
      <g className="pig__tail">
        <path d="M24 44 C 12 42, 8 30, 17 27 C 26 25, 24 37, 14 35" />
      </g>
      <g className="pig__legs">
        <rect className="pig__leg pig__leg--a" x="38" y="58" width="9" height="22" rx="4" />
        <rect className="pig__leg pig__leg--b" x="54" y="58" width="9" height="22" rx="4" />
        <rect className="pig__leg pig__leg--a" x="76" y="58" width="9" height="22" rx="4" />
        <rect className="pig__leg pig__leg--b" x="92" y="58" width="9" height="22" rx="4" />
      </g>
      <ellipse className="pig__body" cx="66" cy="46" rx="42" ry="26" />
      <polygon className="pig__ear" points="94,26 100,6 111,27" />
      <polygon className="pig__ear" points="111,24 123,9 125,30" />
      <circle className="pig__body" cx="108" cy="41" r="19" />
      <ellipse className="pig__snout" cx="124" cy="45" rx="9" ry="7" />
      <circle className="pig__nostril" cx="121" cy="45" r="1.6" />
      <circle className="pig__nostril" cx="127" cy="45" r="1.6" />
      <circle className="pig__eye" cx="109" cy="35" r="2.4" />
    </svg>
  );
}

export default PigSvg;

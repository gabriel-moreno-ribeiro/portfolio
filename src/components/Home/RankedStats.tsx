import { useEffect, useRef, useState } from 'react';
import { useLocalData } from '../../lib/data';
import { Counter, useVisible } from '../../lib/motion';

// Proof in the "N of M" form. Every figure exists in the repo data; the numeric ones
// are read from numbers.json, the rest are quoted from the file named beside them.
function RankedStats() {
  const { numbers } = useLocalData();
  const ref = useRef<HTMLUListElement>(null);
  const seen = useVisible(ref, { once: true });
  // The count waits for the loading screen to start sliding away, or it would finish unseen.
  // shortcut: 1400ms mirrors MIN_MS - SLIDE_MS in lib/preloader.ts; have the preloader emit an event if that timing changes.
  const [uncovered, setUncovered] = useState(() => !document.getElementById('preloader'));
  useEffect(() => {
    if (uncovered) return;
    const id = window.setTimeout(() => setUncovered(true), Math.max(0, 1400 - performance.now()) + 200);
    return () => window.clearTimeout(id);
  }, [uncovered]);

  const num = (id: string) => numbers.find((n) => n.id === id)?.value ?? 0;

  const stats = [
    // experience.json (estudar): "About 70 fellows picked from 10,000+ applicants"
    { n: 70, prefix: '~', of: 'of 10,000+', label: 'Fundação Estudar fellows' },
    // numbers.json (startups) + projects.ts: "One of 6 startups in the Canastra Ventures AI Residency"
    { n: 1, of: `of ${num('startups')}`, label: 'startups in the Canastra AI Residency' },
    // numbers.json (sat): 1570, "SAT / 1600"; llms.txt: "above the 99th percentile"
    { n: num('sat'), of: 'of 1600', label: 'SAT score, top 1% in the world' },
    // numbers.json: medals 28 (sub "19 gold"), competitions 38 (label "olympiads")
    { n: num('medals'), of: 'medals', label: `in ${num('competitions')} science olympiads, 19 gold` },
  ];

  return (
    <ul className="ranked-stats" ref={ref} aria-label="Rankings">
      {stats.map(({ n, prefix = '', of, label }) => {
        const final = `${prefix}${n}`;
        return (
          <li className="ranked-stats__item" key={label}>
            <p className="ranked-stats__rank" aria-hidden="true">
              {/* Counting 1 to 1 is no animation: small ranks are plain text. A counting
                  figure sits in a fixed box so it never moves its neighbours. */}
              <span className="ranked-stats__n" style={n > 1 ? { minWidth: `${(final.length * 0.5).toFixed(2)}em` } : undefined}>
                {n > 1 ? <Counter value={n} prefix={prefix} grouping={false} start={seen && uncovered} /> : final}
              </span>
              <span className="ranked-stats__of">{of}</span>
            </p>
            <p className="ranked-stats__label" aria-hidden="true">{label}</p>
            <span className="sr-only">
              {final} {of} {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default RankedStats;

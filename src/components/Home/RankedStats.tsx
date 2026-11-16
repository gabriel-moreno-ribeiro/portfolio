import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useLocalData } from '../../lib/data';
import { Counter, useReducedMotion, useVisible } from '../../lib/motion';

// Proof in the "N of M" form. Every figure exists in the repo data; the numeric ones
// are read from numbers.json, the rest are quoted from the file named beside them.
const TILT = 5; // degrees at the edge of the row

function RankedStats() {
  const { numbers } = useLocalData();
  const reduced = useReducedMotion();
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
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });

  const num = (id: string) => numbers.find((n) => n.id === id)?.value ?? 0;

  const stats = [
    // experience.json (estudar): "About 70 fellows picked from 10,000+ applicants"
    { n: 70, prefix: '~', of: '10,000+', label: 'Fundação Estudar fellows' },
    // numbers.json (startups) + projects.ts: "One of 6 startups in the Canastra Ventures AI Residency"
    { n: 1, of: String(num('startups')), label: 'startups, Canastra AI Residency' },
    // numbers.json (sat): 1570, "SAT / 1600"
    { n: num('sat'), of: '1600', label: 'SAT' },
    // numbers.json (medals): 28, sub "19 gold"
    { n: 19, of: String(num('medals')), label: 'olympiad medals, gold' },
    // portfolioData.ts: "Insper, Computer Engineering (1st place)" — no denominator in the data, so none shown
    { n: 1, suffix: 'st', label: 'place, Insper Computer Engineering' },
  ];

  // Depth on pointer: the row leans a few degrees toward a mouse. Transform only,
  // and it only runs while the pointer is over the row.
  const tilt = (e: PointerEvent<HTMLUListElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * TILT);
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -2 * TILT);
  };
  const rest = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.ul
      className="ranked-stats"
      ref={ref}
      aria-label="Rankings"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={tilt}
      onPointerLeave={rest}
    >
      {stats.map(({ n, prefix = '', suffix = '', of, label }) => {
        const final = `${prefix}${n}${suffix}`;
        return (
          <li className="ranked-stats__item" key={label}>
            <p className="ranked-stats__rank" aria-hidden="true">
              {/* Counting 1 to 1 is no animation: small ranks are plain text. A counting
                  figure sits in a fixed box so it never moves its neighbours. */}
              <span className="ranked-stats__n" style={n > 1 ? { width: `${final.length}ch` } : undefined}>
                {n > 1 ? (
                  <Counter value={n} prefix={prefix} suffix={suffix} grouping={false} start={seen && uncovered} />
                ) : (
                  final
                )}
              </span>
              {of && <span className="ranked-stats__of">of {of}</span>}
            </p>
            <p className="ranked-stats__label" aria-hidden="true">{label}</p>
            <span className="sr-only">
              {final}{of ? ` of ${of}` : ''} {label}
            </span>
          </li>
        );
      })}
    </motion.ul>
  );
}

export default RankedStats;

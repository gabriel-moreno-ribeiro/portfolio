import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePageVisible, useReducedMotion, useVisible } from "../../lib/motion";
import NumberStatsCard from "./NumberStatsCard";

const STATS = [
  { img: '/stats/obfep.webp', imgPadding: 6, value: 39, label: 'olympiad medals (19 gold)' },
  { img: '/stats/screwdriver.webp', imgPadding: 18, value: 3392, label: 'students reached (Projeto Candela)' },
  { img: '/stats/sat.webp', imgPadding: 18, prefix: 'SAT ', value: 1510, grouping: false, label: '/ 1600 (Top 1% Brazil)' },
  { img: '/stats/fe.webp', imgPadding: 4, value: 0.7, decimals: 1, suffix: '%', label: 'acceptance rate, Fundação Estudar' },
];

// Counts from 0 to value over ~1.1s with an ease-out; restarts whenever value changes.
function CountUp({ value, decimals = 0, grouping = true, still = false }: { value: number; decimals?: number; grouping?: boolean; still?: boolean }) {
  const [n, setN] = useState(still ? value : 0);
  useEffect(() => {
    if (still) { setN(value); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, still]);
  return <>{n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping })}</>;
}

const NumbersAndStats = () => {
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useVisible(sectionRef);
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();
  const [held, setHeld] = useState(false);

  // The rotation only runs while the section is on screen, the tab is visible and
  // nobody is pointing at it; never with reduced motion.
  useEffect(() => {
    if (!inView || !pageVisible || held || reduced) return;
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % STATS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [inView, pageVisible, held, reduced]);

  const stat = STATS[index];

  return (
    <div
      className="numbers-and-stats"
      id="numbers"
      ref={sectionRef}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
    >
      <div className="center-text">
        <h2 className="section-title">By the <em>Numbers</em></h2>
      </div>
      <div className="card-container">
        <AnimatePresence initial={false}>
          <NumberStatsCard
            key={index}
            frontCard={true}
            imgSrc={stat.img}
            imgPadding={stat.imgPadding}
          />
          <NumberStatsCard key={index + 1} frontCard={false} />
        </AnimatePresence>
      </div>
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="card-text"
        aria-hidden="true"
      >
        <span className="orange"> {stat.prefix}<CountUp value={stat.value} decimals={stat.decimals} grouping={stat.grouping} still={reduced} />{stat.suffix} </span>
        {stat.label}
      </motion.p>
      {/* The card shows one at a time; the page carries all four */}
      <ul className="sr-only">
        {STATS.map((s) => (
          <li key={s.label}>{s.prefix}{s.value.toLocaleString('en-US', { minimumFractionDigits: s.decimals ?? 0, useGrouping: s.grouping ?? true })}{s.suffix} {s.label}</li>
        ))}
      </ul>
    </div>
  );
};

export default NumbersAndStats;

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import NumberStatsCard from "./NumberStatsCard";

const STATS = [
  { img: '/stats/obfep.webp', imgPadding: 6, value: 39, label: 'olympiad medals (19 gold)' },
  { img: '/stats/screwdriver.webp', imgPadding: 18, value: 3392, label: 'students reached (Projeto Candela)' },
  { img: '/stats/sat.webp', imgPadding: 18, prefix: 'SAT ', value: 1510, label: '/ 1600 (Top 1% Brazil)' },
  { img: '/stats/fe.webp', imgPadding: 4, value: 0.7, decimals: 1, suffix: '%', label: 'acceptance rate, Fundação Estudar' },
];

// Counts from 0 to value over ~1.1s with an ease-out; restarts whenever value changes.
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

const NumbersAndStats = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % STATS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stat = STATS[index];

  return (
    <div className="numbers-and-stats">
      <div className="center-text">
        <p className="text-p">By the Numbers</p>
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
      >
        <span className="orange"> {stat.prefix}<CountUp value={stat.value} decimals={stat.decimals} />{stat.suffix} </span>
        {stat.label}
      </motion.p>
    </div>
  );
};

export default NumbersAndStats;

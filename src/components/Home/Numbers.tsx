import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import NumberStatsCard from "./NumberStatsCard";

const STATS = [
  {
    img: '/stats/obfep.webp',
    imgPadding: 6,
    text: `<span class="orange"> 39 </span>Olympiad Medals (19 Gold)`,
  },
  {
    img: '/stats/screwdriver.webp',
    imgPadding: 18,
    text: `<span class="orange"> 3,392 </span>Students Impacted (Projeto Candela)`,
  },
  {
    img: '/stats/sat.webp',
    imgPadding: 18,
    text: `<span class="orange"> SAT 1510 </span>/ 1600 (Top 1% Brazil)`,
  },
  {
    img: '/stats/fe.webp',
    imgPadding: 4,
    text: `<span class="orange"> 0.7% </span>Acceptance — Fundação Estudar`,
  },
];

const NumbersAndStats = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % STATS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
            imgSrc={STATS[index].img}
            imgPadding={STATS[index].imgPadding}
          />
          <NumberStatsCard key={index + 1} frontCard={false} />
        </AnimatePresence>
      </div>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="card-text"
        dangerouslySetInnerHTML={{ __html: STATS[index].text }}
      />
    </div>
  );
};

export default NumbersAndStats;

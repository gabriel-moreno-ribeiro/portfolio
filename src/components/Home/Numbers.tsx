import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import d_appstore from "../../assets/numbers/dark/appstore.webp";
import d_jira from "../../assets/numbers/dark/jira.webp";
import d_safari from "../../assets/numbers/dark/safari.webp";
import d_youtube from "../../assets/numbers/dark/youtube.webp";
import l_appstore from "../../assets/numbers/light/appstore.webp";
import l_jira from "../../assets/numbers/light/jira.webp";
import l_safari from "../../assets/numbers/light/safari.webp";
import l_youtube from "../../assets/numbers/light/youtube.webp";
import { useThemeStore } from "../../store/themeStore";
import NumberStatsCard from "./NumberStatsCard";

const NumbersAndStats = () => {
  const [index, setIndex] = useState(0);
  const { darkMode } = useThemeStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const dataArray = useMemo(() => {
    if (!darkMode) {
      return [
        {
          imgUrl: l_safari,
          text: `<span class="orange"> 39 </span>Olympiad Medals (19 Gold)`,
        },
        {
          imgUrl: l_jira,
          text: `<span class="orange"> 1,900+ </span>Students Impacted (PIBIC Jr)`,
        },
        {
          imgUrl: l_appstore,
          text: `<span class="orange"> SAT 1510 </span>/ 1600 (Top 1% Brazil)`,
        },
        {
          imgUrl: l_youtube,
          text: `<span class="orange"> 0.7% </span>Acceptance — Fundacao Estudar`,
        },
      ];
    }
    return [
      {
        imgUrl: d_safari,
        text: `<span class="orange"> 39 </span>Olympiad Medals (19 Gold)`,
      },
      {
        imgUrl: d_jira,
        text: `<span class="orange"> 1,900+ </span>Students Impacted (PIBIC Jr)`,
      },
      {
        imgUrl: d_appstore,
        text: `<span class="orange"> SAT 1510 </span>/ 1600 (Top 1% Brazil)`,
      },
      {
        imgUrl: d_youtube,
        text: `<span class="orange"> 0.7% </span>Acceptance — Fundacao Estudar`,
      },
    ];
  }, [darkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % dataArray.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [dataArray]);

  return (
    <motion.div ref={containerRef} className="numbers-and-stats">
      <div className="center-text">
        <p className="text-p" data-fun="flexing a little bit here">Some Of My Interesting Stats</p>
      </div>
      <motion.div className="card-container">
        <AnimatePresence initial={false}>
          <NumberStatsCard
            key={index}
            frontCard={true}
            exitX={250}
            imgSrc={dataArray[index].imgUrl}
          />
          <NumberStatsCard key={index + 1} frontCard={false} exitX={-250} />
        </AnimatePresence>
      </motion.div>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="card-text"
        dangerouslySetInnerHTML={{ __html: dataArray[index].text }}
      />
    </motion.div>
  );
};

export default NumbersAndStats;

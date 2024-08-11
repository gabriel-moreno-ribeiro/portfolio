import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
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

gsap.registerPlugin(ScrollTrigger);

const NumbersAndStats = () => {
  const [index, setIndex] = useState(0);
  const { darkMode } = useThemeStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const dataArray = useMemo(() => {
    if (!darkMode) {
      return [
        {
          imgUrl: l_safari,
          text: `<span class="orange"> 30+ </span>Freelance Clients`,
        },
        {
          imgUrl: l_jira,
          text: `<span class="orange"> 300+ </span>Tickets & Features`,
        },
        {
          imgUrl: l_appstore,
          text: `<span class="orange"> 5,000+ </span>App Downloads`,
        },
        {
          imgUrl: l_youtube,
          text: `<span class="orange"> 100,000+ </span>Youtube Views`,
        },
      ];
    }
    return [
      {
        imgUrl: d_safari,
        text: `<span class="orange"> 30+ </span>Freelance Clients`,
      },
      {
        imgUrl: d_jira,
        text: `<span class="orange"> 300+ </span>Tickets & Features`,
      },
      {
        imgUrl: d_appstore,
        text: `<span class="orange"> 5,000+ </span>App Downloads`,
      },
      {
        imgUrl: d_youtube,
        text: `<span class="orange"> 100,000+ </span>Youtube Views`,
      },
    ];
  }, [darkMode]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const containerHeight = containerRef.current.clientHeight / 1.5;
    const scrollStep = containerHeight / dataArray.length;

    dataArray.forEach((_, index) => {
      if (!containerRef.current) return;

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: `top+=${index * scrollStep}px top`,
        end: `top+=${index * scrollStep}px top`,
        onEnter: () => setIndex(index),
        onEnterBack: () => setIndex(index),
        markers: false, // Set to true if you want to debug the scroll points
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [dataArray]);

  return (
    <motion.div ref={containerRef} className="numbers-and-stats">
      <div className="center-text">
        <p className="text-p">Some Of My Interesting Stats</p>
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

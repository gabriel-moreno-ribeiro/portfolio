import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const NumbersAndStats = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const textArr = [
    "30+ Freelance Clients",
    "300+ Tickets & Features",
    "5,000+ App Downloads",
    "100,000+ Youtube Views",
  ];

  return (
    <div className="numbers-and-stats-wrapper">
      <motion.div
        className="numbers-and-stats"
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 1 } },
        }}
      >
        <div className="center-text">
          <p className="text-p">Some of my stats</p>
        </div>
        {textArr.map((text, i) => (
          <motion.div
            className="text-section"
            key={i}
            variants={textVariants(i * 100)}
          >
            <p className="text-p">{text}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const textVariants = (delay: number) => ({
  hidden: { opacity: 0, y: 300 },
  visible: { opacity: 1, y: 0, transition: { delay: delay / 80, duration: 1 } },
});

export default NumbersAndStats;

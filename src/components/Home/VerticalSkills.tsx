import { motion, Transition, useAnimation, useInView } from "framer-motion";
import React, { useEffect, useMemo, useRef } from "react";
import l_icon1 from "../../assets/skills/light/icon1.webp";
import l_icon10 from "../../assets/skills/light/icon10.webp";
import l_icon11 from "../../assets/skills/light/icon11.webp";
import l_icon12 from "../../assets/skills/light/icon12.webp";
import l_icon13 from "../../assets/skills/light/icon13.webp";
import l_icon2 from "../../assets/skills/light/icon2.webp";
import l_icon3 from "../../assets/skills/light/icon3.webp";
import l_icon4 from "../../assets/skills/light/icon4.webp";
import l_icon5 from "../../assets/skills/light/icon5.webp";
import l_icon6 from "../../assets/skills/light/icon6.webp";
import l_icon7 from "../../assets/skills/light/icon7.webp";
import l_icon8 from "../../assets/skills/light/icon8.webp";
import l_icon9 from "../../assets/skills/light/icon9.webp";

import d_icon1 from "../../assets/skills/dark/icon1.webp";
import d_icon10 from "../../assets/skills/dark/icon10.webp";
import d_icon11 from "../../assets/skills/dark/icon11.webp";
import d_icon12 from "../../assets/skills/dark/icon12.webp";
import d_icon13 from "../../assets/skills/dark/icon13.webp";
import d_icon2 from "../../assets/skills/dark/icon2.webp";
import d_icon3 from "../../assets/skills/dark/icon3.webp";
import d_icon4 from "../../assets/skills/dark/icon4.webp";
import d_icon5 from "../../assets/skills/dark/icon5.webp";
import d_icon6 from "../../assets/skills/dark/icon6.webp";
import d_icon7 from "../../assets/skills/dark/icon7.webp";
import d_icon8 from "../../assets/skills/dark/icon8.webp";
import d_icon9 from "../../assets/skills/dark/icon9.webp";
import { useThemeStore } from "../../store/themeStore";

const lightIcons = [
  l_icon1,
  l_icon2,
  l_icon3,
  l_icon4,
  l_icon5,
  l_icon6,
  l_icon7,
  l_icon8,
  l_icon9,
  l_icon10,
  l_icon11,
  l_icon12,
  l_icon13,
];

const darkIcons = [
  d_icon1,
  d_icon2,
  d_icon3,
  d_icon4,
  d_icon5,
  d_icon6,
  d_icon7,
  d_icon8,
  d_icon9,
  d_icon10,
  d_icon11,
  d_icon12,
  d_icon13,
];

const skillNames = [
  "PostgreSQL",
  "JavaScript",
  "TypeScript",
  "Django",
  "Python",
  "MySql",
  "Flutter",
  "Google Cloud",
  "Next",
  "Github",
  "Nest",
  "Firebase",
  "React",
];

const progress = [70, 90, 80, 70, 90, 70, 80, 70, 70, 90, 70, 80, 70];

const initialPosition = {
  x: 0,
  y: -100,
};

const bubbleVariants: Transition = {
  initial: { scale: 0 },
  animate: (i: number) => ({
    scale: [0, 1.5, 1],
    x: [initialPosition.x, 0],
    y: [initialPosition.y, i * 20],
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeInOut",
    },
  }),
};

const VerticalSkills: React.FC = () => {
  const { darkMode } = useThemeStore();
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    margin: "0px 0px -200px 0px",
    once: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start((i) => bubbleVariants.animate(i));
    }
  }, [controls, inView]);

  const icons = useMemo(() => {
    return darkMode ? darkIcons : lightIcons;
  }, [darkMode]);

  return (
    <div className="vertical-skills-container" ref={ref}>
      <h1 className="heading">Variable Skillset.</h1>
      {icons.map((icon, i) => (
        <motion.div
          className="bubble-row"
          custom={i}
          initial="initial"
          animate={controls}
          variants={bubbleVariants as any}
          key={`icon-${i}`}
        >
          <motion.img src={icon} className="bubble" />
          <div className="name-and-progress">
            <p className="bubble-text">{skillNames[i]}</p>
            <div className="progress-bar-flex">
              <div className="progress-bar">
                <div
                  className="progress"
                  style={{ width: `${progress[i]}%` }}
                ></div>
              </div>
              <p className="bubble-text">{progress[i]}%</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default VerticalSkills;

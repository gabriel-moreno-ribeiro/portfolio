import { motion, Transition, useAnimation, useInView } from "framer-motion";
import React, { useEffect, useRef } from "react";
import icon1 from "../../assets/skills/icon1.png";
import icon10 from "../../assets/skills/icon10.png";
import icon11 from "../../assets/skills/icon11.png";
import icon12 from "../../assets/skills/icon12.png";
import icon13 from "../../assets/skills/icon13.png";
import icon2 from "../../assets/skills/icon2.png";
import icon3 from "../../assets/skills/icon3.png";
import icon4 from "../../assets/skills/icon4.png";
import icon5 from "../../assets/skills/icon5.png";
import icon6 from "../../assets/skills/icon6.png";
import icon7 from "../../assets/skills/icon7.png";
import icon8 from "../../assets/skills/icon8.png";
import icon9 from "../../assets/skills/icon9.png";

const icons = [
  icon1,
  icon2,
  icon3,
  icon4,
  icon5,
  icon6,
  icon7,
  icon8,
  icon9,
  icon10,
  icon11,
  icon12,
  icon13,
];

const initialPosition = {
  x: 0,
  y: 0,
};

const finalPositions = [
  { x: -500, y: 0 },
  { x: 650, y: 100 },
  { x: 600, y: -50 },
  { x: -600, y: -150 },
  { x: -600, y: 250 },
  { x: 100, y: -250 },
  { x: -400, y: -300 },
  { x: 500, y: 200 },
  { x: -300, y: 0 },
  { x: 300, y: 0 },
  { x: 250, y: 300 },
  { x: 550, y: -300 },
  { x: -250, y: 250 },
];

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const bubbleVariants: Transition = {
  initial: { scale: 0 },
  animate: (i: number) => ({
    scale: [0, 1.5, 1],
    x: [initialPosition.x, finalPositions[i].x],
    y: [initialPosition.y, finalPositions[i].y],
    transition: {
      delay: i * 0.075,
      duration: 0.5,
      ease: "easeInOut",
    },
  }),
  oscillate: (i: number) => ({
    y: [
      finalPositions[i].y,
      finalPositions[i].y + randomInRange(-5, 5),
      finalPositions[i].y + randomInRange(-5, 5),
      finalPositions[i].y,
    ],
    x: [
      finalPositions[i].x,
      finalPositions[i].x + randomInRange(-5, 5),
      finalPositions[i].x + randomInRange(-5, 5),
      finalPositions[i].x,
    ],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "mirror",
    },
  }),
};

const Skills: React.FC = () => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    margin: "0px 0px -200px 0px",
  });

  useEffect(() => {
    if (inView) {
      controls
        .start((i) => bubbleVariants.animate(i))
        .then(() => {
          controls.start((i) => bubbleVariants.oscillate(i));
        });
    }
  }, [controls, inView]);

  return (
    <div className="skills-container" ref={ref}>
      <p className="main-text">Always Building, Always Growing</p>
      {icons.map((icon, i) => (
        <motion.img
          src={icon}
          className="bubble"
          custom={i}
          initial="initial"
          animate={controls}
          variants={bubbleVariants as any}
          key={`icon-${i}`}
        />
      ))}
    </div>
  );
};

export default Skills;

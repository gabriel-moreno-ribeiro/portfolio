import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const gestures = [
  {
    icon: "👤",
    title: "Head Tracking",
    desc: "Move your head to control the robot cursor",
    visual: "↕ ↔",
  },
  {
    icon: "👌",
    title: "Pinch to Click",
    desc: "Touch thumb + index finger to click on elements",
    visual: "tap",
  },
  {
    icon: "👌↕",
    title: "Pinch + Drag",
    desc: "Pinch and move your hand up/down to scroll",
    visual: "scroll",
  },
  {
    icon: "🖐",
    title: "Open Hand",
    desc: "Show your palm — the cursor follows your hand",
    visual: "move",
  },
];

const GestureTutorial: React.FC = () => {
  const show = useHandsfreeStore((s) => s.showGestureTutorial);
  const dismiss = () => useHandsfreeStore.getState().setShowGestureTutorial(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="gesture-tutorial-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="gesture-tutorial"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: "spring", stiffness: 180, damping: 18 },
            }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
          >
            <h2 className="gesture-tutorial__title">Hand Gestures</h2>
            <p className="gesture-tutorial__subtitle">
              Here's how to navigate hands-free
            </p>

            <div className="gesture-tutorial__grid">
              {gestures.map((g, i) => (
                <motion.div
                  key={g.title}
                  className="gesture-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: 0.1 + i * 0.1 },
                  }}
                >
                  <div className="gesture-card__icon">{g.icon}</div>
                  <div className="gesture-card__info">
                    <span className="gesture-card__name">{g.title}</span>
                    <span className="gesture-card__desc">{g.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              className="gesture-tutorial__dismiss"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={dismiss}
            >
              Got it!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GestureTutorial;

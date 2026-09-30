import { motion } from "motion/react";
import React from "react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { useThemeStore } from "../../store/themeStore";
import { sayEgg } from "../../utils/eggs";

// Six flips inside three seconds: the lights are flickering
let flips: number[] = [];
function noteFlip() {
  const now = Date.now();
  flips = [...flips.filter((t) => now - t < 3000), now];
  if (flips.length === 6) {
    flips = [];
    sayEgg("The lights are flickering. Before you replace anything expensive: it is the fuse. It is always the fuse.");
  }
}

const DarkModeButton: React.FC = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, transition: { delay: 0.6, duration: 0.3, ease: "easeOut" } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => { toggleDarkMode(); noteFlip(); }}
      className="toggle-button"
      data-color-inverted={"true"}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      data-tip={darkMode ? "Light mode" : "Dark mode"}
    >
      {darkMode ? <IoSunnyOutline /> : <IoMoonOutline />}
    </motion.button>
  );
};

export default DarkModeButton;

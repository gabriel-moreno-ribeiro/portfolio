import { motion } from "framer-motion";
import React from "react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { useThemeStore } from "../../store/themeStore";

const DarkModeButton: React.FC = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleDarkMode}
      className="toggle-button"
      data-color-inverted={"true"}
    >
      {darkMode ? <IoSunnyOutline /> : <IoMoonOutline />}
    </motion.button>
  );
};

export default DarkModeButton;

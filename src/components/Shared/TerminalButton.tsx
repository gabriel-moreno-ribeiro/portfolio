import { motion } from "motion/react";
import React from "react";
import { FiTerminal } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { toggleTerminalWindow } from "../../utils/terminalWindow";

// Floating launcher — the terminal opens as a draggable window from anywhere.
const TerminalButton: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { delay: 0.8, duration: 0.3, ease: "easeOut" },
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTerminalWindow}
      className="terminal-fab"
      title="Terminal (Ctrl+`)"
      data-color-inverted={"true"}
    >
      <FiTerminal />
    </motion.button>
  );
};

export default TerminalButton;

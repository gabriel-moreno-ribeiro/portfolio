import { motion } from "motion/react";
import React from "react";
import { FiX } from "react-icons/fi";
import { PiHandWavingBold } from "react-icons/pi";
import useIsMobile from "../../hooks/useIsMobile";
import { toggleHandsfree, useHandsfreeStore } from "../../store/handsfreeStore";

const supportsCamera =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

const HandsfreeButton: React.FC = () => {
  const isMobile = useIsMobile();
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);

  if (!supportsCamera) return null;

  // A crossed-out camera read as "camera broken"; a waving hand says what the mode is.
  const icon = isEnabled && isMobile ? <FiX /> : <PiHandWavingBold />;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, transition: { delay: 0.6, duration: 0.3, ease: "easeOut" } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleHandsfree}
      className={`handsfree-button ${isEnabled ? "active" : ""}`}
      data-color-inverted={"true"}
      aria-label={isEnabled ? "Disable hands-free mode" : "Hands-free mode (camera)"}
      data-tip={isEnabled ? "Turn off hands-free" : "Hands-free mode"}
    >
      {icon}
    </motion.button>
  );
};

export default HandsfreeButton;

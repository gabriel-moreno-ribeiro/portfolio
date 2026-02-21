import { motion } from "motion/react";
import React from "react";
import { FiVideo, FiVideoOff } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const supportsCamera =
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia;

const HandsfreeButton: React.FC = () => {
  const isMobile = useIsMobile();
  const { isEnabled, hasSeenIntro, setEnabled, setShowIntroModal } =
    useHandsfreeStore();

  if (isMobile || !supportsCamera) return null;

  const handleClick = () => {
    if (!hasSeenIntro) {
      setShowIntroModal(true);
      return;
    }
    setEnabled(!isEnabled);
  };

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`handsfree-button ${isEnabled ? "active" : ""}`}
      data-color-inverted={"true"}
    >
      {isEnabled ? <FiVideo /> : <FiVideoOff />}
    </motion.button>
  );
};

export default HandsfreeButton;

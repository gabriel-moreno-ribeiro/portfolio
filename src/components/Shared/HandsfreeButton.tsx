import { motion } from "motion/react";
import React from "react";
import { FiVideo, FiVideoOff, FiX } from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const supportsCamera =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

const HandsfreeButton: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    isEnabled,
    hasSeenIntro,
    setEnabled,
    setShowIntroModal,
    setShowGestureTutorial,
  } = useHandsfreeStore();

  if (!supportsCamera) return null;

  const handleCameraClick = () => {
    if (!hasSeenIntro) {
      setShowIntroModal(true);
      return;
    }
    if (isEnabled) {
      setEnabled(false);
    } else {
      setEnabled(true);
      // Show gesture tutorial every time camera is enabled
      setTimeout(() => setShowGestureTutorial(true), 1500);
    }
  };

  const icon = isEnabled
    ? isMobile
      ? <FiX />
      : <FiVideo />
    : <FiVideoOff />;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleCameraClick}
      className={`handsfree-button ${isEnabled ? "active" : ""}`}
      data-color-inverted={"true"}
      title={isEnabled ? "Disable camera" : "Enable camera"}
    >
      {icon}
    </motion.button>
  );
};

export default HandsfreeButton;

import { motion } from "motion/react";
import React from "react";
import { FiVideo, FiVideoOff } from "react-icons/fi";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const supportsCamera =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

const HandsfreeButton: React.FC = () => {
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
      {isEnabled ? <FiVideo /> : <FiVideoOff />}
    </motion.button>
  );
};

export default HandsfreeButton;

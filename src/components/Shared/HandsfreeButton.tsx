import { AnimatePresence, motion } from "motion/react";
import React from "react";
import {
  FiVideo,
  FiVideoOff,
  FiGrid,
  FiExternalLink,
} from "react-icons/fi";
import useIsMobile from "../../hooks/useIsMobile";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const supportsCamera =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

const HandsfreeButton: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    isEnabled,
    chipsActive,
    hasSeenIntro,
    setEnabled,
    setChipsActive,
    setShowIntroModal,
  } = useHandsfreeStore();

  if (isMobile || !supportsCamera) return null;

  const handleCameraClick = () => {
    if (!hasSeenIntro) {
      setShowIntroModal(true);
      return;
    }
    if (isEnabled) {
      setEnabled(false);
      setChipsActive(false);
    } else {
      setEnabled(true);
    }
  };

  const handleChipsClick = () => {
    setChipsActive(!chipsActive);
  };

  const handleOpenWindow = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("secondary", "true");
    window.open(
      url.toString(),
      "_blank",
      "width=800,height=900,left=100,top=100"
    );
  };

  return (
    <div className="handsfree-toolbar">
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

      <AnimatePresence>
        {isEnabled && (
          <>
            <motion.button
              initial={{ scale: 0, x: 10 }}
              animate={{ scale: 1, x: 0, transition: { duration: 0.15 } }}
              exit={{ scale: 0, x: 10 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleChipsClick}
              className={`handsfree-button sub ${chipsActive ? "active" : ""}`}
              data-color-inverted={"true"}
              title={chipsActive ? "Disable chips" : "Activate chips"}
            >
              <FiGrid />
            </motion.button>

            <motion.button
              initial={{ scale: 0, x: 10 }}
              animate={{
                scale: 1,
                x: 0,
                transition: { duration: 0.15, delay: 0.05 },
              }}
              exit={{ scale: 0, x: 10 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleOpenWindow}
              className="handsfree-button sub"
              data-color-inverted={"true"}
              title="Open second window"
            >
              <FiExternalLink />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HandsfreeButton;

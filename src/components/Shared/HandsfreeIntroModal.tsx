import { AnimatePresence, motion } from "motion/react";
import React from "react";
import MacButtons from "../Home/MacButtons";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const HandsfreeIntroModal: React.FC = () => {
  const {
    showIntroModal,
    setShowIntroModal,
    setHasSeenIntro,
    setEnabled,
    cameraPermission,
    setCameraPermission,
    modelLoadProgress,
  } = useHandsfreeStore();

  const handleClose = () => {
    setShowIntroModal(false);
  };

  const handleEnable = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraPermission("granted");
      setHasSeenIntro(true);
      setShowIntroModal(false);
      setEnabled(true);
    } catch {
      setCameraPermission("denied");
    }
  };

  return (
    <AnimatePresence>
      {showIntroModal && (
        <motion.div
          className="handsfree-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="handsfree-modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: "spring", stiffness: 200, damping: 20 },
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <MacButtons
              onClose={handleClose}
              onMinimise={handleClose}
              onExpand={() => {}}
              isExpanded={true}
            />
            <h2 className="heading">Handsfree Mode</h2>
            <p className="desc">
              Control this portfolio with your head and hands — no mouse needed.
            </p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">👤</span>
                <span>Move your head to control the robot</span>
              </div>
              <div className="feature">
                <span className="feature-icon">👌</span>
                <span>Pinch to click, pinch + drag to scroll</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✋</span>
                <span>Activate chips mode to play with skill icons</span>
              </div>
            </div>
            <p className="desc subtle">
              Requires camera access. Video is processed locally and never
              leaves your device.
            </p>
            {cameraPermission === "denied" && (
              <p className="desc error">
                Camera access was denied. Please allow camera access in your
                browser settings and try again.
              </p>
            )}
            {modelLoadProgress > 0 && modelLoadProgress < 100 && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${modelLoadProgress}%` }}
                />
              </div>
            )}
            <motion.button
              className="enable-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnable}
            >
              Enable Handsfree
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HandsfreeIntroModal;

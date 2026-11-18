import { useEffect } from "react";
import { useHandsfreeStore } from "../../store/handsfreeStore";
import {
  useWindowManagerStore,
  useWindow,
} from "../../store/windowManagerStore";
import DraggableWindow from "../WindowManager/DraggableWindow";
import { motion } from "motion/react";
import { preloadModels, stopCameraInput } from "../../providers/CameraInputProvider";

const FEATURES = [
  {
    icon: "🤖",
    title: "The robot copies you",
    desc: "Turn, tilt or lean in, and it does the same",
  },
  {
    icon: "👋",
    title: "It answers your gestures",
    desc: "Wave, ✌️ to spin, ✊ then ✋ to jump, 👍 for a nod",
  },
  {
    icon: "👌",
    title: "Your hand is the mouse",
    desc: "Pinch to click, pinch and drag to scroll",
  },
];

const HandsfreeIntroModal: React.FC = () => {
  const {
    showIntroModal,
    setShowIntroModal,
    setHasSeenIntro,
    setEnabled,
    modelLoadProgress,
  } = useHandsfreeStore();
  const openWindow = useWindowManagerStore((s) => s.openWindow);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const win = useWindow("handsfree-intro");

  useEffect(() => {
    if (showIntroModal && !win) {
      const modalWidth = Math.min(420, window.innerWidth - 40);
      openWindow({
        id: "handsfree-intro",
        title: "Handsfree Mode",
        type: "handsfree-intro",
        status: "open",
        position: {
          x: Math.max(20, (window.innerWidth - modalWidth) / 2),
          y: Math.max(20, (window.innerHeight - 480) / 2),
        },
        size: { width: modalWidth, height: 0 },
      });
    }
  }, [showIntroModal, win, openWindow]);

  // The models (~12 MB) start loading while the visitor reads, so the camera is quick to start.
  useEffect(() => {
    if (showIntroModal) preloadModels().catch(() => {});
  }, [showIntroModal]);

  // Closed from the title bar: same as "Not now".
  useEffect(() => {
    if (!win && showIntroModal) {
      setShowIntroModal(false);
      if (!useHandsfreeStore.getState().isEnabled) stopCameraInput();
    }
  }, [win, showIntroModal, setShowIntroModal]);

  const handleClose = () => {
    setHasSeenIntro(true);
    closeWindow("handsfree-intro");
    setShowIntroModal(false);
  };

  // The camera is asked for once, by the mode itself; a refusal shows the robot card (CameraOops).
  const handleEnable = () => {
    handleClose();
    setEnabled(true);
  };

  const handleDecline = () => {
    stopCameraInput(); // drops the models that were loading
    handleClose();
  };

  if (!win || win.status === "minimized") return null;

  return (
    <DraggableWindow windowId="handsfree-intro" title="Handsfree Mode">
      <div className="hf-intro">
        <div className="hf-intro__hero">
          <motion.div
            className="hf-intro__icon-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="hf-intro__orbit-dot" />
            <div className="hf-intro__orbit-dot" />
            <div className="hf-intro__orbit-dot" />
          </motion.div>
          <span className="hf-intro__main-icon">🖐️</span>
        </div>

        <div className="hf-intro__content">
          <h2 className="hf-intro__title">Use the site with your hands</h2>
          <p className="hf-intro__subtitle">
            Your webcam follows your head and hands. No mouse needed.
          </p>

          <div className="hf-intro__features">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="hf-intro__feature"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
              >
                <span className="hf-intro__feature-icon">{f.icon}</span>
                <div className="hf-intro__feature-text">
                  <span className="hf-intro__feature-title">{f.title}</span>
                  <span className="hf-intro__feature-desc">{f.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>


          {modelLoadProgress > 0 && modelLoadProgress < 100 && (
            <div className="hf-intro__progress">
              <div
                className="hf-intro__progress-fill"
                style={{ width: `${modelLoadProgress}%` }}
              />
            </div>
          )}

          <p className="hf-intro__privacy">
            Camera frames never leave your device. <a href="/privacy" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy policy</a>
          </p>
        </div>

        <div className="hf-intro__actions">
          <motion.button
            className="hf-intro__btn hf-intro__btn--primary"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEnable}
          >
            Turn on the camera
          </motion.button>
          <motion.button
            className="hf-intro__btn hf-intro__btn--ghost"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDecline}
          >
            Not now
          </motion.button>
        </div>
      </div>
    </DraggableWindow>
  );
};

export default HandsfreeIntroModal;

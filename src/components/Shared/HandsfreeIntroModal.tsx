import { useEffect } from "react";
import { useHandsfreeStore } from "../../store/handsfreeStore";
import {
  useWindowManagerStore,
  useWindow,
} from "../../store/windowManagerStore";
import DraggableWindow from "../WindowManager/DraggableWindow";
import { motion, AnimatePresence } from "motion/react";

const FEATURES = [
  {
    icon: "👤",
    title: "Head tracking",
    desc: "Move your head to control the cursor",
  },
  {
    icon: "👌",
    title: "Pinch gestures",
    desc: "Pinch to click, drag to scroll",
  },
  {
    icon: "✋",
    title: "Chips mode",
    desc: "Play with skill icons using your hands",
  },
];

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

  const { setShowGestureTutorial } = useHandsfreeStore();
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

  useEffect(() => {
    if (!win && showIntroModal) {
      setShowIntroModal(false);
    }
  }, [win, showIntroModal, setShowIntroModal]);

  const handleClose = () => {
    setHasSeenIntro(true);
    closeWindow("handsfree-intro");
    setShowIntroModal(false);
  };

  const handleEnable = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraPermission("granted");
      setHasSeenIntro(true);
      handleClose();
      setEnabled(true);
      setTimeout(() => setShowGestureTutorial(true), 1500);
    } catch {
      setCameraPermission("denied");
    }
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
          <h2 className="hf-intro__title">Go Handsfree</h2>
          <p className="hf-intro__subtitle">
            Navigate this portfolio with gestures — no mouse needed.
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

          <AnimatePresence>
            {cameraPermission === "denied" && (
              <motion.p
                className="hf-intro__error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                Camera access denied. Please allow it in browser settings.
              </motion.p>
            )}
          </AnimatePresence>

          {modelLoadProgress > 0 && modelLoadProgress < 100 && (
            <div className="hf-intro__progress">
              <div
                className="hf-intro__progress-fill"
                style={{ width: `${modelLoadProgress}%` }}
              />
            </div>
          )}

          <p className="hf-intro__privacy">
            🔒 Camera data stays on your device — nothing is uploaded. <a href="/privacy" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy policy</a>
          </p>
        </div>

        <div className="hf-intro__actions">
          <motion.button
            className="hf-intro__btn hf-intro__btn--primary"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEnable}
          >
            <span className="hf-intro__btn-icon">✨</span>
            Enable Handsfree
          </motion.button>
          <motion.button
            className="hf-intro__btn hf-intro__btn--ghost"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClose}
          >
            Continue with mouse
          </motion.button>
        </div>
      </div>
    </DraggableWindow>
  );
};

export default HandsfreeIntroModal;

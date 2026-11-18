import { useEffect } from "react";
import { useHandsfreeStore } from "../../store/handsfreeStore";
import {
  useWindowManagerStore,
  useWindow,
} from "../../store/windowManagerStore";
import DraggableWindow from "../WindowManager/DraggableWindow";
import { PiHandTap, PiHandWaving, PiSmiley } from "react-icons/pi";
import { preloadModels, stopCameraInput } from "../../providers/CameraInputProvider";

const FEATURES = [
  {
    Icon: PiSmiley,
    title: "The robot copies your face",
    desc: "Blink, smile, yawn or tilt your head, and it does the same.",
  },
  {
    Icon: PiHandWaving,
    title: "It answers your gestures",
    desc: "A wave, a peace sign, a thumbs up, or a fist that opens.",
  },
  {
    Icon: PiHandTap,
    title: "Your hand is the mouse",
    desc: "Pinch to click. Pinch and drag to scroll.",
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
        title: "Hands-free",
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
    <DraggableWindow windowId="handsfree-intro" title="Hands-free">
      <div className="hf-sheet hf-intro">
        <span className="hf-sheet__label">Hands-free mode</span>
        <h2 className="hf-sheet__title">
          Use the site with your <em>hands</em>.
        </h2>
        <p className="hf-sheet__lead">Your webcam follows your face and hands. No mouse needed.</p>

        <ul className="hf-sheet__rows">
          {FEATURES.map(({ Icon, title, desc }) => (
            <li key={title}>
              <Icon aria-hidden="true" />
              <div>
                <strong>{title}</strong>
                <span>{desc}</span>
              </div>
            </li>
          ))}
        </ul>

        {modelLoadProgress > 0 && modelLoadProgress < 100 && (
          <div className="hf-sheet__progress" aria-hidden="true">
            <div style={{ transform: `scaleX(${modelLoadProgress / 100})` }} />
          </div>
        )}

        <div className="hf-sheet__actions">
          <button type="button" className="btn primary hf-intro__btn--primary" onClick={handleEnable}>
            Turn on the camera
          </button>
          <button type="button" className="hf-sheet__skip hf-intro__btn--ghost" onClick={handleDecline}>
            Not now
          </button>
        </div>
        <p className="hf-sheet__note">
          Camera frames never leave your device. <a href="/privacy" target="_blank" rel="noopener">Privacy policy</a>
        </p>
      </div>
    </DraggableWindow>
  );
};

export default HandsfreeIntroModal;

import { PiArrowsDownUp, PiHandPalm, PiHandTap, PiSmiley } from "react-icons/pi";
import { useEffect } from "react";
import { useHandsfreeStore } from "../../store/handsfreeStore";
import {
  useWindowManagerStore,
  useWindow,
} from "../../store/windowManagerStore";
import DraggableWindow from "../WindowManager/DraggableWindow";
import { TRICKS } from "../Home/HandsfreeInvite";

// What moves the page (what moves the robot is the callout's own list, TRICKS).
const PAGE = [
  { Icon: PiHandPalm, text: "An open hand moves the cursor" },
  { Icon: PiHandTap, text: "Pinch and release to click" },
  { Icon: PiArrowsDownUp, text: "Pinch and drag to scroll" },
];

const GestureTutorial: React.FC = () => {
  const show = useHandsfreeStore((s) => s.showGestureTutorial);
  const openWindow = useWindowManagerStore((s) => s.openWindow);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const win = useWindow("gesture-tutorial");

  // Bridge: handsfreeStore -> windowManagerStore
  useEffect(() => {
    if (show && !win) {
      const modalWidth = Math.min(540, window.innerWidth - 40);
      openWindow({
        id: "gesture-tutorial",
        title: "Gestures",
        type: "gesture-tutorial",
        status: "open",
        position: {
          // Bottom right, so the robot stays in view while the visitor tries the gestures.
          x: Math.max(20, window.innerWidth - modalWidth - 24),
          y: Math.max(20, window.innerHeight - 470),
        },
        size: { width: modalWidth, height: 0 },
      });
    }
  }, [show, win, openWindow]);

  // Bridge: windowManagerStore -> handsfreeStore
  useEffect(() => {
    if (!win && show) {
      useHandsfreeStore.getState().setShowGestureTutorial(false);
    }
  }, [win, show]);

  const dismiss = () => {
    closeWindow("gesture-tutorial");
    useHandsfreeStore.getState().setShowGestureTutorial(false);
  };

  if (!win || win.status === "minimized") return null;

  return (
    <DraggableWindow windowId="gesture-tutorial" title="Gestures">
      <div className="hf-sheet gesture-tutorial-body">
        <span className="hf-sheet__label hf-sheet__label--live">Camera on</span>
        <h2 className="hf-sheet__title">
          Now <em>try</em> it.
        </h2>

        <p className="hf-sheet__group">The robot</p>
        <ul className="hf-sheet__legend">
          <li>
            <span className="hf-sheet__sign"><PiSmiley aria-hidden="true" /></span>
            Your face: it copies you
          </li>
          {TRICKS.map((t) => (
            <li key={t.move} data-move={t.move}>
              <span className="hf-sheet__sign" role="img" aria-label={t.sign}>
                {t.icons.map((Icon, i) => (
                  <Icon key={i} aria-hidden="true" />
                ))}
              </span>
              {t.sign}: it {t.does}
            </li>
          ))}
        </ul>

        <p className="hf-sheet__group">The page</p>
        <ul className="hf-sheet__legend">
          {PAGE.map(({ Icon, text }) => (
            <li key={text}>
              <span className="hf-sheet__sign"><Icon aria-hidden="true" /></span>
              {text}
            </li>
          ))}
        </ul>

        <div className="hf-sheet__actions">
          <button type="button" className="btn primary gesture-tutorial__dismiss" onClick={dismiss}>
            Got it
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

export default GestureTutorial;

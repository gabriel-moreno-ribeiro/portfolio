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
  { Icon: PiHandPalm, sign: "Open hand", does: "moves the cursor" },
  { Icon: PiHandTap, sign: "Pinch and release", does: "clicks" },
  { Icon: PiArrowsDownUp, sign: "Pinch and drag", does: "scrolls" },
];

const GestureTutorial: React.FC = () => {
  const show = useHandsfreeStore((s) => s.showGestureTutorial);
  const openWindow = useWindowManagerStore((s) => s.openWindow);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const win = useWindow("gesture-tutorial");

  // Bridge: handsfreeStore -> windowManagerStore
  useEffect(() => {
    if (show && !win) {
      const modalWidth = Math.min(760, window.innerWidth - 40);
      // Its height before it is drawn: the bar, the heading and one row per line of tiles
      // (the tiles are 180px or wider, as in the SCSS).
      const cols = Math.max(1, Math.min(3, Math.floor((modalWidth - 48) / 188)));
      const modalHeight = 240 + (Math.ceil(6 / cols) + Math.ceil(3 / cols)) * 72;
      openWindow({
        id: "gesture-tutorial",
        title: "Gestures",
        type: "gesture-tutorial",
        status: "open",
        position: {
          // In the middle, at the bottom: right under the robot, which stays in view above it.
          x: Math.max(20, (window.innerWidth - modalWidth) / 2),
          y: Math.max(20, window.innerHeight - modalHeight - 24),
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
        <div className="hf-sheet__head">
          <div>
            <span className="hf-sheet__label hf-sheet__label--live">Camera on</span>
            <h2 className="hf-sheet__title">
              Now <em>try</em> it.
            </h2>
          </div>
          <button type="button" className="btn primary gesture-tutorial__dismiss" onClick={dismiss}>
            Got it
          </button>
        </div>

        <p className="hf-sheet__group">Show this to the robot</p>
        <ul className="hf-sheet__legend">
          <li>
            <span className="hf-sheet__sign"><PiSmiley aria-hidden="true" /></span>
            <span><strong>Your face</strong>it copies you</span>
          </li>
          {TRICKS.map((t) => (
            <li key={t.move} data-move={t.move}>
              <span className="hf-sheet__sign">
                {t.icons.map((Icon, i) => (
                  <Icon key={i} aria-hidden="true" />
                ))}
              </span>
              <span><strong>{t.sign}</strong>it {t.does}</span>
            </li>
          ))}
        </ul>

        <p className="hf-sheet__group">Use your hand as the mouse</p>
        <ul className="hf-sheet__legend">
          {PAGE.map(({ Icon, sign, does }) => (
            <li key={sign}>
              <span className="hf-sheet__sign"><Icon aria-hidden="true" /></span>
              <span><strong>{sign}</strong>{does}</span>
            </li>
          ))}
        </ul>
      </div>
    </DraggableWindow>
  );
};

export default GestureTutorial;

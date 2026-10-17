import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useReducedMotion } from "../../lib/motion";
import { useHandsfreeStore, type CameraError } from "../../store/handsfreeStore";

const COPY: Record<CameraError, { title: string; body: string }> = {
  blocked: {
    title: "I can't see you!",
    body: "Your browser is blocking the camera. Click the camera or lock icon by the address bar, allow it, then try again.",
  },
  missing: {
    title: "No camera here",
    body: "I couldn't find a webcam on this device. Plug one in and try again, or keep using the mouse.",
  },
  busy: {
    title: "The camera is busy",
    body: "Another app (a call, maybe?) is using your webcam. Close it and try again.",
  },
  load: {
    title: "My eyes didn't load",
    body: "The hand-tracking model didn't download. Check your connection and try again.",
  },
};

// The site's robot, from the chest up, covering its eyes. The resting pose is
// the peek (one hand lowered); the CSS animation only plays the hide-and-peek.
const PeekingRobot = () => (
  <svg className="camera-oops__robot" viewBox="34 16 132 132" aria-hidden="true">
    <rect className="camera-oops__metal" x="76" y="12" width="4" height="12" rx="2" />
    <rect className="camera-oops__metal" x="120" y="12" width="4" height="12" rx="2" />
    <rect className="camera-oops__shell" x="64" y="20" width="72" height="38" rx="9" />
    {[0, 1, 2, 3, 4].map((k) => (
      <rect key={k} className="camera-oops__metal" x={73 + k * 11} y="27" width="6" height="24" rx="3" />
    ))}
    <rect className="camera-oops__dark" x="60" y="56" width="80" height="7" rx="3" />
    <rect className="camera-oops__shell" x="38" y="60" width="124" height="128" rx="18" />
    <circle cx="100" cy="106" r="37" className="camera-oops__visor" />
    <rect className="camera-oops__eye camera-oops__eye--peek" x="85" y="98" width="9" height="17" rx="4.5" />
    <rect className="camera-oops__eye" x="106" y="98" width="9" height="17" rx="4.5" />
    <ellipse className="camera-oops__blush" cx="72" cy="123" rx="5" ry="3" />
    <ellipse className="camera-oops__blush" cx="128" cy="123" rx="5" ry="3" />
    {/* hands: the left one is the peeking one */}
    <g className="camera-oops__hand camera-oops__hand--peek">
      <rect className="camera-oops__metal" x="79" y="112" width="13" height="40" rx="5" />
      <rect className="camera-oops__shell" x="70" y="90" width="30" height="27" rx="11" />
      <path className="camera-oops__finger" d="M78 91 V100 M85 90 V100 M92 91 V100" />
    </g>
    <g className="camera-oops__hand">
      <rect className="camera-oops__metal" x="108" y="112" width="13" height="40" rx="5" />
      <rect className="camera-oops__shell" x="100" y="90" width="30" height="27" rx="11" />
      <path className="camera-oops__finger" d="M108 91 V100 M115 90 V100 M122 91 V100" />
    </g>
  </svg>
);

const CameraOops: React.FC = () => {
  const error = useHandsfreeStore((s) => s.cameraError);
  const setCameraError = useHandsfreeStore((s) => s.setCameraError);
  const setEnabled = useHandsfreeStore((s) => s.setEnabled);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!error) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCameraError(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [error, setCameraError]);

  const retry = () => {
    setCameraError(null);
    setEnabled(true);
  };

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          key={error}
          className="camera-oops"
          role="alert"
          initial={reduced ? false : { opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          <div className="camera-oops__avatar">
            <PeekingRobot />
          </div>
          <div className="camera-oops__text">
            <p className="camera-oops__title">{COPY[error].title}</p>
            <p className="camera-oops__body">{COPY[error].body}</p>
          </div>
          <div className="camera-oops__actions">
            <button type="button" className="camera-oops__btn camera-oops__btn--primary" onClick={retry}>
              Try again
            </button>
            <button type="button" className="camera-oops__btn" onClick={() => setCameraError(null)}>
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraOops;

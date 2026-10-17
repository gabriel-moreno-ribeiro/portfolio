import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const HandsfreeLoader: React.FC = () => {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const setEnabled = useHandsfreeStore((s) => s.setEnabled);
  const progress = useHandsfreeStore((s) => s.modelLoadProgress);

  const isLoading = isEnabled && progress < 100;

  // The overlay covers the whole site, so Escape (or the button) must get out of it
  useEffect(() => {
    if (!isLoading) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnabled(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading, setEnabled]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="handsfree-loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="handsfree-loader-card" role="status" aria-live="polite">
            <div className="handsfree-loader-spinner" />
            <p className="handsfree-loader-text">Loading the hand model…</p>
            <div className="handsfree-loader-bar">
              <motion.div
                className="handsfree-loader-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="handsfree-loader-percent">{Math.round(progress)}%</p>
            <button type="button" className="handsfree-loader-cancel" onClick={() => setEnabled(false)}>
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HandsfreeLoader;

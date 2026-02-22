import { lazy, Suspense, useEffect, useState, useCallback } from "react";

const Terminal = lazy(() => import("./Terminal"));

function TerminalModal() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+J (Mac) or Ctrl+J (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="terminal-modal-overlay" onClick={close}>
      <div
        className="terminal-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <Suspense fallback={null}>
          <Terminal onClose={close} />
        </Suspense>
      </div>
    </div>
  );
}

export default TerminalModal;

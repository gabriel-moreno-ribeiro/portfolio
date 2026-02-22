import { lazy, Suspense, useEffect, useState, useCallback } from "react";

const Terminal = lazy(() => import("./Terminal"));

function TerminalModal() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+T (Mac) or Ctrl+T (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
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

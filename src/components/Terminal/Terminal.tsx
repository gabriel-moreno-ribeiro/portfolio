import { useCallback, useRef } from "react";
import { useTerminalStore } from "../../store/terminalStore";
import TerminalHeader from "./TerminalHeader";
import TerminalBootSequence from "./TerminalBootSequence";
import TerminalOutput from "./TerminalOutput";
import TerminalInput from "./TerminalInput";
import MatrixRain from "./MatrixRain";

interface TerminalProps {
  onClose?: () => void;
}

function Terminal({ onClose }: TerminalProps) {
  const { outputLines, isBooted, setBooted, matrixActive } =
    useTerminalStore();
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, [setBooted]);

  const focusInput = () => {
    const input = bodyRef.current?.querySelector<HTMLInputElement>(
      ".terminal-input"
    );
    input?.focus();
  };

  return (
    <div className="terminal-window">
      <TerminalHeader onClose={onClose} />
      <div className="terminal-body" ref={bodyRef} onClick={focusInput}>
        {!isBooted && (
          <TerminalBootSequence onComplete={handleBootComplete} />
        )}
        {isBooted && (
          <>
            <TerminalOutput lines={outputLines} />
            <TerminalInput />
          </>
        )}
        {matrixActive && <MatrixRain />}
      </div>
    </div>
  );
}

export default Terminal;

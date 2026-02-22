import MacButtons from "../Home/MacButtons";
import { useTerminalStore } from "../../store/terminalStore";

interface TerminalHeaderProps {
  onClose?: () => void;
}

function TerminalHeader({ onClose }: TerminalHeaderProps) {
  const { currentDirectory, clearOutput } = useTerminalStore();

  return (
    <div className="terminal-header">
      <MacButtons
        onClose={onClose || (() => {})}
        onExpand={() => {}}
        onMinimise={() => clearOutput()}
        isExpanded={false}
      />
      <span className="terminal-title">avi@portfolio:{currentDirectory}</span>
    </div>
  );
}

export default TerminalHeader;

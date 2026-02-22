import MacButtons from "../Home/MacButtons";
import { useTerminalStore } from "../../store/terminalStore";

interface TerminalHeaderProps {
  onClose?: () => void;
}

function TerminalHeader({ onClose }: TerminalHeaderProps) {
  const { currentDirectory } = useTerminalStore();

  return (
    <div className="terminal-header">
      <MacButtons
        onClose={onClose || (() => {})}
        onExpand={() => {}}
        onMinimise={() => {}}
        isExpanded={false}
      />
      <span className="terminal-title">avi@portfolio:{currentDirectory}</span>
    </div>
  );
}

export default TerminalHeader;

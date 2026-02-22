import MacButtons from "../Home/MacButtons";
import { useTerminalStore } from "../../store/terminalStore";

interface TerminalHeaderProps {
  onClose?: () => void;
  onExpand?: () => void;
  isExpanded?: boolean;
}

function TerminalHeader({ onClose, onExpand, isExpanded }: TerminalHeaderProps) {
  const { currentDirectory } = useTerminalStore();

  return (
    <div className="terminal-header">
      <MacButtons
        onClose={onClose || (() => {})}
        onExpand={onExpand || (() => {})}
        onMinimise={() => {}}
        isExpanded={isExpanded || false}
      />
      <span className="terminal-title">avi@portfolio:{currentDirectory}</span>
    </div>
  );
}

export default TerminalHeader;

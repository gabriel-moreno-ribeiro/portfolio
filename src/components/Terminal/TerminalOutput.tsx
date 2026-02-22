import { useEffect, useRef } from "react";
import { OutputLine } from "../../store/terminalStore";

interface TerminalOutputProps {
  lines: OutputLine[];
}

function TerminalOutputLine({ line }: { line: OutputLine }) {
  if (line.type === "input") {
    return (
      <div className="terminal-line terminal-line--input">
        <span className="prompt">
          avi@portfolio:{line.directory || "~"}$
        </span>
        <span className="command-text">{line.content}</span>
      </div>
    );
  }

  return (
    <div className={`terminal-line terminal-line--${line.type}`}>
      {line.content}
    </div>
  );
}

function TerminalOutput({ lines }: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="terminal-output">
      {lines.map((line) => (
        <TerminalOutputLine key={line.id} line={line} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default TerminalOutput;

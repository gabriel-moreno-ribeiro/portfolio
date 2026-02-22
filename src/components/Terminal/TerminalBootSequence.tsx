import { useState, useEffect } from "react";

const bootLines = [
  "Portfolio OS v2.0.26 [Avi Vashishta Edition]",
  "Loading modules... done.",
  "Initializing file system... done.",
  "AI assistant ready.",
  "",
  'Type "help" to see available commands.',
  'Type "ai <message>" to chat with an AI that knows about Avi.',
  "",
];

interface BootSequenceProps {
  onComplete: () => void;
}

function TerminalBootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    if (visibleLines >= bootLines.length) {
      const timeout = setTimeout(onComplete, 300);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(
      () => setVisibleLines((v) => v + 1),
      visibleLines === 0 ? 200 : 100
    );
    return () => clearTimeout(timeout);
  }, [visibleLines, onComplete]);

  return (
    <div className="boot-sequence">
      {bootLines.slice(0, visibleLines).map((line, i) => (
        <div key={i} className="boot-line">
          {line}
        </div>
      ))}
    </div>
  );
}

export default TerminalBootSequence;

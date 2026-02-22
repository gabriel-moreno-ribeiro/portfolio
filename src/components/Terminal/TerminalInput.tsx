import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { useTerminalStore } from "../../store/terminalStore";
import { useTerminalCommands } from "../../hooks/useTerminalCommands";
import { useTerminalHistory } from "../../hooks/useTerminalHistory";
import { commandRegistry } from "../../constants/terminal/commands";

function TerminalInput() {
  const [input, setInput] = useState("");
  const { currentDirectory, isAiLoading } = useTerminalStore();
  const { executeCommand } = useTerminalCommands();
  const { historyUp, historyDown } = useTerminalHistory();
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = `avi@portfolio:${currentDirectory}$`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiLoading) return;
    const cmd = input;
    setInput("");
    await executeCommand(cmd);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setInput(historyUp());
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setInput(historyDown());
    }
    if (e.key === "Tab") {
      e.preventDefault();
      // Tab completion: match partial command names
      const partial = input.trim().toLowerCase();
      if (!partial) return;
      const matches: string[] = [];
      for (const name of commandRegistry.keys()) {
        if (name.startsWith(partial)) matches.push(name);
      }
      if (matches.length === 1) {
        setInput(matches[0] + " ");
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form className="terminal-input-line" onSubmit={handleSubmit}>
      <span className="prompt">{prompt}</span>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="terminal-input"
        autoFocus
        spellCheck={false}
        autoComplete="off"
        placeholder={isAiLoading ? "" : "Type a command..."}
        disabled={isAiLoading}
      />
    </form>
  );
}

export default TerminalInput;

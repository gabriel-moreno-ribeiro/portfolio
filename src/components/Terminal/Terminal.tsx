import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import { useTerminalStore } from "../../store/terminalStore";
import { useThemeStore } from "../../store/themeStore";
import {
  commandRegistry,
  getFileSystem,
  parseInput,
  CommandContext,
} from "../../constants/terminal/commands";
import TerminalHeader from "./TerminalHeader";
import MatrixRain from "./MatrixRain";

interface TerminalProps {
  onClose?: () => void;
}

const DEFAULT_ROWS = 24;
const EXPANDED_ROWS = 36;

const BOOT_LINES = [
  "Portfolio OS v2.0.26 [Avi Vashishta Edition]",
  "Loading modules... done.",
  "Initializing file system... done.",
  "AI assistant ready.",
  "",
  'Type \x1b[32m"help"\x1b[0m to see available commands.',
  'Type \x1b[32m"ai <message>"\x1b[0m to chat with an AI that knows about Avi.',
  "",
];

function Terminal({ onClose }: TerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lineBufferRef = useRef("");
  const busyRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    currentDirectory,
    commandHistory,
    historyIndex,
    isBooted,
    matrixActive,
    setDirectory,
    addToHistory,
    setHistoryIndex,
    setBooted,
    setMatrixActive,
    setAiLoading,
  } = useTerminalStore();

  const { toggleDarkMode } = useThemeStore();

  // Keep refs in sync with store for use in xterm callbacks
  const currentDirRef = useRef(currentDirectory);
  const historyRef = useRef(commandHistory);
  const historyIndexRef = useRef(historyIndex);
  currentDirRef.current = currentDirectory;
  historyRef.current = commandHistory;
  historyIndexRef.current = historyIndex;

  const getPrompt = useCallback(() => {
    return `\x1b[32mavi@portfolio:${currentDirRef.current}$\x1b[0m `;
  }, []);

  const writePrompt = useCallback(() => {
    const term = xtermRef.current;
    if (!term) return;
    term.write(getPrompt());
  }, [getPrompt]);

  const executeCommand = useCallback(
    async (raw: string) => {
      const term = xtermRef.current;
      if (!term) return;

      const trimmed = raw.trim();
      if (!trimmed) {
        writePrompt();
        return;
      }

      addToHistory(trimmed);

      const { command, args, flags } = parseInput(trimmed);
      const cmd = commandRegistry.get(command);

      if (!cmd) {
        term.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
        term.writeln('Type \x1b[32m"help"\x1b[0m to see available commands.');
        writePrompt();
        return;
      }

      const ctx: CommandContext = {
        args,
        flags,
        currentDirectory: currentDirRef.current,
        setDirectory,
        writeln: (text: string) => term.writeln(text),
        clearTerminal: () => term.clear(),
        toggleTheme: toggleDarkMode,
        setMatrixActive,
        setAiLoading,
        fileSystem: getFileSystem(),
        rawInput: trimmed,
      };

      busyRef.current = true;
      try {
        await cmd.execute(ctx);
      } finally {
        busyRef.current = false;
        writePrompt();
      }
    },
    [addToHistory, setDirectory, toggleDarkMode, setMatrixActive, setAiLoading, writePrompt]
  );

  useEffect(() => {
    if (!termRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      rows: DEFAULT_ROWS,
      fontSize: 14,
      fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      theme: {
        background: "#1e1e2e",
        foreground: "#cdd6f4",
        cursor: "#cdd6f4",
        selectionBackground: "#45475a",
        black: "#45475a",
        red: "#f38ba8",
        green: "#a6e3a1",
        yellow: "#f9e2af",
        blue: "#89b4fa",
        magenta: "#cba6f7",
        cyan: "#94e2d5",
        white: "#cdd6f4",
        brightBlack: "#585b70",
        brightRed: "#f38ba8",
        brightGreen: "#a6e3a1",
        brightYellow: "#f9e2af",
        brightBlue: "#89b4fa",
        brightMagenta: "#cba6f7",
        brightCyan: "#94e2d5",
        brightWhite: "#cdd6f4",
      },
      scrollback: 1000,
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Boot sequence or immediate prompt
    if (!isBooted) {
      let i = 0;
      const bootNext = () => {
        if (i < BOOT_LINES.length) {
          term.writeln(BOOT_LINES[i]);
          i++;
          setTimeout(bootNext, 80);
        } else {
          setBooted(true);
          writePrompt();
        }
      };
      setTimeout(bootNext, 200);
    } else {
      writePrompt();
    }

    // Handle input data
    term.onData((data) => {
      if (busyRef.current) return;

      switch (data) {
        case "\r": {
          // Enter
          term.write("\r\n");
          const cmd = lineBufferRef.current;
          lineBufferRef.current = "";
          executeCommand(cmd);
          break;
        }
        case "\x7f": {
          // Backspace
          if (lineBufferRef.current.length > 0) {
            lineBufferRef.current = lineBufferRef.current.slice(0, -1);
            term.write("\b \b");
          }
          break;
        }
        case "\x1b[A": {
          // Arrow Up
          const history = historyRef.current;
          if (history.length === 0) break;
          const idx = historyIndexRef.current;
          const newIdx = idx === -1 ? history.length - 1 : Math.max(0, idx - 1);
          setHistoryIndex(newIdx);
          const clearLen = lineBufferRef.current.length;
          term.write("\b \b".repeat(clearLen));
          lineBufferRef.current = history[newIdx] || "";
          term.write(lineBufferRef.current);
          break;
        }
        case "\x1b[B": {
          // Arrow Down
          const history = historyRef.current;
          const idx = historyIndexRef.current;
          if (idx === -1) break;
          const clearLen = lineBufferRef.current.length;
          term.write("\b \b".repeat(clearLen));
          const newIdx = idx + 1;
          if (newIdx >= history.length) {
            setHistoryIndex(-1);
            lineBufferRef.current = "";
          } else {
            setHistoryIndex(newIdx);
            lineBufferRef.current = history[newIdx] || "";
          }
          term.write(lineBufferRef.current);
          break;
        }
        case "\t": {
          // Tab completion
          const partial = lineBufferRef.current.trim().toLowerCase();
          if (!partial) break;
          const matches: string[] = [];
          for (const name of commandRegistry.keys()) {
            if (name.startsWith(partial)) matches.push(name);
          }
          if (matches.length === 1) {
            const clearLen = lineBufferRef.current.length;
            term.write("\b \b".repeat(clearLen));
            lineBufferRef.current = matches[0] + " ";
            term.write(lineBufferRef.current);
          } else if (matches.length > 1) {
            term.write("\r\n");
            term.writeln(matches.join("  "));
            writePrompt();
            term.write(lineBufferRef.current);
          }
          break;
        }
        case "\x03": {
          // Ctrl+C
          lineBufferRef.current = "";
          term.write("^C\r\n");
          writePrompt();
          break;
        }
        default: {
          // Printable characters
          if (data >= " " || data.charCodeAt(0) > 127) {
            lineBufferRef.current += data;
            term.write(data);
          }
          break;
        }
      }
    });

    // Resize handler - only fit columns, keep rows fixed
    const handleResize = () => {
      const term = xtermRef.current;
      if (!term || !fitAddon) return;
      try {
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          term.resize(dims.cols, term.rows);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("resize", handleResize);

    // Initial column fit
    setTimeout(handleResize, 50);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize rows + columns when expand state changes
  useEffect(() => {
    const term = xtermRef.current;
    const fitAddon = fitAddonRef.current;
    if (!term || !fitAddon) return;

    const targetRows = isExpanded ? EXPANDED_ROWS : DEFAULT_ROWS;
    setTimeout(() => {
      try {
        const dims = fitAddon.proposeDimensions();
        const cols = dims ? dims.cols : term.cols;
        term.resize(cols, targetRows);
      } catch {
        // ignore
      }
    }, 60);
  }, [isExpanded]);

  return (
    <div className={`terminal-window ${isExpanded ? "terminal-expanded" : ""}`}>
      <TerminalHeader
        onClose={onClose}
        onExpand={() => setIsExpanded((v) => !v)}
        isExpanded={isExpanded}
      />
      <div className="terminal-body">
        <div ref={termRef} className="xterm-container" />
        {matrixActive && <MatrixRain />}
      </div>
    </div>
  );
}

export default Terminal;

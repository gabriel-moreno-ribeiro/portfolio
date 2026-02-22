import { useCallback } from "react";
import { useTerminalStore } from "../store/terminalStore";
import { useThemeStore } from "../store/themeStore";
import {
  commandRegistry,
  getFileSystem,
  parseInput,
  CommandContext,
} from "../constants/terminal/commands";

export function useTerminalCommands() {
  const {
    currentDirectory,
    addOutput,
    addInputLine,
    clearOutput,
    setDirectory,
    addToHistory,
    setMatrixActive,
    setAiLoading,
  } = useTerminalStore();
  const { toggleDarkMode } = useThemeStore();

  const executeCommand = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      addInputLine(trimmed, currentDirectory);
      addToHistory(trimmed);

      const { command, args, flags } = parseInput(trimmed);
      const cmd = commandRegistry.get(command);

      if (!cmd) {
        addOutput([
          { type: "error", content: `Command not found: ${command}` },
          {
            type: "output",
            content: 'Type "help" to see available commands.',
          },
        ]);
        return;
      }

      const ctx: CommandContext = {
        args,
        flags,
        currentDirectory,
        setDirectory,
        addOutput,
        clearOutput,
        toggleTheme: toggleDarkMode,
        setMatrixActive,
        setAiLoading,
        fileSystem: getFileSystem(),
        rawInput: trimmed,
      };

      await cmd.execute(ctx);
    },
    [
      currentDirectory,
      addOutput,
      addInputLine,
      clearOutput,
      setDirectory,
      addToHistory,
      setMatrixActive,
      setAiLoading,
      toggleDarkMode,
    ]
  );

  return { executeCommand };
}

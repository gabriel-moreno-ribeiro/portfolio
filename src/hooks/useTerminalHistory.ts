import { useCallback } from "react";
import { useTerminalStore } from "../store/terminalStore";

export function useTerminalHistory() {
  const { commandHistory, historyIndex, setHistoryIndex } = useTerminalStore();

  const historyUp = useCallback((): string => {
    if (commandHistory.length === 0) return "";
    const newIndex =
      historyIndex === -1
        ? commandHistory.length - 1
        : Math.max(0, historyIndex - 1);
    setHistoryIndex(newIndex);
    return commandHistory[newIndex] || "";
  }, [commandHistory, historyIndex, setHistoryIndex]);

  const historyDown = useCallback((): string => {
    if (commandHistory.length === 0 || historyIndex === -1) return "";
    const newIndex = historyIndex + 1;
    if (newIndex >= commandHistory.length) {
      setHistoryIndex(-1);
      return "";
    }
    setHistoryIndex(newIndex);
    return commandHistory[newIndex] || "";
  }, [commandHistory, historyIndex, setHistoryIndex]);

  return { historyUp, historyDown };
}

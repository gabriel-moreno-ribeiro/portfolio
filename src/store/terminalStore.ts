import { create } from "zustand";

export interface OutputLine {
  id: string;
  type: "input" | "output" | "error" | "system";
  content: string;
  directory?: string;
}

interface TerminalState {
  outputLines: OutputLine[];
  currentDirectory: string;
  commandHistory: string[];
  historyIndex: number;
  isBooted: boolean;
  matrixActive: boolean;
  isAiLoading: boolean;

  addOutput: (lines: Omit<OutputLine, "id">[]) => void;
  addInputLine: (input: string, directory: string) => void;
  clearOutput: () => void;
  setDirectory: (dir: string) => void;
  addToHistory: (command: string) => void;
  setHistoryIndex: (index: number) => void;
  setBooted: (booted: boolean) => void;
  setMatrixActive: (active: boolean) => void;
  setAiLoading: (loading: boolean) => void;
}

let lineCounter = 0;
const nextId = () => `line-${++lineCounter}`;

export const useTerminalStore = create<TerminalState>((set) => ({
  outputLines: [],
  currentDirectory: "~",
  commandHistory: [],
  historyIndex: -1,
  isBooted: false,
  matrixActive: false,
  isAiLoading: false,

  addOutput: (lines) =>
    set((state) => ({
      outputLines: [
        ...state.outputLines,
        ...lines.map((l) => ({ ...l, id: nextId() })),
      ],
    })),

  addInputLine: (input, directory) =>
    set((state) => ({
      outputLines: [
        ...state.outputLines,
        { id: nextId(), type: "input" as const, content: input, directory },
      ],
    })),

  clearOutput: () => set({ outputLines: [] }),

  setDirectory: (dir) => set({ currentDirectory: dir }),

  addToHistory: (command) =>
    set((state) => ({
      commandHistory: [...state.commandHistory, command],
      historyIndex: -1,
    })),

  setHistoryIndex: (index) => set({ historyIndex: index }),
  setBooted: (booted) => set({ isBooted: booted }),
  setMatrixActive: (active) => set({ matrixActive: active }),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
}));

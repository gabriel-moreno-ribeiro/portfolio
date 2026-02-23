import { useInputSourceStore } from "../store/inputSourceStore";

export function useHandPositions() {
  return useInputSourceStore((s) => s.handPositions);
}

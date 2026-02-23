import { useInputSourceStore } from "../store/inputSourceStore";

export function useHeadPosition() {
  return useInputSourceStore((s) => s.headPosition);
}

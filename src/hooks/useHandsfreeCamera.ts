import { useEffect } from "react";
import {
  startCameraInput,
  stopCameraInput,
} from "../providers/CameraInputProvider";
import { useHandsfreeStore } from "../store/handsfreeStore";

export function useHandsfreeCamera() {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const isSecondary = useHandsfreeStore((s) => s.isSecondary);

  // Auto-enable camera for secondary windows (no intro modal needed)
  useEffect(() => {
    if (isSecondary && !isEnabled) {
      useHandsfreeStore.getState().setEnabled(true);
    }
  }, [isSecondary]);

  useEffect(() => {
    if (!isEnabled) {
      stopCameraInput();
      return;
    }

    let cancelled = false;

    startCameraInput().catch(() => {
      if (!cancelled) {
        useHandsfreeStore.getState().setEnabled(false);
      }
    });

    return () => {
      cancelled = true;
      stopCameraInput();
    };
  }, [isEnabled]);
}

import { useEffect } from "react";
import {
  startCameraInput,
  stopCameraInput,
} from "../providers/CameraInputProvider";
import { useHandsfreeStore } from "../store/handsfreeStore";

export function useHandsfreeCamera() {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);

  useEffect(() => {
    if (!isEnabled) {
      stopCameraInput();
      return;
    }

    let cancelled = false;

    // The tutorial waits for a working camera: shown on a timer, it popped up
    // over the "camera blocked" card.
    startCameraInput()
      .then(() => {
        if (!cancelled) useHandsfreeStore.getState().setShowGestureTutorial(true);
      })
      .catch(() => {
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

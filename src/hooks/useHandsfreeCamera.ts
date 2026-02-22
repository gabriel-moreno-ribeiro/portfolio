import { useEffect } from "react";
import {
  startCameraInput,
  stopCameraInput,
} from "../providers/CameraInputProvider";
import { useHandsfreeStore } from "../store/handsfreeStore";
import { useIsFollowing } from "../store/windowSyncStore";

export function useHandsfreeCamera() {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const isFollowing = useIsFollowing();

  useEffect(() => {
    // Following windows get camera data via WindowSyncProvider
    if (isFollowing || !isEnabled) {
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
  }, [isEnabled, isFollowing]);
}

import React from "react";
import { usePeerCount } from "../../store/windowSyncStore";
import useIsMobile from "../../hooks/useIsMobile";

const SyncStatusIndicator: React.FC = () => {
  const peerCount = usePeerCount();
  const isMobile = useIsMobile();

  if (isMobile || peerCount === 0) return null;

  const totalWindows = peerCount + 1;

  const openNewWindow = () => {
    const w = Math.round(window.innerWidth * 0.8);
    const h = Math.round(window.innerHeight * 0.8);
    const left = window.screenX + window.innerWidth + 10;
    const top = window.screenY;
    window.open(
      window.location.origin + window.location.pathname,
      "_blank",
      `width=${w},height=${h},left=${left},top=${top}`
    );
  };

  return (
    <div className="sync-status-indicator">
      <div className="sync-status-indicator__dot" />
      <span className="sync-status-indicator__label">
        {totalWindows} synced
      </span>
      <button
        className="sync-status-indicator__add"
        onClick={openNewWindow}
        title="Open synced window"
      >
        +
      </button>
    </div>
  );
};

export default SyncStatusIndicator;

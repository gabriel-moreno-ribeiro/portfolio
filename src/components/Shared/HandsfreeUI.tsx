// Everything the handsfree (camera) mode needs on screen. Loaded on demand
// so visitors who never touch the camera button don't pay for it.
import CameraFeedback from "./CameraFeedback";
import GestureTutorial from "./GestureTutorial";
import HandCursor from "./HandCursor";
import HandsfreeIntroModal from "./HandsfreeIntroModal";
import HandsfreeLoader from "./HandsfreeLoader";

export default function HandsfreeUI() {
  return (
    <>
      <HandsfreeIntroModal />
      <GestureTutorial />
      <HandsfreeLoader />
      <CameraFeedback />
      <HandCursor />
    </>
  );
}

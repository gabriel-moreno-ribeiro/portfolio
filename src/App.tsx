import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CameraFeedback from "./components/Shared/CameraFeedback";
import CustomMouse from "./components/Shared/CustomMouse";
import FunLens from "./components/Shared/FunLens";
import GestureTutorial from "./components/Shared/GestureTutorial";
import HandCursor from "./components/Shared/HandCursor";
import DarkModeButton from "./components/Shared/DarkModeButton";
import HandsfreeButton from "./components/Shared/HandsfreeButton";
import HandsfreeIntroModal from "./components/Shared/HandsfreeIntroModal";
import HandsfreeLoader from "./components/Shared/HandsfreeLoader";
import HorizontalScroller from "./components/Shared/HorizontalScroller";
import TerminalButton from "./components/Shared/TerminalButton";
import TerminalModal from "./components/Terminal/TerminalModal";
import WindowRenderer from "./components/WindowManager/WindowRenderer";
import { useHandsfreeCamera } from "./hooks/useHandsfreeCamera";
import useIsMobile from "./hooks/useIsMobile";
import Home from "./pages/Home";
import {
  startMouseInputProvider,
  stopMouseInputProvider,
} from "./providers/MouseInputProvider";
import { useHandsfreeStore } from "./store/handsfreeStore";
import { useThemeStore } from "./store/themeStore";

function App() {
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile();
  const { hasSeenIntro, setShowIntroModal } = useHandsfreeStore();

  // Show the hands mode choice popup as soon as the site opens (first visit)
  useEffect(() => {
    if (isMobile || hasSeenIntro) return;
    if (!navigator.mediaDevices?.getUserMedia) return;
    const timer = setTimeout(() => setShowIntroModal(true), 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, hasSeenIntro]);

  useEffect(() => {
    startMouseInputProvider();
    return () => {
      stopMouseInputProvider();
    };
  }, []);

  useHandsfreeCamera();

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    if (!isMobile) {
      if (sessionStorage.getItem("showedToast")) return;
      setTimeout(() => {
        toast("Just for fun, try pressing Ctrl + J!", {
          position: "bottom-right",
          autoClose: 1000 * 10,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: darkMode ? "light" : "dark",
        });
        sessionStorage.setItem("showedToast", "true");
      }, 3000);
    }
  }, [isMobile]);

  return (
    <div className="app">
      <HorizontalScroller />
      <Home />
      <HandsfreeButton />
      <DarkModeButton />
      <TerminalButton />
      {/* These components manage their own visibility via stores */}
      <HandsfreeIntroModal />
      <GestureTutorial />
      {/* TerminalModal only handles keyboard shortcuts; rendering is in WindowRenderer */}
      <TerminalModal />
      {/* WindowRenderer renders all managed windows + dock */}
      <WindowRenderer />
      <HandsfreeLoader />
      <CameraFeedback />
      <HandCursor />
      <CustomMouse />
      <FunLens />
      <ToastContainer />
    </div>
  );
}

export default App;

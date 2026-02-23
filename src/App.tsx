import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CameraFeedback from "./components/Shared/CameraFeedback";
import CustomMouse from "./components/Shared/CustomMouse";
import GestureTutorial from "./components/Shared/GestureTutorial";
import HandCursor from "./components/Shared/HandCursor";
import DarkModeButton from "./components/Shared/DarkModeButton";
import HandsfreeButton from "./components/Shared/HandsfreeButton";
import HandsfreeIntroModal from "./components/Shared/HandsfreeIntroModal";
import HorizontalScroller from "./components/Shared/HorizontalScroller";
import TerminalModal from "./components/Terminal/TerminalModal";
import { useHandsfreeCamera } from "./hooks/useHandsfreeCamera";
import useIsMobile from "./hooks/useIsMobile";
import Home from "./pages/Home";
import {
  startMouseInputProvider,
  stopMouseInputProvider,
} from "./providers/MouseInputProvider";
import { useThemeStore } from "./store/themeStore";

function App() {
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile();

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
        toast("Just for fun, try pressing Ctrl + K!", {
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
      <HandsfreeIntroModal />
      <GestureTutorial />
      <CameraFeedback />
      <HandCursor />
      <CustomMouse />
      <TerminalModal />
      <ToastContainer />
    </div>
  );
}

export default App;

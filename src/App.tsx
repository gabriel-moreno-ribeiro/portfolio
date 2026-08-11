import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CameraFeedback from "./components/Shared/CameraFeedback";
import CustomMouse from "./components/Shared/CustomMouse";
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

const Library = lazy(() => import("./pages/Library"));
const HeroSlideshow = lazy(() => import("./components/Home/HeroSlideshow"));

function App() {
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile();
  const { hasSeenIntro, setShowIntroModal } = useHandsfreeStore();

  // Modal is triggered only by the HandsfreeButton click — never auto-opens.

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
    <BrowserRouter>
      <div className="app">
        <Suspense fallback={null}>
          <HeroSlideshow />
        </Suspense>
        <HorizontalScroller />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/library" element={<Library />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
        <HandsfreeButton />
        <DarkModeButton />
        <TerminalButton />
        <HandsfreeIntroModal />
        <GestureTutorial />
        <TerminalModal />
        <WindowRenderer />
        <HandsfreeLoader />
        <CameraFeedback />
        <HandCursor />
        <CustomMouse />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;

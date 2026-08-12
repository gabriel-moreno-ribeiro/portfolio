import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

const HeroSlideshow = lazy(() => import("./components/Home/HeroSlideshow"));
const LibraryPage = lazy(() => import("./pages/Library"));

function App() {
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile();
  const { hasSeenIntro, setShowIntroModal } = useHandsfreeStore();

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
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isLibrary = location.pathname.startsWith("/library");

  return (
    <div className="app">
      {!isLibrary && (
        <Suspense fallback={null}>
          <HeroSlideshow />
        </Suspense>
      )}
      {!isLibrary && <HorizontalScroller />}
      <Suspense fallback={isLibrary ? <div style={{ width: "100%", height: "100dvh", background: "var(--bg)" }} /> : null}>
        <Routes>
          <Route path="/library/:bookId?" element={<LibraryPage />} />
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
  );
}

export default App;

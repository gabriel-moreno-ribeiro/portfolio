import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import CustomMouse from "./components/Shared/CustomMouse";
import DarkModeButton from "./components/Shared/DarkModeButton";
import HandsfreeButton from "./components/Shared/HandsfreeButton";
import HorizontalScroller from "./components/Shared/HorizontalScroller";
import TerminalButton from "./components/Shared/TerminalButton";
import TerminalModal from "./components/Terminal/TerminalModal";
import WindowRenderer from "./components/WindowManager/WindowRenderer";
import { useHandsfreeCamera } from "./hooks/useHandsfreeCamera";
import useIsMobile from "./hooks/useIsMobile";
import MobileStickyCTA from "./components/Shared/MobileStickyCTA";
import Home from "./pages/Home";
import {
  startMouseInputProvider,
  stopMouseInputProvider,
} from "./providers/MouseInputProvider";
import { useHandsfreeStore } from "./store/handsfreeStore";
import { useWindowManagerStore } from "./store/windowManagerStore";

const HandsfreeUI = lazy(() => import("./components/Shared/HandsfreeUI"));
const HeroSlideshow = lazy(() => import("./components/Home/HeroSlideshow"));
const LibraryPage = lazy(() => import("./pages/Library"));
const BlogPage = lazy(() => import("./pages/Blog"));
const NewsPage = lazy(() => import("./pages/News"));
const ContactPage = lazy(() => import("./pages/Contact"));
const ThankYouPage = lazy(() => import("./pages/ThankYou"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));

function App() {
  useEffect(() => {
    startMouseInputProvider();
    return () => {
      stopMouseInputProvider();
    };
  }, []);

  useHandsfreeCamera();

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isLibrary = location.pathname.startsWith("/library");
  const isMobile = useIsMobile();
  const handsfreeFlags = useHandsfreeStore((s) => s.isEnabled || s.showIntroModal);
  const handsfreeWindow = useWindowManagerStore((s) => !!s.windows["handsfree-intro"] || !!s.windows["gesture-tutorial"]);
  const handsfreeActive = handsfreeFlags || handsfreeWindow;
  const [tip, setTip] = useState(false);

  useEffect(() => {
    if (isMobile || window.innerWidth <= 1024 || sessionStorage.getItem("showedToast")) return;
    const show = setTimeout(() => {
      setTip(true);
      sessionStorage.setItem("showedToast", "true");
    }, 3000);
    const hide = setTimeout(() => setTip(false), 13000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [isMobile]);

  return (
    <div className="app">
      {isHome && (
        <Suspense fallback={null}>
          <HeroSlideshow />
        </Suspense>
      )}
      {isHome && <HorizontalScroller />}
      <Suspense fallback={!isHome ? <div style={{ width: "100%", height: "100dvh", background: "var(--bg)" }} /> : null}>
        <Routes>
          <Route path="/library/:bookId?" element={<LibraryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/obrigado" element={<ThankYouPage />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <HandsfreeButton />
      <DarkModeButton />
      <TerminalButton />
      <TerminalModal />
      <WindowRenderer />
      {handsfreeActive && (
        <Suspense fallback={null}>
          <HandsfreeUI />
        </Suspense>
      )}
      <CustomMouse />
      {!isLibrary && <MobileStickyCTA />}
      {tip && (
        <button type="button" className="tip-toast" onClick={() => setTip(false)}>
          Just for fun, try pressing Ctrl + K!
        </button>
      )}
    </div>
  );
}

export default App;
